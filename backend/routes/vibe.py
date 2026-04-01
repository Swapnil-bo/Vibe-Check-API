import time
import logging
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse
from backend.models.schemas import VibeRequest, VibeResponse
from backend.services.groq_service import analyze_vibe

# ─── Logger ───────────────────────────────────────────────────────────────────

logger = logging.getLogger("vibe_route")

# ─── Router ───────────────────────────────────────────────────────────────────

router = APIRouter(
    prefix="/api",
    tags=["VibeCheck"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────

@router.get(
    "/health",
    summary="Health check",
    description="Returns service status. Use this to verify the API is alive.",
)
async def health():
    return {
        "status":  "ok",
        "service": "VibeCheck API",
        "version": "1.0.0",
    }


# ─── Main Analyze Endpoint ────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=VibeResponse,
    summary="Analyze the vibe of any text",
    description="""
Paste any text — a tweet, email, Slack message, DM, or review —
and get back a full emotional and intent breakdown including:

- **Dominant emotion** with intensity score
- **Intent classification** with explanation
- **Tone profile** (formality, aggression, warmth + tags)
- **Vibe score** (0–100) with level classification
- **Red flags** with severity ratings
- **Rewrite suggestion** if the vibe score is low
- **Word count** of the input
    """,
    responses={
        200: {"description": "Successful vibe analysis"},
        400: {"description": "Input text is empty or invalid"},
        422: {"description": "Request body validation failed"},
        429: {"description": "Groq rate limit hit — try again shortly"},
        500: {"description": "Internal server error — analysis failed"},
        503: {"description": "Groq API unreachable"},
    },
)
async def analyze(request: Request, body: VibeRequest):

    # ── Input guard ───────────────────────────────────────────────────────────
    text = body.text.strip()

    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty."
        )

    if len(text.split()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is too short to analyze meaningfully. Please provide at least 2 words."
        )

    # ── Detect text type from optional header ─────────────────────────────────
    text_type = request.headers.get("X-Text-Type", "unknown").lower()

    VALID_TEXT_TYPES = {"tweet", "email", "slack/chat", "review", "text_message", "unknown"}
    if text_type not in VALID_TEXT_TYPES:
        text_type = "unknown"

    # ── Log incoming request ──────────────────────────────────────────────────
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"Analyze request | "
        f"ip: {client_ip} | "
        f"text_type: {text_type} | "
        f"words: {len(text.split())} | "
        f"chars: {len(text)}"
    )

    # ── Call service ──────────────────────────────────────────────────────────
    request_start = time.monotonic()

    try:
        vibe_response, usage = analyze_vibe(text, text_type)

    except EnvironmentError as e:
        logger.critical(f"Missing API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service is misconfigured. API key missing."
        )

    except RuntimeError as e:
        error_msg = str(e).lower()
        if "rate" in error_msg:
            logger.warning(f"Rate limit hit: {e}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Groq rate limit reached. Please wait a moment and try again."
            )
        elif "timeout" in error_msg or "connection" in error_msg:
            logger.error(f"Groq unreachable: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not reach the analysis service. Please try again shortly."
            )
        else:
            logger.error(f"Runtime error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed after multiple attempts. Please try again."
            )

    except ValueError as e:
        logger.error(f"Validation/parsing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis produced an unexpected response. Please try again."
        )

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )

    # ── Log completion ────────────────────────────────────────────────────────
    total_time = round(time.monotonic() - request_start, 3)

    logger.info(
        f"Request complete | "
        f"{total_time}s total | "
        f"score: {vibe_response.vibe.score} | "
        f"level: {vibe_response.vibe.level} | "
        f"tokens: {usage.get('total_tokens', '?')} | "
        f"groq_latency: {usage.get('latency_seconds', '?')}s"
    )

    return vibe_response


# ─── Demo Endpoint (no Groq call — for UI testing) ────────────────────────────

@router.get(
    "/demo",
    response_model=VibeResponse,
    summary="Returns a hardcoded demo response",
    description="Use this to test the frontend without consuming Groq API credits.",
)
async def demo():
    from backend.models.schemas import (
        EmotionDetail, EmotionCategory,
        ToneProfile, RedFlag, VibeScore, VibeLevel, IntentCategory
    )

    return VibeResponse(
        summary="Professionally masked impatience — polite surface, pressured core.",
        emotion=EmotionDetail(
            primary=EmotionCategory.ANTICIPATION,
            secondary=EmotionCategory.ANGER,
            intensity=68,
            category=EmotionCategory.ANGER,
        ),
        intent=IntentCategory.REQUEST,
        intent_explanation="Framed as casual but 'again' signals repeated asks and building frustration.",
        tone=ToneProfile(
            tags=["#passive-aggressive", "#overpolite", "#impatient"],
            formality=65,
            aggression=42,
            warmth=22,
        ),
        vibe=VibeScore(
            score=34,
            level=VibeLevel.LOW,
            confidence=88,
        ),
        red_flags=[
            RedFlag(
                flag="Softener: 'just'",
                explanation="'just' minimizes the request while masking repeated pressure.",
                severity=2,
            ),
            RedFlag(
                flag="Implied urgency: 'again'",
                explanation="'again' signals this isn't the first follow-up — quiet escalation.",
                severity=3,
            ),
        ],
        rewrite_suggestion="Hey! Could you give me an update on this when you have a moment? I want to make sure I'm not blocking anything.",
        word_count=16,
    )