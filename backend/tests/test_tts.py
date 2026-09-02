"""
Backend test suite for BurmaVoice Myanmar TTS.
Includes tests for health check, request validation, missing config, error handling, and mock synthesis.
"""

import sys
from pathlib import Path

# Ensure backend directory is first in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import io
import wave
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.gemini_tts import tts_service

client = TestClient(app)

# Ensure automated tests run in TEST_MODE so they do not consume Gemini live API quota
settings.TEST_MODE = True


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "endpoints" in data


def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "gemini_configured" in data
    assert "model" in data


def test_get_myanmar_voices():
    response = client.get("/api/v1/voices")
    assert response.status_code == 200
    voices = response.json()
    assert len(voices) >= 6
    ids = [v["id"] for v in voices]
    assert "thiri" in ids
    assert "aung" in ids
    assert "may" in ids
    assert "min" in ids
    assert "nandar" in ids
    assert "kyaw" in ids


def test_get_myanmar_styles():
    response = client.get("/api/v1/styles")
    assert response.status_code == 200
    styles = response.json()
    assert len(styles) >= 6
    ids = [s["id"] for s in styles]
    assert "natural" in ids
    assert "professional" in ids
    assert "friendly" in ids
    assert "storytelling" in ids
    assert "news" in ids
    assert "calm" in ids


def test_myanmar_tts_synthesis():
    payload = {
        "text": "မင်္ဂလာပါ ခင်ဗျာ။ BurmaVoice မှ ကြိုဆိုပါတယ်။",
        "voice": "thiri",
        "style": "natural",
        "language": "myanmar"
    }
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.content.startswith(b"RIFF")
    assert "X-Audio-Duration" in response.headers
    assert "X-Audio-Voice" in response.headers


def test_tts_json_format():
    payload = {
        "text": "BurmaVoice Myanmar AI Text-to-Speech test.",
        "voice": "aung",
        "style": "friendly"
    }
    response = client.post("/api/v1/tts?format=json", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "audio_base64" in data
    assert data["metadata"]["voice"] == "aung"


def test_empty_text_validation():
    payload = {"text": "   ", "voice": "thiri"}
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 422


def test_excessively_long_text_validation():
    payload = {"text": "က" * 5001, "voice": "thiri"}
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 422


def test_invalid_voice_validation():
    payload = {"text": "မင်္ဂလာပါ", "voice": "unsupported_fictional_voice"}
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 422


def test_invalid_style_validation():
    payload = {"text": "မင်္ဂလာပါ", "voice": "thiri", "style": "unsupported_style"}
    response = client.post("/api/v1/tts", json=payload)
    assert response.status_code == 422


def test_missing_api_key_configuration():
    # When test mode is off and client is not configured, should return 503
    orig_test_mode = settings.TEST_MODE
    orig_client = tts_service._client
    try:
        settings.TEST_MODE = False
        tts_service._client = None
        payload = {"text": "မင်္ဂလာပါ", "voice": "thiri"}
        response = client.post("/api/v1/tts", json=payload)
        assert response.status_code == 503
        data = response.json()
        assert "not configured" in data.get("detail", "").lower()
    finally:
        settings.TEST_MODE = orig_test_mode
        tts_service._client = orig_client


def test_quota_exceeded_error_handling():
    with patch.object(tts_service, "synthesize", side_effect=RuntimeError("QUOTA_EXCEEDED: Rate limit exceeded")):
        payload = {"text": "မင်္ဂလာပါ", "voice": "thiri"}
        response = client.post("/api/v1/tts", json=payload)
        assert response.status_code == 429
        data = response.json()
        assert "quota exceeded" in data.get("detail", "").lower()


def test_general_api_error_handling():
    with patch.object(tts_service, "synthesize", side_effect=RuntimeError("Unexpected synthesis error")):
        payload = {"text": "မင်္ဂလာပါ", "voice": "thiri"}
        response = client.post("/api/v1/tts", json=payload)
        assert response.status_code == 500
        data = response.json()
        assert "couldn't generate" in data.get("detail", "").lower()
