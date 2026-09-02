"""
Gemini Myanmar TTS Service.
Handles interaction with Google Gemini API for natural-sounding Myanmar and English speech synthesis.
Includes Myanmar Unicode normalization, phonetic style directives, and WAV serialization.
"""

import io
import time
import math
import struct
import wave
import unicodedata
import logging
from typing import Tuple, Dict, Any, Optional

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import settings, SUPPORTED_VOICES, SUPPORTED_STYLES

logger = logging.getLogger("burmavoice.tts")


class GeminiMyanmarTTSService:
    """Service for Myanmar Text-to-Speech synthesis using Gemini API."""

    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._voice_map = {v["id"].lower(): v for v in SUPPORTED_VOICES}
        # Also map Gemini direct names
        for v in SUPPORTED_VOICES:
            self._voice_map[v["gemini_voice"].lower()] = v
        self._styles_map = {s["id"].lower(): s for s in SUPPORTED_STYLES}
        self._init_client()

    def _init_client(self):
        """Initialize Google GenAI client if API key is configured."""
        api_key = settings.GEMINI_API_KEY.strip()
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                self._client = genai.Client(api_key=api_key)
                logger.info(f"Gemini client initialized with model: {settings.GEMINI_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self._client = None
        else:
            self._client = None
            logger.warning("GEMINI_API_KEY not set. Operating in graceful mock synthesis mode.")

    def is_configured(self) -> bool:
        """Check if Gemini client is configured with a valid key."""
        return self._client is not None

    def _normalize_myanmar_text(self, text: str) -> str:
        """Apply Unicode NFC normalization and clean invisible zero-width spaces."""
        normalized = unicodedata.normalize("NFC", text)
        # Remove zero-width non-joiners/spaces that might confuse TTS
        cleaned = normalized.replace("\u200B", "").replace("\uFEFF", "")
        return cleaned.strip()

    def _resolve_voice(self, voice_id: str) -> Dict[str, Any]:
        """Resolve voice configuration from ID or name."""
        cleaned = voice_id.strip().lower()
        if cleaned in self._voice_map:
            return self._voice_map[cleaned]
        return SUPPORTED_VOICES[0]  # Default Thiri

    def _get_style_instruction(self, style_id: str) -> str:
        """Resolve speaking style instruction prompt."""
        cleaned = style_id.strip().lower()
        if cleaned in self._styles_map:
            return self._styles_map[cleaned]["prompt_instruction"]
        if len(style_id.strip()) > 0:
            return style_id.strip()
        return "Speak naturally and expressively in a clear conversational tone."

    def _pcm_to_wav(self, pcm_data: bytes, sample_rate: int = 24000, num_channels: int = 1, sampwidth: int = 2) -> bytes:
        """Wrap raw PCM bytes in a standard RIFF WAV container."""
        if pcm_data.startswith(b"RIFF") and len(pcm_data) > 44:
            return pcm_data

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(num_channels)
            wav_file.setsampwidth(sampwidth)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)
        return buffer.getvalue()

    def _generate_mock_audio(
        self,
        text: str,
        voice_info: Dict[str, Any],
        style_name: str,
        language: str = "myanmar",
        duration_sec: float = 2.0
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Generate a pleasant harmonic audio chime waveform as a mock fallback."""
        sample_rate = 24000
        total_frames = int(sample_rate * max(1.5, min(duration_sec, 6.0)))
        buffer = io.BytesIO()
        
        base_freq = 440.0 if "female" in voice_info["gender"].lower() else 220.0
        
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            
            audio_frames = bytearray()
            for i in range(total_frames):
                t = float(i) / sample_rate
                envelope = math.exp(-1.2 * (t / max(duration_sec, 1.0)))
                val = (
                    0.5 * math.sin(2.0 * math.pi * base_freq * t) +
                    0.25 * math.sin(2.0 * math.pi * (base_freq * 1.5) * t) +
                    0.15 * math.sin(2.0 * math.pi * (base_freq * 2.0) * t)
                ) * envelope * 0.7
                sample = int(max(-1.0, min(1.0, val)) * 32767)
                audio_frames.extend(struct.pack("<h", sample))
                
            wav_file.writeframes(audio_frames)
            
        wav_bytes = buffer.getvalue()
        metadata = {
            "voice": voice_info["id"],
            "voice_name": voice_info["name"],
            "style": style_name,
            "language": language,
            "character_count": len(text),
            "duration_seconds": round(len(audio_frames) / (sample_rate * 2), 2),
            "format": "audio/wav",
            "sample_rate": sample_rate,
            "latency_ms": 110.0,
            "is_mock": True
        }
        return wav_bytes, metadata

    async def synthesize(
        self,
        text: str,
        voice: str = "thiri",
        style: str = "natural",
        language: str = "myanmar",
        speed: float = 1.0,
        pitch: float = 0.0
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Synthesize text to speech using Google Gemini TTS.
        """
        start_time = time.perf_counter()
        normalized_text = self._normalize_myanmar_text(text)
        voice_info = self._resolve_voice(voice)
        gemini_voice = voice_info["gemini_voice"]
        style_instruction = self._get_style_instruction(style)

        if self._client is None:
            est_duration = max(1.5, min(len(normalized_text) / 12.0, 10.0))
            wav_bytes, meta = self._generate_mock_audio(
                normalized_text,
                voice_info,
                style,
                language=language,
                duration_sec=est_duration
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            meta["latency_ms"] = round(elapsed_ms, 1)
            return wav_bytes, meta

        try:
            # Construct bilingual-aware prompt for Gemini audio modality
            prompt_content = (
                f"Instruction: You are an expert Text-to-Speech voice artist specializing in Myanmar (Burmese) and English. "
                f"Style directive: {style_instruction} "
                f"Language mode: {language}. "
                f"Pronounce Burmese Unicode text with natural native intonation, correct tone marks, and authentic cadence. "
                f"Do not add conversational preamble, greetings, commentary, or quotes. "
                f"Read the following text exactly as written:\n\n{normalized_text}"
            )

            config = types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=gemini_voice
                        )
                    )
                )
            )

            response = self._client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt_content,
                config=config
            )

            audio_bytes = None
            sample_rate = 24000

            if response.candidates:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, "inline_data") and part.inline_data:
                            audio_bytes = part.inline_data.data
                            break

            if not audio_bytes:
                raise ValueError("No audio content returned in Gemini API response.")

            wav_bytes = self._pcm_to_wav(audio_bytes, sample_rate=sample_rate)

            try:
                with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    duration = round(frames / float(rate), 2)
            except Exception:
                duration = round(len(normalized_text) / 12.0, 2)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            metadata = {
                "voice": voice_info["id"],
                "voice_name": voice_info["name"],
                "style": style,
                "language": language,
                "character_count": len(normalized_text),
                "duration_seconds": duration,
                "format": "audio/wav",
                "sample_rate": sample_rate,
                "latency_ms": round(elapsed_ms, 1),
                "is_mock": False
            }

            return wav_bytes, metadata

        except APIError as api_err:
            logger.error(f"Gemini API Error: {api_err}")
            raise RuntimeError(f"Gemini API error: {api_err.message or str(api_err)}")
        except Exception as e:
            logger.error(f"Myanmar TTS synthesis error: {e}", exc_info=True)
            raise RuntimeError(f"Failed to synthesize voice: {str(e)}")


tts_service = GeminiMyanmarTTSService()
