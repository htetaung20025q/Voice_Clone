"""
BurmeseATAN Performance Service.
Constructs multi-layered speaking performance instructions and resolves profiles.
"""

from typing import Dict, Any, Optional, List
import logging

from app.services.performance_profiles import (
    PerformanceProfile,
    PERFORMANCE_PROFILES,
    get_profile,
    list_profiles
)

logger = logging.getLogger("burmavoice.performance")

# Mapping style IDs to performance profiles
STYLE_TO_PROFILE_MAP = {
    "natural": "standard_natural",
    "professional": "standard_professional",
    "friendly": "standard_friendly",
    "storytelling": "ent_storyteller",
    "news": "football_news",
    "calm": "standard_calm"
}


class PerformanceService:
    """Central service managing voice performance profiles and prompt construction."""

    @staticmethod
    def get_profile(profile_id: str) -> PerformanceProfile:
        return get_profile(profile_id)

    @staticmethod
    def list_profiles(category: Optional[str] = None) -> List[PerformanceProfile]:
        return list_profiles(category)

    @staticmethod
    def resolve_performance_profile(
        voice_id: str,
        style_id: Optional[str] = None,
        profile_id: Optional[str] = None
    ) -> PerformanceProfile:
        """
        Resolve the appropriate PerformanceProfile based on explicit ID,
        voice persona ID, or style ID.
        """
        # 1. Explicit performance_profile argument takes highest precedence
        if profile_id:
            cleaned_pid = profile_id.strip().lower()
            if cleaned_pid in PERFORMANCE_PROFILES:
                return PERFORMANCE_PROFILES[cleaned_pid]

        # 2. Check if voice_id directly corresponds to a performance profile (e.g. football_live)
        cleaned_vid = voice_id.strip().lower()
        if cleaned_vid in PERFORMANCE_PROFILES:
            return PERFORMANCE_PROFILES[cleaned_vid]

        # 3. Check if style_id maps to a performance profile
        if style_id:
            cleaned_sid = style_id.strip().lower()
            if cleaned_sid in STYLE_TO_PROFILE_MAP:
                target_pid = STYLE_TO_PROFILE_MAP[cleaned_sid]
                if target_pid in PERFORMANCE_PROFILES:
                    return PERFORMANCE_PROFILES[target_pid]
            if cleaned_sid in PERFORMANCE_PROFILES:
                return PERFORMANCE_PROFILES[cleaned_sid]

        # 4. Default to standard natural
        return PERFORMANCE_PROFILES["standard_natural"]

    @staticmethod
    def build_tts_instruction(
        voice_info: Dict[str, Any],
        performance: PerformanceProfile,
        text: str,
        language: str = "myanmar"
    ) -> str:
        """
        Construct structured, multi-dimensional TTS prompt instructions for Gemini.
        Separates Voice Identity (timbre/vocal characteristics) from
        Performance Style (energy, pacing, emotion, emphasis, pauses, Burmese cadence).
        """
        voice_name = voice_info.get("name", "Thiri")
        voice_tone = voice_info.get("tone", "Balanced and clear")
        voice_gender = voice_info.get("gender", "Female")

        directive_lines = [
            f"[SPEAKER IDENTITY: {voice_name.upper()}]",
            f"Vocal Character: {voice_tone} ({voice_gender}).",
            "",
            f"[PERFORMANCE STYLE: {performance.name.upper()} ({performance.name_mm})]",
            f"Category: {performance.category}",
            f"Energy Level: {performance.energy}",
            f"Pacing & Tempo: {performance.pacing}",
            f"Emotional Intensity: {performance.emotion}",
            f"Pitch Variation: {performance.pitch_variation}",
            f"Pauses: {performance.pauses}",
            f"Emphasis Rules: {performance.emphasis}",
            f"Delivery Format: {performance.delivery}",
            "",
            "[PERFORMANCE INSTRUCTIONS]",
            performance.instructions,
            "",
            "[BURMESE ACOUSTIC & TONAL GUIDELINES]",
            performance.burmese_guidance,
            "Maintain proper Myanmar phonology and tonal boundaries.",
            "Do not translate the text into English; pronounce the exact Myanmar Unicode text provided.",
            "",
            "[TRANSCRIPT TO READ ALOUD]",
            text.strip()
        ]

        return "\n".join(directive_lines)


performance_service = PerformanceService()
