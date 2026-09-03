"""
Unit and integration tests for Voice Replication endpoints and services.
"""

import sys
from pathlib import Path

# Ensure backend directory is first in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import io
import wave
import struct
import math
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.voice_replication import (
    replication_service,
    VoiceReplicationUnavailableError,
    VoiceReplicationAuthError,
    VoiceReplicationConsentError
)

client = TestClient(app)
settings.TEST_MODE = True


def make_test_wav(
    duration_seconds: float = 12.0,
    sample_rate: int = 24000,
    channels: int = 1
) -> bytes:
    """Generate in-memory valid RIFF WAV audio bytes."""
    buf = io.BytesIO()
    total_frames = int(sample_rate * duration_seconds)
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(total_frames):
            t = float(i) / sample_rate
            val = 0.3 * math.sin(2.0 * math.pi * 440.0 * t)
            sample = int(max(-1.0, min(1.0, val)) * 32767)
            if channels == 1:
                frames.extend(struct.pack("<h", sample))
            else:
                frames.extend(struct.pack("<hh", sample, sample))
        wf.writeframes(frames)
    return buf.getvalue()


def make_test_audio(
    fmt: str = "wav",
    duration_seconds: float = 12.0
) -> bytes:
    """Generate test audio bytes for any supported format (WAV, MP3, M4A, OGG, FLAC, WebM)."""
    wav_bytes = make_test_wav(duration_seconds=duration_seconds, sample_rate=44100, channels=2)
    if fmt.lower() == "wav":
        return wav_bytes

    import os
    import tempfile
    import subprocess
    from app.services.audio_processor import audio_processor

    ffmpeg_exe = audio_processor.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as td:
        in_path = os.path.join(td, "in.wav")
        out_path = os.path.join(td, f"out.{fmt}")
        with open(in_path, "wb") as f:
            f.write(wav_bytes)

        cmd = [ffmpeg_exe, "-y", "-v", "error", "-i", in_path, out_path]
        subprocess.run(cmd, check=True)

        with open(out_path, "rb") as f:
            return f.read()


def test_consent_scripts_endpoint():
    """Verify official Google Cloud consent scripts are returned."""
    res = client.get("/api/v1/voice/consent-scripts")
    assert res.status_code == 200
    scripts = res.json()
    assert len(scripts) >= 2
    my_script = next(s for s in scripts if s["id"] == "my-MM")
    assert "ကျွန်ုပ်သည် ဤအသံ၏ပိုင်ရှင်ဖြစ်ပြီး" in my_script["consent_statement"]
    en_script = next(s for s in scripts if s["id"] == "en-US")
    assert "owner of this voice" in en_script["consent_statement"]


def test_replicate_missing_confirmation():
    """Missing consent confirmation checkbox returns 400."""
    source_wav = make_test_wav(12.0)
    consent_wav = make_test_wav(4.0)

    files = {
        "source_audio": ("source.wav", source_wav, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    data = {"consent_confirmed": "false", "language_code": "my-MM"}

    res = client.post("/api/v1/voice/replicate", files=files, data=data)
    assert res.status_code == 400
    assert "permission" in res.json()["detail"].lower()


def test_replicate_invalid_audio_format():
    """Uploading non-WAV bytes triggers format validation error."""
    junk_audio = b"NOT_A_WAV_FILE_HEADER" + b"\x00" * 100
    files = {
        "source_audio": ("source.wav", junk_audio, "audio/wav"),
        "consent_audio": ("consent.wav", junk_audio, "audio/wav")
    }
    data = {"consent_confirmed": "true", "language_code": "my-MM"}

    res = client.post("/api/v1/voice/replicate", files=files, data=data)
    assert res.status_code == 400
    assert "unsupported audio format" in res.json()["detail"].lower() or "wav" in res.json()["detail"].lower()


def test_replicate_too_short_source_audio():
    """Voice sample shorter than 5 seconds is rejected with descriptive message."""
    short_source = make_test_wav(2.0)  # Only 2 seconds
    consent_wav = make_test_wav(4.0)

    files = {
        "source_audio": ("source.wav", short_source, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    data = {"consent_confirmed": "true", "language_code": "my-MM"}

    res = client.post("/api/v1/voice/replicate", files=files, data=data)
    assert res.status_code == 400
    assert "too short" in res.json()["detail"].lower()


def test_replicate_success_and_resampling():
    """Valid stereo 44.1kHz audio is successfully converted to 24kHz mono LINEAR16 WAV and session created."""
    # Create stereo 44.1kHz sample to verify server-side audio normalization
    stereo_source = make_test_wav(duration_seconds=10.0, sample_rate=44100, channels=2)
    consent_wav = make_test_wav(duration_seconds=4.0, sample_rate=24000, channels=1)

    files = {
        "source_audio": ("stereo_sample.wav", stereo_source, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    data = {"consent_confirmed": "true", "language_code": "my-MM"}

    res = client.post("/api/v1/voice/replicate", files=files, data=data)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["voice_session_id"].startswith("vrep_")
    assert body["duration_seconds"] > 9.0
    assert body["sample_rate"] == 24000
    assert "expires_at" in body


def test_session_status_lifecycle():
    """Session status endpoint correctly reflects session state."""
    source_wav = make_test_wav(12.0)
    consent_wav = make_test_wav(4.0)

    files = {
        "source_audio": ("source.wav", source_wav, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    data = {"consent_confirmed": "true", "language_code": "my-MM"}

    create_res = client.post("/api/v1/voice/replicate", files=files, data=data)
    session_id = create_res.json()["voice_session_id"]

    # Check status
    status_res = client.get(f"/api/v1/voice/session/{session_id}")
    assert status_res.status_code == 200
    status_body = status_res.json()
    assert status_body["is_valid"] is True
    assert status_body["seconds_remaining"] > 0
    assert status_body["voice_session_id"] == session_id

    # Nonexistent session
    not_found_res = client.get("/api/v1/voice/session/vrep_nonexistent12345")
    assert not_found_res.status_code == 404


def test_tts_voice_replication_flow():
    """Synthesizing speech with valid voice session returns binary WAV."""
    source_wav = make_test_wav(12.0)
    consent_wav = make_test_wav(4.0)

    files = {
        "source_audio": ("source.wav", source_wav, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    create_res = client.post("/api/v1/voice/replicate", files=files, data={"consent_confirmed": "true"})
    session_id = create_res.json()["voice_session_id"]

    # Synthesize binary audio
    payload = {
        "voice_session_id": session_id,
        "text": "မင်္ဂလာပါ။ ဒါက ကျွန်ုပ်ရဲ့ အသံနဲ့ ဖန်တီးထားတဲ့ စမ်းသပ်အသံ ဖြစ်ပါတယ်။",
        "language_code": "my-MM"
    }
    synth_res = client.post("/api/v1/tts/voice-replication", json=payload)
    assert synth_res.status_code == 200
    assert synth_res.headers["content-type"] == "audio/wav"
    assert synth_res.content.startswith(b"RIFF")
    assert synth_res.headers["x-audio-voice-type"] == "replicated"
    assert synth_res.headers["x-audio-voice-session"] == session_id
    assert "x-audio-duration" in synth_res.headers


def test_tts_voice_replication_json_format():
    """Synthesizing speech with format=json returns base64 and metadata."""
    source_wav = make_test_wav(10.0)
    consent_wav = make_test_wav(3.5)

    files = {
        "source_audio": ("source.wav", source_wav, "audio/wav"),
        "consent_audio": ("consent.wav", consent_wav, "audio/wav")
    }
    create_res = client.post("/api/v1/voice/replicate", files=files, data={"consent_confirmed": "true"})
    session_id = create_res.json()["voice_session_id"]

    payload = {
        "voice_session_id": session_id,
        "text": "Hello. This is a voice replication test.",
        "language_code": "en-US"
    }
    synth_res = client.post("/api/v1/tts/voice-replication?format=json", json=payload)
    assert synth_res.status_code == 200
    data = synth_res.json()
    assert "audio_base64" in data
    assert data["metadata"]["voice"] == "replicated"
    assert data["metadata"]["language"] == "en-US"


def test_tts_voice_replication_empty_text():
    """Empty text is rejected with 422 validation error."""
    payload = {
        "voice_session_id": "vrep_some_session",
        "text": "   "
    }
    res = client.post("/api/v1/tts/voice-replication", json=payload)
    assert res.status_code == 422


def test_voice_replication_unavailable_error_handling():
    """Clear error when Voice Replication is not allowlisted on GCP project."""
    with patch.object(
        replication_service,
        "synthesize",
        side_effect=VoiceReplicationUnavailableError("Voice Replication is not enabled for this Google Cloud project.")
    ):
        payload = {
            "voice_session_id": "vrep_mock_session",
            "text": "စမ်းသပ်မှု"
        }
        res = client.post("/api/v1/tts/voice-replication", json=payload)
        assert res.status_code == 403
        assert "not enabled for this google cloud project" in res.json()["detail"].lower()


def test_voice_replication_auth_error_handling():
    """Informative error when Google Cloud credentials are not configured."""
    with patch.object(
        replication_service,
        "synthesize",
        side_effect=VoiceReplicationAuthError("Voice Replication requires Google Cloud credentials.")
    ):
        payload = {
            "voice_session_id": "vrep_mock_session",
            "text": "စမ်းသပ်မှု"
        }
        res = client.post("/api/v1/tts/voice-replication", json=payload)
        assert res.status_code == 503
        assert "credentials" in res.json()["detail"].lower()


@pytest.mark.parametrize("fmt", ["wav", "mp3", "m4a", "ogg", "flac", "webm"])
def test_replicate_all_supported_audio_formats(fmt: str):
    """
    Test that users can upload common audio formats (WAV, MP3, M4A, OGG, FLAC, WebM),
    and backend automatically decodes and converts to 24 kHz mono LINEAR16 WAV.
    """
    source_bytes = make_test_audio(fmt=fmt, duration_seconds=11.5)
    consent_bytes = make_test_audio(fmt=fmt, duration_seconds=4.0)

    files = {
        "source_audio": (f"sample.{fmt}", source_bytes, f"audio/{fmt}"),
        "consent_audio": (f"consent.{fmt}", consent_bytes, f"audio/{fmt}")
    }
    data = {"consent_confirmed": "true", "language_code": "my-MM"}

    res = client.post("/api/v1/voice/replicate", files=files, data=data)
    assert res.status_code == 200, f"Failed for format {fmt}: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["voice_session_id"].startswith("vrep_")
    assert body["sample_rate"] == 24000
    assert 11.0 <= body["duration_seconds"] <= 12.0

    # Now synthesize speech using this session
    synth_res = client.post(
        "/api/v1/tts/voice-replication",
        json={
            "voice_session_id": body["voice_session_id"],
            "text": "မင်္ဂလာပါ။ အသံပုံစံ အမျိုးမျိုး စမ်းသပ်မှု အောင်မြင်ပါသည်။",
            "language_code": "my-MM"
        }
    )
    assert synth_res.status_code == 200
    assert synth_res.headers["content-type"] == "audio/wav"
    assert synth_res.content.startswith(b"RIFF")


def test_replicate_corrupted_file_rejection():
    """Corrupted non-audio file is rejected before sending to provider."""
    junk = b"RIFF" + b"CORRUPTED_GARBAGE_PAYLOAD_NOT_DECODABLE" * 20
    files = {
        "source_audio": ("corrupt.mp3", junk, "audio/mp3"),
        "consent_audio": ("consent.wav", make_test_wav(4.0), "audio/wav")
    }
    res = client.post("/api/v1/voice/replicate", files=files, data={"consent_confirmed": "true"})
    assert res.status_code == 400
    assert "unsupported or corrupted audio format" in res.json()["detail"].lower()


def test_replicate_mp3_duration_limits():
    """Overly short or overly long MP3s are rejected with clear validation messages."""
    # Too short (< 5.0s)
    short_mp3 = make_test_audio(fmt="mp3", duration_seconds=2.5)
    files = {
        "source_audio": ("short.mp3", short_mp3, "audio/mp3"),
        "consent_audio": ("consent.wav", make_test_wav(4.0), "audio/wav")
    }
    res_short = client.post("/api/v1/voice/replicate", files=files, data={"consent_confirmed": "true"})
    assert res_short.status_code == 400
    assert "too short" in res_short.json()["detail"].lower()

    # Too long (> 60.0s)
    long_mp3 = make_test_audio(fmt="mp3", duration_seconds=65.0)
    files_long = {
        "source_audio": ("long.mp3", long_mp3, "audio/mp3"),
        "consent_audio": ("consent.wav", make_test_wav(4.0), "audio/wav")
    }
    res_long = client.post("/api/v1/voice/replicate", files=files_long, data={"consent_confirmed": "true"})
    assert res_long.status_code == 400
    assert "too long" in res_long.json()["detail"].lower()
