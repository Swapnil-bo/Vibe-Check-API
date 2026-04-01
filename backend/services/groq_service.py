import json
import time
import logging
from typing import Optional, Tuple
from groq import Groq, APIConnectionError, APITimeoutError, RateLimitError, APIStatusError
from backend.models.schemas import VibeResponse, EmotionDetail, ToneProfile, RedFlag, VibeScore
from backend.prompts.vibe_prompt import SYSTEM_PROMPT, build_user_prompt
from dotenv import load_dotenv
import os

load_dotenv()

# ─── Logger ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("vibe_service")


# ─── Constants ────────────────────────────────────────────────────────────────

MODEL            = "llama-3.3-70b-versatile"
MAX_TOKENS       = 1024
TEMPERATURE      = 0.4        # Low enough for consistency, high enough for nuance
MAX_RETRIES      = 3
RETRY_DELAY      = 1.5        # seconds between retries (exponential backoff applied)
REQUEST_TIMEOUT  = 30         # seconds


# ─── Groq Client ──────────────────────────────────────────────────────────────

def _get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is not set. Add it to your .env file."
        )
    return Groq(api_key=api_key, timeout=REQUEST_TIMEOUT)


# ─── Raw Groq Call ────────────────────────────────────────────────────────────

def _call_groq(
    client: Groq,
    user_prompt: str,
    attempt: int
) -> Tuple[str, dict]:
    """
    Makes a single Groq API call.
    Returns (raw_text, usage_stats).
    """
    logger.info(f"Groq call — attempt {attempt}/{MAX_RETRIES} | model: {MODEL}")

    start = time.monotonic()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        stream=False,
    )

    elapsed = round(time.monotonic() - start, 3)

    raw_text = response.choices[0].message.content.strip()

    usage = {
        "prompt_tokens":     response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens":      response.usage.total_tokens,
        "latency_seconds":   elapsed,
        "model":             MODEL,
        "attempt":           attempt,
    }

    logger.info(
        f"Groq response received | "
        f"{elapsed}s | "
        f"{usage['total_tokens']} tokens | "
        f"attempt {attempt}"
    )

    return raw_text, usage


# ─── JSON Extractor ───────────────────────────────────────────────────────────

def _extract_json(raw: str) -> dict:
    """
    Safely extracts JSON from the LLM response.
    Handles edge cases like markdown fences or leading/trailing text.
    """
    # Strip markdown code fences if the model disobeys
    if "```" in raw:
        lines = raw.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try finding JSON object boundaries
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from response:\n{raw[:300]}")


# ─── Response Validator & Builder ─────────────────────────────────────────────

def _build_vibe_response(data: dict, original_text: str) -> VibeResponse:
    """
    Validates the raw dict from Groq and constructs a typed VibeResponse.
    Provides safe fallbacks for missing optional fields.
    """
    # ── Validate vibe score vs level consistency ──────────────────────────────
    score = int(data["vibe"]["score"])
    level = data["vibe"]["level"]

    expected_level = (
        "toxic"    if score <= 20 else
        "low"      if score <= 40 else
        "neutral"  if score <= 60 else
        "warm"     if score <= 80 else
        "positive"
    )

    if level != expected_level:
        logger.warning(
            f"Vibe level mismatch — model said '{level}' "
            f"but score {score} maps to '{expected_level}'. Auto-correcting."
        )
        level = expected_level

    # ── Validate word count ───────────────────────────────────────────────────
    actual_word_count   = len(original_text.split())
    returned_word_count = int(data.get("word_count", actual_word_count))

    if abs(returned_word_count - actual_word_count) > 3:
        logger.warning(
            f"Word count mismatch — model returned {returned_word_count}, "
            f"actual is {actual_word_count}. Using actual."
        )
        returned_word_count = actual_word_count

    # ── Build sub-models ──────────────────────────────────────────────────────
    emotion_data = data["emotion"]
    emotion = EmotionDetail(
        primary   = emotion_data["primary"],
        secondary = emotion_data.get("secondary"),
        intensity = int(emotion_data["intensity"]),
        category  = emotion_data["primary"],  # category mirrors primary
    )

    tone_data = data["tone"]
    tone = ToneProfile(
        tags       = tone_data.get("tags", []),
        formality  = int(tone_data.get("formality", 50)),
        aggression = int(tone_data.get("aggression", 50)),
        warmth     = int(tone_data.get("warmth", 50)),
    )

    vibe = VibeScore(
        score      = score,
        level      = level,
        confidence = int(data["vibe"].get("confidence", 75)),
    )

    red_flags = [
        RedFlag(
            flag        = rf["flag"],
            explanation = rf["explanation"],
            severity    = int(rf["severity"]),
        )
        for rf in data.get("red_flags", [])
    ]

    return VibeResponse(
        summary             = data["summary"],
        emotion             = emotion,
        intent              = data["intent"],
        intent_explanation  = data["intent_explanation"],
        tone                = tone,
        vibe                = vibe,
        red_flags           = red_flags,
        rewrite_suggestion  = data.get("rewrite_suggestion"),
        word_count          = returned_word_count,
    )


# ─── Retry Wrapper ────────────────────────────────────────────────────────────

def _call_with_retry(client: Groq, user_prompt: str) -> Tuple[str, dict]:
    """
    Calls Groq with exponential backoff retry on transient errors.
    Raises on non-retriable errors immediately.
    """
    last_error: Optional[Exception] = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return _call_groq(client, user_prompt, attempt)

        except RateLimitError as e:
            wait = RETRY_DELAY * (2 ** (attempt - 1))
            logger.warning(f"Rate limited. Waiting {wait}s before retry...")
            time.sleep(wait)
            last_error = e

        except APITimeoutError as e:
            wait = RETRY_DELAY * attempt
            logger.warning(f"Timeout on attempt {attempt}. Waiting {wait}s...")
            time.sleep(wait)
            last_error = e

        except APIConnectionError as e:
            wait = RETRY_DELAY * attempt
            logger.warning(f"Connection error on attempt {attempt}. Waiting {wait}s...")
            time.sleep(wait)
            last_error = e

        except APIStatusError as e:
            # 5xx → retry. 4xx → fail immediately.
            if e.status_code >= 500:
                wait = RETRY_DELAY * attempt
                logger.warning(f"Groq 5xx ({e.status_code}). Waiting {wait}s...")
                time.sleep(wait)
                last_error = e
            else:
                logger.error(f"Groq 4xx error ({e.status_code}): {e.message}")
                raise

    raise RuntimeError(
        f"Groq API failed after {MAX_RETRIES} attempts. "
        f"Last error: {last_error}"
    )


# ─── Main Service Function ────────────────────────────────────────────────────

def analyze_vibe(text: str, text_type: str = "unknown") -> Tuple[VibeResponse, dict]:
    """
    Full pipeline:
      1. Build prompt
      2. Call Groq with retry
      3. Extract JSON
      4. Validate + build VibeResponse
      5. Return (VibeResponse, usage_metadata)

    Raises:
      EnvironmentError   — missing API key
      ValueError         — JSON extraction or schema mismatch
      RuntimeError       — all retries exhausted
    """
    client      = _get_client()
    user_prompt = build_user_prompt(text, text_type)

    logger.info(f"Analyzing text | type: {text_type} | words: {len(text.split())}")

    # ── Step 1: Call Groq ─────────────────────────────────────────────────────
    raw_text, usage = _call_with_retry(client, user_prompt)

    # ── Step 2: Extract JSON ──────────────────────────────────────────────────
    try:
        data = _extract_json(raw_text)
    except ValueError as e:
        logger.error(f"JSON extraction failed: {e}")
        raise

    # ── Step 3: Build & validate typed response ───────────────────────────────
    try:
        vibe_response = _build_vibe_response(data, text)
    except (KeyError, TypeError, ValueError) as e:
        logger.error(f"Response validation failed: {e} | raw data: {data}")
        raise ValueError(f"Groq response failed schema validation: {e}")

    logger.info(
        f"Analysis complete | "
        f"score: {vibe_response.vibe.score} | "
        f"level: {vibe_response.vibe.level} | "
        f"emotion: {vibe_response.emotion.primary} | "
        f"flags: {len(vibe_response.red_flags)}"
    )

    return vibe_response, usage