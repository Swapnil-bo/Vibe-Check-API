from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class EmotionCategory(str, Enum):
    JOY = "joy"
    ANGER = "anger"
    SADNESS = "sadness"
    FEAR = "fear"
    DISGUST = "disgust"
    SURPRISE = "surprise"
    ANTICIPATION = "anticipation"
    TRUST = "trust"
    NEUTRAL = "neutral"

class IntentCategory(str, Enum):
    INFORM = "inform"
    PERSUADE = "persuade"
    REQUEST = "request"
    VENT = "vent"
    THREATEN = "threaten"
    COMPLIMENT = "compliment"
    COMPLAIN = "complain"
    DEFLECT = "deflect"
    MANIPULATE = "manipulate"
    UNCLEAR = "unclear"

class VibeLevel(str, Enum):
    TOXIC = "toxic"           # 0–20
    LOW = "low"               # 21–40
    NEUTRAL = "neutral"       # 41–60
    WARM = "warm"             # 61–80
    POSITIVE = "positive"     # 81–100


# ─── Sub-models ───────────────────────────────────────────────────────────────

class EmotionDetail(BaseModel):
    primary: str = Field(..., description="Primary emotion detected")
    secondary: Optional[str] = Field(None, description="Underlying or masked emotion")
    intensity: int = Field(..., ge=0, le=100, description="Intensity of emotion 0–100")
    category: EmotionCategory

class ToneProfile(BaseModel):
    tags: List[str] = Field(..., description="Tone tags e.g. #passive, #sarcastic")
    formality: int = Field(..., ge=0, le=100, description="0 = very casual, 100 = very formal")
    aggression: int = Field(..., ge=0, le=100, description="0 = calm, 100 = highly aggressive")
    warmth: int = Field(..., ge=0, le=100, description="0 = cold, 100 = very warm")

class RedFlag(BaseModel):
    flag: str = Field(..., description="Short label for the red flag")
    explanation: str = Field(..., description="Why this word/phrase is a red flag")
    severity: int = Field(..., ge=1, le=5, description="Severity level 1–5")

class VibeScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall vibe score 0–100")
    level: VibeLevel
    confidence: int = Field(..., ge=0, le=100, description="Model confidence in this score")


# ─── Request ──────────────────────────────────────────────────────────────────

class VibeRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=2000, description="Text to analyze")

    @field_validator("text")
    @classmethod
    def strip_and_check(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Text cannot be empty or whitespace.")
        return v


# ─── Response ─────────────────────────────────────────────────────────────────

class VibeResponse(BaseModel):
    summary: str = Field(..., description="One-line overall vibe read")
    emotion: EmotionDetail
    intent: IntentCategory
    intent_explanation: str = Field(..., description="Why this intent was detected")
    tone: ToneProfile
    vibe: VibeScore
    red_flags: List[RedFlag]
    rewrite_suggestion: Optional[str] = Field(None, description="A better version of the text if needed")
    word_count: int = Field(..., description="Word count of the original input")

    model_config = {
        "json_schema_extra": {
            "example": {
                "summary": "Professionally masked frustration with an urgency push.",
                "emotion": {
                    "primary": "Frustration",
                    "secondary": "Anxiety",
                    "intensity": 72,
                    "category": "anger"
                },
                "intent": "request",
                "intent_explanation": "Seeking action while appearing polite.",
                "tone": {
                    "tags": ["#passive", "#impatient", "#professional"],
                    "formality": 70,
                    "aggression": 40,
                    "warmth": 25
                },
                "vibe": {
                    "score": 38,
                    "level": "low",
                    "confidence": 85
                },
                "red_flags": [
                    {
                        "flag": "Softener overuse",
                        "explanation": "'just' is used to downplay urgency while still applying pressure.",
                        "severity": 3
                    }
                ],
                "rewrite_suggestion": "Hey, could you update me on this by EOD? I want to make sure we're not blocked.",
                "word_count": 14
            }
        }
    }