"""
Unit tests for payment checkout, idempotent verification, and webhook handling.
Verifies that:
- Verified payments add package credits and set is_premium = True.
- Duplicate verifications or webhook calls with the same reference are strictly idempotent
  and never grant double credits.
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
from app.db.repository import Repository

client = TestClient(app)
settings.TEST_MODE = True


def register_test_user(prefix="pay_user"):
    unique_id = uuid.uuid4().hex[:8]
    email = f"{prefix}_{unique_id}@example.com"
    res = client.post("/api/v1/auth/register", json={
        "username": f"{prefix}_{unique_id}",
        "email": email,
        "password": "Password123!"
    })
    data = res.json()
    return data["user"], data["token"]


def test_payment_checkout_and_verification():
    """Verify checkout creation, server-side verification, credit granting, and premium unlock."""
    user, token = register_test_user("checkout")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Checkout Starter Package (100 credits)
    checkout_res = client.post("/api/v1/payments/checkout", json={"package_id": "starter"}, headers=headers)
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()
    ref = checkout_data["payment_reference"]
    assert ref.startswith("pay_")
    assert checkout_data["credits"] == 100

    # 2. Verify payment
    verify_res = client.post("/api/v1/payments/verify", json={"payment_reference": ref}, headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["success"] is True
    assert verify_data["status"] == "PAID"
    assert verify_data["credits_added"] == 100
    assert verify_data["new_balance"] == 105  # 5 free + 100 purchased

    # 3. Check live credit balance and premium status
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 105
    assert bal_res.json()["is_premium"] is True

    # 4. Check transactions
    tx_res = client.get("/api/v1/credits/transactions", headers=headers)
    txs = tx_res.json()
    purchase_tx = next(t for t in txs if t["type"] == "PURCHASE")
    assert purchase_tx["amount"] == 100
    assert purchase_tx["reference_id"] == ref


def test_duplicate_payment_verification_is_idempotent():
    """Verify that verifying the same payment twice does NOT grant duplicate credits."""
    user, token = register_test_user("idempotent")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Checkout Creator Package (500 credits)
    checkout_res = client.post("/api/v1/payments/checkout", json={"package_id": "creator"}, headers=headers)
    ref = checkout_res.json()["payment_reference"]

    # 2. First verification: grants 500 credits
    v1 = client.post("/api/v1/payments/verify", json={"payment_reference": ref}, headers=headers)
    assert v1.status_code == 200
    assert v1.json()["credits_added"] == 500
    assert v1.json()["new_balance"] == 505

    # 3. Second verification with same reference: MUST NOT add 500 credits again
    v2 = client.post("/api/v1/payments/verify", json={"payment_reference": ref}, headers=headers)
    assert v2.status_code == 200
    assert v2.json()["credits_added"] == 0  # No duplicate credits added
    assert v2.json()["new_balance"] == 505  # Balance stays at 505

    # 4. Third verification via Webhook endpoint
    webhook_res = client.post("/api/v1/payments/webhook", json={"payment_reference": ref, "status": "PAID"})
    assert webhook_res.status_code == 200
    assert webhook_res.json()["status"] == "success"

    # Final balance check
    bal_res = client.get("/api/v1/credits", headers=headers)
    assert bal_res.json()["balance"] == 505
