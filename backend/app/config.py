"""
Configuration module for Myanmar AI Voice Studio backend.
Defines supported Myanmar voice personas, Gemini prebuilt voice mappings, and speaking styles.
"""

from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable resolution."""
    
    APP_NAME: str = "BurmaVoice API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Gemini API Key (Server-side only)
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash", validation_alias="GEMINI_MODEL")
    
    # Text limits
    MAX_TEXT_LENGTH: int = 5000
    MIN_TEXT_LENGTH: int = 1
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


# Supported Myanmar AI Voices (Mapped to high-fidelity Gemini neural voices)
SUPPORTED_VOICES: List[Dict[str, Any]] = [
    {
        "id": "thiri",
        "name": "Thiri",
        "myanmar_name": "သီရိ",
        "gemini_voice": "Kore",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Natural & Clear",
        "persona_mm": "သဘာဝကျပြီး ကြည်လင်ပြတ်သားသော အသံ",
        "tone": "Warm, balanced, and articulate",
        "sample_tag": "General Reading, SaaS, Tutorials",
        "sample_text": "မင်္ဂလာပါရှင်။ သီရိ မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော အသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။"
    },
    {
        "id": "aung",
        "name": "Aung",
        "myanmar_name": "အောင်",
        "gemini_voice": "Puck",
        "gender": "Male (အမျိုးသား)",
        "persona": "Friendly & Engaging",
        "persona_mm": "ဖော်ရွေ၍ သွက်လက်တက်ကြွသော အသံ",
        "tone": "Approachable, conversational, and energetic",
        "sample_tag": "Podcasts, Social Media, Casual",
        "sample_text": "မင်္ဂလာပါ ခင်ဗျာ။ အောင် ပါ။ ပေါ့ဒ်ကတ်စ် နဲ့ ဗီဒီယိုတွေအတွက် အကောင်းဆုံး အသံထွက်ပေးမှာပါ။"
    },
    {
        "id": "may",
        "name": "May",
        "myanmar_name": "မေ",
        "gemini_voice": "Aoede",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Formal & News Broadcasting",
        "persona_mm": "သတင်းကြေညာနှင့် တရားဝင် အခမ်းအနား အသံ",
        "tone": "Formal, poised, and melodic",
        "sample_tag": "News, Documentaries, Presentations",
        "sample_text": "ဒီကနေ့ ထူးခြားတဲ့ သတင်းအချက်အလက်များကို မေ က တင်ဆက်ပေးသွားမှာ ဖြစ်ပါတယ်။"
    },
    {
        "id": "min",
        "name": "Min",
        "myanmar_name": "မင်း",
        "gemini_voice": "Fenrir",
        "gender": "Male (အမျိုးသား)",
        "persona": "Dynamic & Commercials",
        "persona_mm": "ကြော်ငြာနှင့် ပရိုမိုးရှင်း အသံ",
        "tone": "High energy, punchy, and modern",
        "sample_tag": "Commercials, Gaming, Promos",
        "sample_text": "အခုပဲ စတင်လိုက်ပါ။ အထူး အစီအစဉ်သစ်များ မကြာမီ လာပါတော့မယ်။"
    },
    {
        "id": "nandar",
        "name": "Nandar",
        "myanmar_name": "နန္ဒာ",
        "gemini_voice": "Leda",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Gentle & Storytelling",
        "persona_mm": "ညင်သာ၍ စိတ်အေးချမ်းစေသော ဇာတ်လမ်းပြော အသံ",
        "tone": "Soothing, expressive, and gentle",
        "sample_tag": "Audiobooks, Meditation, Stories",
        "sample_text": "ရှေးရှေးတုန်းက သာယာလှပတဲ့ မြို့ကလေးတစ်မြို့မှာ နေထိုင်ကြတဲ့..."
    },
    {
        "id": "kyaw",
        "name": "Kyaw Thu",
        "myanmar_name": "ကျော်သူ",
        "gemini_voice": "Charon",
        "gender": "Male (အမျိုးသား)",
        "persona": "Deep & Authoritative",
        "persona_mm": "ဩဇာညောင်းပြီး လေးနက်သော အသံ",
        "tone": "Resonant, deep, and trustworthy",
        "sample_tag": "Narration, History, Explainer",
        "sample_text": "သမိုင်းဝင် အဖြစ်အပျက်များနှင့် လေးနက်သော အကြောင်းအရာများကို ကျော်သူ က ရှင်းလင်းတင်ပြပါမည်။"
    }
]

# Supported Speaking Styles with Burmese Context
SUPPORTED_STYLES: List[Dict[str, str]] = [
    {
        "id": "natural",
        "name": "Natural",
        "myanmar_name": "သဘာဝအတိုင်း",
        "description": "Natural conversational cadence with authentic pauses.",
        "prompt_instruction": "Speak naturally and expressively in a clear Burmese/Myanmar conversational tone with authentic pauses."
    },
    {
        "id": "professional",
        "name": "Professional",
        "myanmar_name": "ကျွမ်းကျင်ပုံစံ",
        "description": "Polished, formal cadence suitable for business and education.",
        "prompt_instruction": "Speak in a formal, articulate, and professional executive tone."
    },
    {
        "id": "friendly",
        "name": "Friendly",
        "myanmar_name": "ဖော်ရွေသော",
        "description": "Warm and approachable delivery for social content.",
        "prompt_instruction": "Speak warmly, cheerfully, and in an approachable and friendly tone."
    },
    {
        "id": "storytelling",
        "name": "Storytelling",
        "myanmar_name": "ဇာတ်လမ်းပြော",
        "description": "Expressive narrative cadence with dramatic nuance.",
        "prompt_instruction": "Speak with expressive storytelling nuance, dramatic pauses, and engaging narrative inflection."
    },
    {
        "id": "news",
        "name": "News",
        "myanmar_name": "သတင်းကြေညာ",
        "description": "Crisp and objective broadcast delivery.",
        "prompt_instruction": "Speak in a clear, objective, and authoritative broadcast news anchor tone."
    },
    {
        "id": "calm",
        "name": "Calm",
        "myanmar_name": "အေးဆေးငြိမ်သက်",
        "description": "Peaceful, gentle, and relaxing cadence.",
        "prompt_instruction": "Speak in a peaceful, gentle, soothing, and relaxing cadence."
    }
]

settings = Settings()
