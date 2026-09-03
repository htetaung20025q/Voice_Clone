"""
Pydantic schemas for Gemini Voice Replication requests and responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class VoiceReplicationResponse(BaseModel):
    """Response returned when a temporary voice replication session is created."""
    success: bool = True
    voice_session_id: str = Field(..., description="Opaque server-side temporary session ID.")
    expires_at: str = Field(..., description="ISO-8601 timestamp when this replication key expires.")
    duration_seconds: float = Field(..., description="Duration of the source voice sample.")
    sample_rate: int = Field(default=24000, description="Normalized audio sample rate in Hertz.")
    message: str = Field(
        default="Voice replication session created successfully.",
        description="User-facing status message."
    )


class ReplicatedTTSRequest(BaseModel):
    """Request payload for synthesizing speech in a replicated voice."""
    voice_session_id: str = Field(
        ...,
        min_length=5,
        description="The temporary voice session ID returned from /api/v1/voice/replicate."
    )
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Burmese or English text to synthesize using the replicated voice.",
        examples=["မင်္ဂလာပါ။ ဒါက ကျွန်ုပ်ရဲ့ အသံနဲ့ ဖန်တီးထားတဲ့ စမ်းသပ်အသံ ဖြစ်ပါတယ်။"]
    )
    language_code: Optional[str] = Field(
        default="my-MM",
        description="BCP-47 language tag: my-MM (Burmese) or en-US (English).",
        examples=["my-MM"]
    )
    speed: Optional[float] = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Playback speed factor."
    )
    pitch: Optional[float] = Field(
        default=0.0,
        ge=-1.0,
        le=1.0,
        description="Pitch adjustment factor."
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Text cannot be empty or contain only whitespace.")
        if len(trimmed) > 5000:
            raise ValueError("Text exceeds maximum allowed length of 5000 characters.")
        return trimmed

    @field_validator("voice_session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("voice_session_id cannot be empty.")
        return trimmed


class VoiceConsentScript(BaseModel):
    """Consent script instructions and text for voice replication authorization."""
    id: str
    name: str
    consent_statement: str
    default_sample: str


class VoiceSessionStatus(BaseModel):
    """Current status and remaining validity of a temporary voice session."""
    voice_session_id: str
    is_valid: bool
    expires_at: str
    seconds_remaining: float
    duration_seconds: float
    sample_rate: int
