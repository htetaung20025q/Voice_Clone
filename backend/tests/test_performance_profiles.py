"""
Tests for BurmeseATAN Voice Performance & Accent System.
Verifies separation of Voice Identity from Performance Style,
prompt instruction differentiation, and API endpoints.
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.performance_profiles import (
    PERFORMANCE_PROFILES,
    get_profile,
    list_profiles
)
from app.services.performance_service import performance_service
from app.config import SUPPORTED_VOICES


@pytest.fixture
def client():
    return TestClient(app)


def test_performance_profiles_registry_completeness():
    """Verify all required performance profiles exist and have distinct attributes."""
    required_keys = [
        "football_live",
        "football_highlights",
        "football_news",
        "edu_teacher",
        "edu_lecturer",
        "edu_tutorial",
        "edu_kids",
        "ent_storyteller",
        "ent_dramatic",
        "ent_podcast",
        "ent_character",
        "biz_ad",
        "biz_corporate",
        "biz_product",
        "biz_announcement",
        "standard_natural",
        "standard_professional",
        "standard_friendly",
        "standard_calm"
    ]
    for key in required_keys:
        profile = get_profile(key)
        assert profile.id == key
        assert len(profile.name) > 0
        assert len(profile.name_mm) > 0
        assert len(profile.instructions) > 20
        assert len(profile.burmese_guidance) > 10
        assert profile.energy in ["Very High", "High", "Medium", "Medium-High", "Low-Medium", "Variable (dynamic shifts)"]


def test_performance_profiles_produce_distinct_instructions():
    """
    CRITICAL REQUIREMENT:
    Verify that different performance profiles produce noticeably different
    TTS prompt instructions and distinct delivery attributes.
    """
    sample_text = "မင်္ဂလာပါ ခင်ဗျာ။ ပရိသတ်ကြီး အားလုံး မင်္ဂလာပါ။"
    thiri_voice = next(v for v in SUPPORTED_VOICES if v["id"] == "thiri")

    # 1. Football Live vs Sports News
    football_live = get_profile("football_live")
    sports_news = get_profile("football_news")
    instr_live = performance_service.build_tts_instruction(thiri_voice, football_live, sample_text)
    instr_news = performance_service.build_tts_instruction(thiri_voice, sports_news, sample_text)
    assert instr_live != instr_news
    assert "live stadium" in instr_live or "stadium broadcast" in instr_live
    assert "bulletin" in instr_news or "anchor" in instr_news
    assert football_live.energy != sports_news.energy

    # 2. Teacher vs Lecturer
    teacher = get_profile("edu_teacher")
    lecturer = get_profile("edu_lecturer")
    instr_teacher = performance_service.build_tts_instruction(thiri_voice, teacher, sample_text)
    instr_lecturer = performance_service.build_tts_instruction(thiri_voice, lecturer, sample_text)
    assert instr_teacher != instr_lecturer
    assert "classroom" in instr_teacher.lower()
    assert "auditorium" in instr_lecturer.lower() or "symposium" in instr_lecturer.lower()
    assert teacher.pacing != lecturer.pacing

    # 3. Storyteller vs Podcast
    storyteller = get_profile("ent_storyteller")
    podcast = get_profile("ent_podcast")
    instr_story = performance_service.build_tts_instruction(thiri_voice, storyteller, sample_text)
    instr_pod = performance_service.build_tts_instruction(thiri_voice, podcast, sample_text)
    assert instr_story != instr_pod
    assert "cinematic storytelling" in instr_story.lower()
    assert "podcast host" in instr_pod.lower()
    assert storyteller.pitch_variation != podcast.pitch_variation

    # 4. Advertisement vs Corporate Presentation
    ad = get_profile("biz_ad")
    corporate = get_profile("biz_corporate")
    instr_ad = performance_service.build_tts_instruction(thiri_voice, ad, sample_text)
    instr_corp = performance_service.build_tts_instruction(thiri_voice, corporate, sample_text)
    assert instr_ad != instr_corp
    assert "commercial advertisement" in instr_ad.lower()
    assert "boardrooms" in instr_corp.lower() or "corporate" in instr_corp.lower()
    assert ad.energy != corporate.energy


def test_voice_identity_separated_from_performance():
    """
    Verify Voice Identity (e.g. Thiri vs Aung) can be independently combined
    with the exact same Performance Profile (e.g. Football Live).
    """
    thiri_voice = next(v for v in SUPPORTED_VOICES if v["id"] == "thiri")
    aung_voice = next(v for v in SUPPORTED_VOICES if v["id"] == "aung")
    football_live = get_profile("football_live")

    sample_text = "ဂိုး... ဂိုး... ဂိုး... အံ့သြဖွယ် ကန်သွင်းယူလိုက်ပါပြီ ခင်ဗျာ။"

    thiri_instruction = performance_service.build_tts_instruction(thiri_voice, football_live, sample_text)
    aung_instruction = performance_service.build_tts_instruction(aung_voice, football_live, sample_text)

    # Both share the exact same football live performance specifications
    assert "[PERFORMANCE STYLE: FOOTBALL LIVE COMMENTATOR" in thiri_instruction
    assert "[PERFORMANCE STYLE: FOOTBALL LIVE COMMENTATOR" in aung_instruction
    assert "Explosive emphasis on critical match moments" in thiri_instruction
    assert "Explosive emphasis on critical match moments" in aung_instruction

    # But have distinct speaker identity directives
    assert "[SPEAKER IDENTITY: THIRI]" in thiri_instruction
    assert "[SPEAKER IDENTITY: AUNG]" in aung_instruction


def test_get_performance_profiles_api(client):
    """Verify GET /api/v1/performance-profiles endpoint."""
    res = client.get("/api/v1/performance-profiles")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 15
    profile_ids = [p["id"] for p in data]
    assert "football_live" in profile_ids
    assert "edu_teacher" in profile_ids
    assert "ent_storyteller" in profile_ids
    assert "biz_ad" in profile_ids


def test_get_performance_profiles_by_category_api(client):
    """Verify category filtering on /api/v1/performance-profiles."""
    res = client.get("/api/v1/performance-profiles?category=FOOTBALL")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    for p in data:
        assert p["category"] == "FOOTBALL"


def test_tts_synthesis_includes_performance_metadata(client):
    """
    Verify TTS synthesis properly captures performance_profile in
    returned metadata.
    """
    uid = uuid.uuid4().hex[:8]
    # 1. Register a user to get auth token and credits
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"username": f"user_{uid}", "email": f"user_{uid}@test.com", "password": "Password123!"}
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]

    # 2. Call TTS specifying performance_profile
    tts_res = client.post(
        "/api/v1/tts?format=json",
        json={
            "text": "ဒီနေ့ ပွဲစဉ်မှာတော့ မန်ချက်စတာ ယူနိုက်တက် အသင်းက ဦးဆောင် ဂိုး သွင်းယူသွားခဲ့ပါတယ်။",
            "voice": "thiri",
            "performance_profile": "football_live"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert tts_res.status_code == 200
    res_data = tts_res.json()
    assert "metadata" in res_data
    meta = res_data["metadata"]
    assert meta["performance_profile"] == "football_live"
    assert meta["performance_name"] == "Football Live Commentator"
    assert meta["voice"] == "thiri"
