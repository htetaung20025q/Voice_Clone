"""
Backend test suite for BurmaVoice Myanmar TTS.
"""

import io
import wave
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_get_myanmar_voices():
    response = client.get("/api/v1/voices")
    assert response.status_code == 200
    voices = response.json()
    assert len(voices) >= 5
    ids = [v["id"] for v in voices]
    assert "thiri" in ids
    assert "aung" in ids
    assert "may" in ids


def test_get_myanmar_styles():
    response = client.get("/api/v1/styles")
    assert response.status_code == 200
    styles = response.json()
    assert len(styles) >= 5
    ids = [s["id"] for s in styles]
    assert "natural" in ids
    assert "storytelling" in ids


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
