from pydantic import BaseModel
from typing import List, Optional

class VibeRequest(BaseModel):
    text: str

class VibeResponse(BaseModel):
    dominant_emotion: str
    intent: str
    tone_tags: List[str]
    vibe_score: int
    red_flags: List[str]
    rewrite_suggestion: Optional[str] = None
    summary: str