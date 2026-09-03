"""
Unit tests for user registration, login, credit accounts, and transaction ledger.
Verifies that newly registered users receive exactly 5 free credits once,
and that logging in does NOT grant additional credits.
"""

import sys
from pathlib import Path
import uuid
import pytest
from fastapi.testclient import TestClient

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.config import settings

client = TestClient(app)
settings.TEST_MODE = True


def test_registration_grants_exactly_5_credits():
    """Verify that a new user registration grants exactly 5 free credits."""
    unique_id = uuid.uuid4().hex[:8]
    payload = {
        "username": f"user_{unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["user"]["credits_balance"] == 5
    assert data["user"]["email"] == payload["email"]


def test_login_does_not_grant_another_5_credits():
    """Verify that existing user login does NOT grant extra credits."""
    unique_id = uuid.uuid4().hex[:8]
    email = f"user_{unique_id}@example.com"
    password = "Password123!"

    # 1. Register user (receives 5 credits)
    reg_res = client.post("/api/v1/auth/register", json={
        "username": f"user_{unique_id}",
        "email": email,
        "password": password
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    # Check balance is 5
    headers = {"Authorization": f"Bearer {token}"}
    bal_res1 = client.get("/api/v1/credits", headers=headers)
    assert bal_res1.status_code == 200
    assert bal_res1.json()["balance"] == 5

    # 2. Login again
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    login_token = login_res.json()["token"]

    # Balance must still be 5, NOT 10
    login_headers = {"Authorization": f"Bearer {login_token}"}
    bal_res2 = client.get("/api/v1/credits", headers=login_headers)
    assert bal_res2.status_code == 200
    assert bal_res2.json()["balance"] == 5


def test_credit_transactions_history():
    """Verify that user transaction ledger displays the welcome bonus."""
    unique_id = uuid.uuid4().hex[:8]
    email = f"ledger_{unique_id}@example.com"

    reg_res = client.post("/api/v1/auth/register", json={
        "username": f"ledger_{unique_id}",
        "email": email,
        "password": "Password123!"
    })
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    tx_res = client.get("/api/v1/credits/transactions", headers=headers)
    assert tx_res.status_code == 200
    transactions = tx_res.json()
    assert len(transactions) >= 1
    assert transactions[0]["amount"] == 5
    assert transactions[0]["type"] == "FREE_CREDIT"
    assert "welcome" in transactions[0]["description"].lower()


def test_get_credit_packages():
    """Verify configured credit packages retrieval."""
    res = client.get("/api/v1/credits/packages")
    assert res.status_code == 200
    packages = res.json()
    assert len(packages) >= 3
    ids = [p["id"] for p in packages]
    assert "starter" in ids
    assert "creator" in ids
    assert "pro" in ids
