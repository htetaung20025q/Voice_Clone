"""
Pydantic schemas for Myanmar TTS requests and responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


from app.config import SUPPORTED_VOICES, SUPPORTED_STYLES


class TTSRequest(BaseModel):
    """Schema for Text-to-Speech synthesis request."""
    
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The text content (Myanmar Unicode / English) to convert to speech.",
        examples=["မင်္ဂလာပါ ခင်ဗျာ။ BurmaVoice မှ ကြိုဆိုပါတယ်။"]
    )
    voice: str = Field(
        default="thiri",
        description="Myanmar Voice identifier: thiri, aung, may, min, nandar, kyaw (or Gemini names Kore, Puck, etc.).",
        examples=["thiri"]
    )
    style: Optional[str] = Field(
        default="natural",
        description="Speaking style: natural, professional, friendly, storytelling, news, calm.",
        examples=["natural"]
    )
    language: Optional[str] = Field(
        default="myanmar",
        description="Target language: myanmar, english, bilingual.",
        examples=["myanmar"]
    )
    speed: Optional[float] = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Audio playback speed multiplier (0.5x to 2.0x)."
    )
    pitch: Optional[float] = Field(
        default=0.0,
        ge=-1.0,
        le=1.0,
        description="Pitch adjustment factor (-1.0 to 1.0)."
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

    @field_validator("voice")
    @classmethod
    def validate_voice(cls, v: str) -> str:
        trimmed = v.strip().lower()
        if not trimmed:
            return "thiri"
        valid_ids = {voice["id"].lower() for voice in SUPPORTED_VOICES}
        valid_gemini = {voice["gemini_voice"].lower() for voice in SUPPORTED_VOICES}
        if trimmed not in valid_ids and trimmed not in valid_gemini:
            raise ValueError(f"Invalid voice '{v}'. Supported voices: {', '.join(sorted(valid_ids))}")
        return trimmed

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: Optional[str]) -> str:
        if not v:
            return "natural"
        trimmed = v.strip().lower()
        valid_styles = {style["id"].lower() for style in SUPPORTED_STYLES}
        if trimmed not in valid_styles:
            raise ValueError(f"Invalid style '{v}'. Supported styles: {', '.join(sorted(valid_styles))}")
        return trimmed


class TTSResponseMetadata(BaseModel):
    """Metadata describing generated TTS audio."""
    
    voice: str
    voice_name: str
    style: str
    language: str
    character_count: int
    duration_seconds: float
    format: str = "audio/wav"
    sample_rate: int = 24000
    latency_ms: float
    is_mock: bool = False


class TTSJsonResponse(BaseModel):
    """JSON response containing base64 audio data and generation metadata."""
    
    audio_base64: str = Field(..., description="Base64 encoded WAV audio bytes.")
    mime_type: str = Field(default="audio/wav")
    filename: str = Field(default="speech.wav")
    metadata: TTSResponseMetadata


class VoiceInfo(BaseModel):
    """Information about a supported Myanmar voice."""
    
    id: str
    name: str
    myanmar_name: str
    gemini_voice: str
    gender: str
    persona: str
    persona_mm: str
    tone: str
    sample_tag: str
    sample_text: str


class StyleInfo(BaseModel):
    """Information about a speaking style."""
    
    id: str
    name: str
    myanmar_name: str
    description: str
    prompt_instruction: str


class HealthResponse(BaseModel):
    """Health check endpoint response schema."""
    
    status: str
    version: str
    gemini_configured: bool
    model: str
    environment: str
