"""
Service for Google Cloud Gemini Voice Replication.
Implements the provider abstraction, secure session store (with 7-day TTL),
OAuth2 token resolution, and Voice Replication synthesis workflow.
"""

import os
import io
import time
import uuid
import json
import base64
import wave
import logging
import unicodedata
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional

import httpx
from app.config import settings
from app.services.audio_processor import audio_processor, AudioValidationError

logger = logging.getLogger("burmavoice.replication")


# Custom Structured Exceptions
class VoiceReplicationError(RuntimeError):
    """Base error for voice replication operations."""
    pass


class VoiceReplicationUnavailableError(VoiceReplicationError):
    """Raised when Voice Replication is not allowlisted or enabled on the GCP project."""
    pass


class VoiceReplicationAuthError(VoiceReplicationError):
    """Raised when GCP authentication credentials are missing or invalid."""
    pass


class VoiceReplicationConsentError(VoiceReplicationError):
    """Raised when the consent statement fails verification."""
    pass


class VoiceSessionNotFoundError(VoiceReplicationError):
    """Raised when a session ID does not exist or has expired."""
    pass


@dataclass
class VoiceSessionRecord:
    """Internal record for temporary voice replication sessions."""
    session_id: str
    voice_key: str  # Kept strictly server-side
    created_at: datetime
    expires_at: datetime
    duration_seconds: float
    sample_rate: int
    language_code: str
    is_mock: bool = False


class BaseVoiceReplicationProvider(ABC):
    """Abstract interface for Voice Replication engines."""

    @abstractmethod
    async def generate_key(
        self,
        source_wav: bytes,
        consent_wav: bytes,
        language_code: str = "my-MM"
    ) -> str:
        """Create a temporary voice replication key from reference and consent audio."""
        pass

    @abstractmethod
    async def synthesize(
        self,
        voice_key: str,
        text: str,
        language_code: str = "my-MM"
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Synthesize speech using the temporary voice replication key."""
        pass

    @abstractmethod
    def is_configured(self) -> Tuple[bool, str]:
        """Check if provider credentials and endpoints are ready."""
        pass


class GoogleCloudVoiceReplicationProvider(BaseVoiceReplicationProvider):
    """
    Production provider communicating with Google Cloud Text-to-Speech API
    (Chirp 3 / Instant Custom Voice endpoints).
    """

    GENERATE_KEY_URL = "https://texttospeech.googleapis.com/v1beta1/voices:generateVoiceCloningKey"
    SYNTHESIZE_URL = "https://texttospeech.googleapis.com/v1beta1/text:synthesize"

    def __init__(self):
        self._cached_token: Optional[str] = None
        self._token_expiry: float = 0.0

    def _get_access_token(self) -> str:
        """
        Obtain OAuth2 Bearer access token using Google Cloud service account or ADC.
        Falls back to informative error if no Google Cloud credentials are provided.
        """
        now = time.time()
        if self._cached_token and now < self._token_expiry - 60:
            return self._cached_token

        try:
            import google.auth
            import google.auth.transport.requests

            credentials = None

            # 1. Direct service account JSON string or file in settings
            if settings.GCP_SERVICE_ACCOUNT_JSON:
                from google.oauth2 import service_account
                if os.path.isfile(settings.GCP_SERVICE_ACCOUNT_JSON):
                    credentials = service_account.Credentials.from_service_account_file(
                        settings.GCP_SERVICE_ACCOUNT_JSON,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                else:
                    sa_info = json.loads(settings.GCP_SERVICE_ACCOUNT_JSON)
                    credentials = service_account.Credentials.from_service_account_info(
                        sa_info,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
            elif settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.isfile(settings.GOOGLE_APPLICATION_CREDENTIALS):
                from google.oauth2 import service_account
                credentials = service_account.Credentials.from_service_account_file(
                    settings.GOOGLE_APPLICATION_CREDENTIALS,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
            else:
                # 2. Application Default Credentials (ADC)
                credentials, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )

            if not credentials:
                raise VoiceReplicationAuthError(
                    "Google Cloud credentials are not configured. "
                    "Voice Replication requires Google Cloud service account or OAuth2 credentials. "
                    "Standard GEMINI_API_KEY does not grant Google Cloud Text-to-Speech Voice Replication access."
                )

            request = google.auth.transport.requests.Request()
            credentials.refresh(request)
            self._cached_token = credentials.token
            self._token_expiry = now + 3500.0  # Tokens usually valid for 1 hour
            return self._cached_token

        except VoiceReplicationAuthError:
            raise
        except Exception as e:
            logger.warning(f"Failed to obtain Google Cloud access token: {e}")
            raise VoiceReplicationAuthError(
                "Voice Replication requires Google Cloud credentials (service account or OAuth2 token). "
                f"Authentication error: {e}"
            )

    def is_configured(self) -> Tuple[bool, str]:
        """Verify credential availability without blocking startup."""
        try:
            token = self._get_access_token()
            return True, "Google Cloud authentication configured."
        except Exception as e:
            return False, str(e)

    async def generate_key(
        self,
        source_wav: bytes,
        consent_wav: bytes,
        language_code: str = "my-MM"
    ) -> str:
        """
        Send reference and consent audio to Google Cloud generateVoiceCloningKey endpoint.
        """
        token = self._get_access_token()

        payload = {
            "reference_audio": {
                "audio_config": {
                    "audio_encoding": "LINEAR16"
                },
                "content": base64.b64encode(source_wav).decode("utf-8")
            },
            "voice_talent_consent": {
                "audio_config": {
                    "audio_encoding": "LINEAR16"
                },
                "content": base64.b64encode(consent_wav).decode("utf-8")
            }
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.GENERATE_KEY_URL,
                    json=payload,
                    headers=headers
                )
            except Exception as net_err:
                logger.error(f"Network error connecting to Google Voices API: {net_err}")
                raise VoiceReplicationError("Voice generation failed. Please try again.")

        if response.status_code == 200:
            data = response.json()
            voice_key = data.get("voiceCloningKey") or data.get("voice_cloning_key")
            if not voice_key:
                logger.error(f"No voiceCloningKey in response: {data}")
                raise VoiceReplicationError("Voice generation failed. Please try again.")
            return voice_key

        elif response.status_code in (403, 404):
            err_body = response.text
            logger.warning(f"Google Cloud Voice Replication access rejected ({response.status_code}): {err_body}")
            raise VoiceReplicationUnavailableError(
                "Voice Replication is not enabled for this Google Cloud project."
            )

        elif response.status_code == 400:
            err_body = response.text.lower()
            logger.warning(f"Voice replication bad request ({response.status_code}): {response.text}")
            if "consent" in err_body:
                raise VoiceReplicationConsentError(
                    "The consent recording could not be verified. Please record the required statement exactly."
                )
            raise VoiceReplicationError("Voice generation failed. Please try again.")

        else:
            logger.error(f"Google Voices API returned status {response.status_code}: {response.text}")
            raise VoiceReplicationError("Voice generation failed. Please try again.")

    async def synthesize(
        self,
        voice_key: str,
        text: str,
        language_code: str = "my-MM"
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Synthesize speech in the replicated voice using Google Cloud Text-to-Speech API.
        """
        token = self._get_access_token()
        start_time = time.perf_counter()

        payload = {
            "input": {
                "text": text
            },
            "voice": {
                "languageCode": language_code,
                "voiceClone": {
                    "voiceCloningKey": voice_key
                }
            },
            "audioConfig": {
                "audioEncoding": "LINEAR16",
                "sampleRateHertz": 24000
            }
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                response = await client.post(
                    self.SYNTHESIZE_URL,
                    json=payload,
                    headers=headers
                )
            except Exception as net_err:
                logger.error(f"Network error synthesizing replicated voice: {net_err}")
                raise VoiceReplicationError("Voice generation failed. Please try again.")

        if response.status_code == 200:
            data = response.json()
            audio_b64 = data.get("audioContent")
            if not audio_b64:
                raise VoiceReplicationError("Voice generation failed. Please try again.")

            raw_audio = base64.b64decode(audio_b64)

            # Ensure proper WAV container packaging
            if not raw_audio.startswith(b"RIFF"):
                buf = io.BytesIO()
                with wave.open(buf, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(raw_audio)
                wav_bytes = buf.getvalue()
            else:
                wav_bytes = raw_audio

            # Compute duration
            duration = 0.0
            try:
                with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
                    duration = round(wf.getnframes() / float(wf.getframerate()), 2)
            except Exception:
                duration = round(len(text) / 12.0, 2)

            latency_ms = round((time.perf_counter() - start_time) * 1000.0, 1)

            metadata = {
                "voice": "replicated",
                "voice_name": "Replicated Voice",
                "style": "custom",
                "language": language_code,
                "character_count": len(text),
                "duration_seconds": duration,
                "format": "audio/wav",
                "sample_rate": 24000,
                "latency_ms": latency_ms,
                "is_mock": False
            }
            return wav_bytes, metadata

        elif response.status_code in (403, 404):
            raise VoiceReplicationUnavailableError(
                "Voice Replication is not enabled for this Google Cloud project."
            )
        else:
            logger.error(f"Voice synthesis error {response.status_code}: {response.text}")
            raise VoiceReplicationError("Voice generation failed. Please try again.")


class MockVoiceReplicationProvider(BaseVoiceReplicationProvider):
    """
    Mock provider strictly for automated tests and offline validation.
    Generates test audio chimes and synthetic session keys.
    """

    async def generate_key(
        self,
        source_wav: bytes,
        consent_wav: bytes,
        language_code: str = "my-MM"
    ) -> str:
        return f"mock_vkey_{uuid.uuid4().hex}"

    async def synthesize(
        self,
        voice_key: str,
        text: str,
        language_code: str = "my-MM"
    ) -> Tuple[bytes, Dict[str, Any]]:
        import math
        import struct

        sample_rate = 24000
        duration_sec = max(1.5, min(len(text) / 10.0, 5.0))
        total_frames = int(sample_rate * duration_sec)
        buf = io.BytesIO()

        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            frames = bytearray()
            for i in range(total_frames):
                t = float(i) / sample_rate
                val = 0.4 * math.sin(2.0 * math.pi * 330.0 * t) * math.exp(-0.8 * t)
                sample = int(max(-1.0, min(1.0, val)) * 32767)
                frames.extend(struct.pack("<h", sample))
            wf.writeframes(frames)

        wav_bytes = buf.getvalue()
        metadata = {
            "voice": "replicated_mock",
            "voice_name": "Replicated Voice (Mock)",
            "style": "custom",
            "language": language_code,
            "character_count": len(text),
            "duration_seconds": round(duration_sec, 2),
            "format": "audio/wav",
            "sample_rate": sample_rate,
            "latency_ms": 120.0,
            "is_mock": True
        }
        return wav_bytes, metadata

    def is_configured(self) -> Tuple[bool, str]:
        return True, "Mock provider active."


class VoiceReplicationService:
    """
    High-level service managing temporary voice sessions, audio normalization,
    and delegating to the appropriate provider.
    """

    def __init__(self):
        self._sessions: Dict[str, VoiceSessionRecord] = {}
        self._gcp_provider = GoogleCloudVoiceReplicationProvider()
        self._mock_provider = MockVoiceReplicationProvider()

    @property
    def provider(self) -> BaseVoiceReplicationProvider:
        """Dynamically choose mock provider when TEST_MODE is active."""
        if settings.TEST_MODE:
            return self._mock_provider
        return self._gcp_provider

    def _cleanup_expired_sessions(self):
        """Purge sessions that have exceeded their TTL."""
        now = datetime.now(timezone.utc)
        expired_ids = [
            sid for sid, rec in self._sessions.items()
            if rec.expires_at <= now
        ]
        for sid in expired_ids:
            del self._sessions[sid]

    def normalize_myanmar_text(self, text: str) -> str:
        """NFC normalize Myanmar Unicode and strip zero-width characters."""
        normalized = unicodedata.normalize("NFC", text)
        cleaned = normalized.replace("\u200B", "").replace("\uFEFF", "")
        return cleaned.strip()

    async def create_session(
        self,
        source_audio_bytes: bytes,
        consent_audio_bytes: bytes,
        consent_confirmed: bool,
        language_code: str = "my-MM"
    ) -> VoiceSessionRecord:
        """
        Validate uploads, confirm consent, normalize audio to 24kHz LINEAR16 WAV,
        and generate a temporary Voice Replication session.
        """
        # 1. Validate consent confirmation
        if not consent_confirmed:
            raise ValueError(
                "Please confirm that you own this voice or have permission to use it."
            )

        # 2. Validate existence of uploaded files
        if not source_audio_bytes or len(source_audio_bytes) < 44:
            raise ValueError("Please upload a voice sample.")
        if not consent_audio_bytes or len(consent_audio_bytes) < 44:
            raise ValueError("Please upload the required consent recording.")

        # 3. Audio format & duration validation and normalization
        norm_source_wav, source_meta = audio_processor.process_and_normalize(
            source_audio_bytes,
            audio_type="source"
        )
        norm_consent_wav, _ = audio_processor.process_and_normalize(
            consent_audio_bytes,
            audio_type="consent"
        )

        # 4. Generate voice replication key via provider
        voice_key = await self.provider.generate_key(
            source_wav=norm_source_wav,
            consent_wav=norm_consent_wav,
            language_code=language_code
        )

        # 5. Create secure session (7 days validity)
        self._cleanup_expired_sessions()
        session_id = f"vrep_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=settings.VOICE_SESSION_TTL_HOURS)

        record = VoiceSessionRecord(
            session_id=session_id,
            voice_key=voice_key,
            created_at=now,
            expires_at=expires_at,
            duration_seconds=source_meta["duration_seconds"],
            sample_rate=source_meta["sample_rate"],
            language_code=language_code,
            is_mock=settings.TEST_MODE
        )
        self._sessions[session_id] = record
        return record

    def get_session(self, session_id: str) -> VoiceSessionRecord:
        """Retrieve a session by ID and check validity."""
        self._cleanup_expired_sessions()
        record = self._sessions.get(session_id)
        if not record:
            raise VoiceSessionNotFoundError(
                "The voice replication session was not found or has expired. Please create a new voice session."
            )
        return record

    async def synthesize(
        self,
        session_id: str,
        text: str,
        language_code: Optional[str] = None
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Synthesize speech in the replicated voice associated with the session.
        """
        record = self.get_session(session_id)
        normalized_text = self.normalize_myanmar_text(text)
        if not normalized_text:
            raise ValueError("Text cannot be empty or contain only whitespace.")

        lang = language_code or record.language_code or "my-MM"

        wav_bytes, metadata = await self.provider.synthesize(
            voice_key=record.voice_key,
            text=normalized_text,
            language_code=lang
        )
        metadata["session_id"] = session_id
        return wav_bytes, metadata


replication_service = VoiceReplicationService()
