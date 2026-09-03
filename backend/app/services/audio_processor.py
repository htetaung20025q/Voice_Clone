"""
Audio processing service for Voice Replication.
Decodes and normalizes arbitrary user audio formats (WAV, MP3, M4A, OGG, FLAC, WebM)
into the exact format required by Google Cloud Voice Replication:
24,000 Hz, 16-bit LINEAR16, mono WAV.
Uses FFmpeg for robust, multi-codec decoding and conversion.
"""

import os
import io
import wave
import shutil
import logging
import tempfile
import subprocess
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("burmavoice.audio_processor")

TARGET_SAMPLE_RATE = 24000
TARGET_CHANNELS = 1
TARGET_SAMPLE_WIDTH = 2  # 16-bit LINEAR16

# Validation thresholds
MIN_SOURCE_DURATION = 5.0   # seconds
MAX_SOURCE_DURATION = 60.0  # seconds
MIN_CONSENT_DURATION = 2.0  # seconds
MAX_CONSENT_DURATION = 35.0 # seconds


class AudioValidationError(ValueError):
    """Raised when uploaded audio does not satisfy quality, decoding, or format requirements."""
    pass


class AudioProcessor:
    """
    Robust audio conversion and validation pipeline using FFmpeg.
    Supports WAV, MP3, M4A, OGG, FLAC, WebM, and any common audio container.
    """

    def __init__(self):
        self._ffmpeg_exe: Optional[str] = None

    def get_ffmpeg_exe(self) -> str:
        """Resolve path to FFmpeg binary from system PATH or bundled imageio-ffmpeg."""
        if self._ffmpeg_exe and os.path.exists(self._ffmpeg_exe):
            return self._ffmpeg_exe

        # 1. System PATH
        system_ffmpeg = shutil.which("ffmpeg")
        if system_ffmpeg:
            self._ffmpeg_exe = system_ffmpeg
            return self._ffmpeg_exe

        # 2. Bundled static binary from imageio-ffmpeg
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
            if exe and os.path.exists(exe):
                self._ffmpeg_exe = exe
                return self._ffmpeg_exe
        except Exception as e:
            logger.warning(f"Could not load imageio_ffmpeg binary: {e}")

        raise RuntimeError(
            "FFmpeg executable not found. Please install ffmpeg or imageio-ffmpeg."
        )

    def convert_to_linear16_wav(self, audio_bytes: bytes) -> Tuple[bytes, Dict[str, Any]]:
        """
        Decode and convert arbitrary audio bytes to 24 kHz, 1-channel, 16-bit LINEAR16 WAV.
        Uses temporary files with secure, guaranteed cleanup.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            raise AudioValidationError(
                "Uploaded audio file is empty or too small to be a valid audio recording."
            )

        ffmpeg_exe = self.get_ffmpeg_exe()

        temp_in = None
        temp_out = None
        try:
            # Create secure temporary input file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as f_in:
                f_in.write(audio_bytes)
                temp_in = f_in.name

            # Create destination path for converted WAV
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f_out:
                temp_out = f_out.name

            # Run FFmpeg conversion pipeline:
            # -y : overwrite output
            # -v error : only report errors
            # -i input : automatically probe and decode format (MP3, M4A, OGG, FLAC, WebM, WAV, etc.)
            # -ac 1 : mix to mono
            # -ar 24000 : resample to 24,000 Hz
            # -c:a pcm_s16le : 16-bit signed little-endian PCM
            # -f wav : standard RIFF WAV container
            cmd = [
                ffmpeg_exe,
                "-y",
                "-v", "error",
                "-i", temp_in,
                "-ac", str(TARGET_CHANNELS),
                "-ar", str(TARGET_SAMPLE_RATE),
                "-c:a", "pcm_s16le",
                "-f", "wav",
                temp_out
            ]

            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=25.0
            )

            if process.returncode != 0:
                err_output = process.stderr.strip()
                logger.warning(f"FFmpeg conversion failed: {err_output}")
                raise AudioValidationError(
                    "Unsupported or corrupted audio format. Please upload a valid audio recording "
                    "(WAV, MP3, M4A, OGG, FLAC, or WebM)."
                )

            # Read normalized WAV bytes
            with open(temp_out, "rb") as f_wav:
                wav_bytes = f_wav.read()

            if len(wav_bytes) < 44:
                raise AudioValidationError("Converted audio was empty or unreadable.")

            # Validate WAV properties
            with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
                channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                framerate = wf.getframerate()
                n_frames = wf.getnframes()
                duration = round(n_frames / float(framerate), 2) if framerate > 0 else 0.0

            if channels != TARGET_CHANNELS or sample_width != TARGET_SAMPLE_WIDTH or framerate != TARGET_SAMPLE_RATE:
                raise AudioValidationError("Normalized audio failed property validation check.")

            meta = {
                "duration_seconds": duration,
                "sample_rate": framerate,
                "channels": channels,
                "bit_depth": sample_width * 8,
                "format": "audio/wav"
            }

            return wav_bytes, meta

        except subprocess.TimeoutExpired:
            raise AudioValidationError("Audio conversion timed out. Please upload a shorter audio file.")
        finally:
            # Secure cleanup of temporary files
            if temp_in and os.path.exists(temp_in):
                try:
                    os.remove(temp_in)
                except Exception:
                    pass
            if temp_out and os.path.exists(temp_out):
                try:
                    os.remove(temp_out)
                except Exception:
                    pass

    def process_and_normalize(
        self,
        audio_bytes: bytes,
        audio_type: str = "source"
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Validate and convert uploaded audio (WAV, MP3, M4A, OGG, FLAC, WebM) to
        24kHz / mono / LINEAR16 WAV. Enforces duration boundaries for voice sample and consent.
        """
        # 1. Decode and convert via FFmpeg
        normalized_wav, meta = self.convert_to_linear16_wav(audio_bytes)
        duration = meta["duration_seconds"]

        # 2. Validate duration boundaries
        if audio_type == "source":
            if duration < MIN_SOURCE_DURATION:
                raise AudioValidationError(
                    f"The voice sample is too short ({duration}s). "
                    f"Please upload a recording between 10–30 seconds (minimum {MIN_SOURCE_DURATION}s)."
                )
            if duration > MAX_SOURCE_DURATION:
                raise AudioValidationError(
                    f"The voice sample is too long ({duration}s). "
                    f"Please upload a recording between 10–30 seconds (maximum {MAX_SOURCE_DURATION}s)."
                )
        elif audio_type == "consent":
            if duration < MIN_CONSENT_DURATION:
                raise AudioValidationError(
                    f"The consent recording is too short ({duration}s). "
                    f"Please clearly record the full required consent statement (minimum {MIN_CONSENT_DURATION}s)."
                )
            if duration > MAX_CONSENT_DURATION:
                raise AudioValidationError(
                    f"The consent recording is too long ({duration}s). "
                    f"Maximum allowed duration is {MAX_CONSENT_DURATION} seconds."
                )

        return normalized_wav, meta


audio_processor = AudioProcessor()
