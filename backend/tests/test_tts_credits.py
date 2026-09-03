"""
Unit tests for credit deduction and access control during TTS synthesis.
Tests:
- Successful generation deducts credits, logs transaction, and creates SUCCESS generation.
- Failed generation does NOT deduct credits and marks generation FAILED.
- Insufficient credits (balance = 0) returns 402 error without deduction.
- Free user using premium voice is rejected with 403 error.
- Authorized/premium user using premium voice succeeds.
"""

import sys
from pathlib import Path
import uuid
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.config import settings
from app.db.repository import Repository
from app.services.gemini_tts import tts_service

client = TestClient(app)
settings.TEST_MODE = True


def register_test_user(prefix="user"):
    unique_id = uuid.uuid4().hex[:8]
    email = f"{prefix}_{unique_id}@example.com"
    res = client.post("/api/v1/auth/register", json={
        "username": f"{prefix}_{unique_id}",
        "email": email,
        "password": "Password123!"
    })
    data = res.json()
    return data["user"], data["token"]


def test_successful_tts_deducts_credit_and_creates_records():
    """Verify successful TTS deducts credit, creates transaction, and records SUCCESS generation."""
    user, token = register_test_user("success_tts")
    headers = {"Authorization": f"Bearer {token}"}

    # Initial balance is 5
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 5

    payload = {
        "text": "မင်္ဂလာပါ ခင်ဗျာ။",
        "voice": "thiri",
        "style": "natural"
    }
    response = client.post("/api/v1/tts", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.headers["X-Audio-Credits-Used"] == "1"
    assert response.headers["X-Audio-Credits-Remaining"] == "4"

    # Verify balance is now 4
    bal_res2 = client.get("/api/v1/credits", headers=headers)
    assert bal_res2.json()["balance"] == 4

    # Verify transaction ledger has TTS_USAGE
    tx_res = client.get("/api/v1/credits/transactions", headers=headers)
    txs = tx_res.json()
    assert len(txs) >= 2
    usage_tx = next(t for t in txs if t["type"] == "TTS_USAGE")
    assert usage_tx["amount"] == -1

    # Verify generation history record
    gens = Repository.get_user_generations(user["id"])
    assert len(gens) >= 1
    assert gens[0]["status"] == "SUCCESS"
    assert gens[0]["credits_used"] == 1


def test_failed_tts_does_not_deduct_credits():
    """Verify that if TTS provider fails, NO credits are deducted."""
    user, token = register_test_user("failed_tts")
    headers = {"Authorization": f"Bearer {token}"}

    # Mock synthesize to raise an unexpected runtime error
    with patch.object(tts_service, "synthesize", side_effect=RuntimeError("Provider temporary failure")):
        payload = {"text": "စမ်းသပ်မှု စာသား", "voice": "thiri"}
        response = client.post("/api/v1/tts", json=payload, headers=headers)
        assert response.status_code == 500

    # Balance must remain exactly 5
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 5

    # Generation record should be marked FAILED
    gens = Repository.get_user_generations(user["id"])
    assert len(gens) >= 1
    assert gens[0]["status"] == "FAILED"


def test_insufficient_credits_rejected():
    """Verify that user with 0 credits receives 402 INSUFFICIENT_CREDITS."""
    user, token = register_test_user("zero_credits")
    headers = {"Authorization": f"Bearer {token}"}

    # Deduct all 5 welcome credits to simulate 0 balance
    Repository.deduct_credits_atomic(user["id"], 5, "ADMIN_ADJUSTMENT", "Clear balance")
    assert Repository.get_credit_balance(user["id"]) == 0

    payload = {"text": "မင်္ဂလာပါ ခင်ဗျာ။", "voice": "thiri"}
    response = client.post("/api/v1/tts", json=payload, headers=headers)
    assert response.status_code == 402
    err = response.json()["detail"]
    assert err["code"] == "INSUFFICIENT_CREDITS"

    # Balance remains 0
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 0


def test_free_user_premium_voice_rejected():
    """Verify that a free non-premium user selecting a premium voice is rejected with 403."""
    user, token = register_test_user("free_user")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "text": "ဂိုးးးး! အံ့အားသင့်ဖွယ် ကန်သွင်းလိုက်ပါပြီ!",
        "voice": "football_live"  # Premium Football Commentator voice
    }
    response = client.post("/api/v1/tts", json=payload, headers=headers)
    assert response.status_code == 403
    err = response.json()["detail"]
    assert err["code"] == "PREMIUM_VOICE_REQUIRED"

    # Balance should not be deducted
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 5


def test_authorized_user_premium_voice_allowed():
    """Verify that an authorized user with premium access can use premium voices."""
    user, token = register_test_user("premium_user")
    headers = {"Authorization": f"Bearer {token}"}

    # Upgrade user to premium
    Repository.set_user_premium(user["id"], is_premium=True)

    payload = {
        "text": "ဂိုးးးး! လှပစွာ ကန်သွင်းလိုက်ပါပြီ ခင်ဗျာ!",
        "voice": "football_live"
    }
    response = client.post("/api/v1/tts", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.headers["X-Audio-Credits-Used"] == "1"
    assert response.headers["X-Audio-Credits-Remaining"] == "4"
