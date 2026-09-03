"""
Unit tests for the Admin role, default admin account seeding,
administrative dashboard APIs, and universal voice generation access.
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
from app.services.auth_service import hash_password

client = TestClient(app)
settings.TEST_MODE = True


def setup_admin_and_user():
    """Helper to ensure an admin and a normal user are available."""
    # 1. Seed or fetch admin
    admin = Repository.seed_default_admin(
        email="admin@burmeseatan.com",
        password_hash=hash_password("AdminPassword123!"),
        username="Admin"
    )
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@burmeseatan.com",
        "password": "AdminPassword123!"
    })
    admin_token = admin_login.json()["token"]

    # 2. Register normal user
    uid = uuid.uuid4().hex[:8]
    user_res = client.post("/api/v1/auth/register", json={
        "username": f"norm_{uid}",
        "email": f"norm_{uid}@example.com",
        "password": "Password123!"
    })
    user_data = user_res.json()
    user_token = user_data["token"]
    user_id = user_data["user"]["id"]

    return admin_token, user_token, user_id


def test_default_admin_account_and_permissions():
    """Verify default admin exists and has is_admin=True and is_premium=True."""
    admin_token, user_token, _ = setup_admin_and_user()

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    me_res = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["is_admin"] is True
    assert data["is_premium"] is True


def test_non_admin_forbidden_from_admin_endpoints():
    """Verify normal user receives 403 ADMIN_REQUIRED on admin routes."""
    _, user_token, _ = setup_admin_and_user()
    user_headers = {"Authorization": f"Bearer {user_token}"}

    res = client.get("/api/v1/admin/stats", headers=user_headers)
    assert res.status_code == 403
    assert res.json()["detail"]["code"] == "ADMIN_REQUIRED"


def test_admin_stats_and_user_list():
    """Verify admin can retrieve aggregated platform stats and user list."""
    admin_token, _, user_id = setup_admin_and_user()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Stats
    stats_res = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_users" in stats
    assert stats["total_users"] >= 2

    # Users list
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 2
    u_ids = [u["id"] for u in users]
    assert user_id in u_ids


def test_admin_adjust_user_credits():
    """Verify admin can manually adjust user credits."""
    admin_token, user_token, user_id = setup_admin_and_user()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Add 25 credits to normal user
    adj_res = client.post(
        f"/api/v1/admin/users/{user_id}/credits",
        json={"amount": 25, "reason": "Customer loyalty bonus"},
        headers=admin_headers
    )
    assert adj_res.status_code == 200
    assert adj_res.json()["success"] is True
    assert adj_res.json()["new_balance"] == 30  # 5 welcome + 25

    # Verify normal user's live balance
    bal_res = client.get("/api/v1/credits", headers=user_headers)
    assert bal_res.json()["balance"] == 30


def test_admin_can_generate_all_voices_freely():
    """Verify admin can synthesize using any premium voice without restriction."""
    admin_token, _, _ = setup_admin_and_user()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Football Commentator voice (Premium)
    p1 = {"text": "တိုက်ရိုက် ဘောလုံးပွဲ အထူးသတင်း", "voice": "football_live"}
    r1 = client.post("/api/v1/tts", json=p1, headers=admin_headers)
    assert r1.status_code == 200
    assert r1.headers["content-type"] == "audio/wav"

    # 2. Education Teacher voice (Premium)
    p2 = {"text": "ကလေးများအတွက် မြန်မာစာ သင်ခန်းစာ", "voice": "edu_teacher"}
    r2 = client.post("/api/v1/tts", json=p2, headers=admin_headers)
    assert r2.status_code == 200
    assert r2.headers["content-type"] == "audio/wav"

    # 3. Business Advertisement voice (Premium)
    p3 = {"text": "အထူး ပရိုမိုးရှင်း အရောင်းကြော်ငြာ", "voice": "biz_ad"}
    r3 = client.post("/api/v1/tts", json=p3, headers=admin_headers)
    assert r3.status_code == 200
    assert r3.headers["content-type"] == "audio/wav"
