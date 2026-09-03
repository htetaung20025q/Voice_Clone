"""
Configuration module for Myanmar AI Voice Studio backend.
Defines supported Myanmar voice personas, Gemini prebuilt voice mappings, and speaking styles.
"""

from pathlib import Path
from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

_BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """Application settings with environment variable resolution."""
    
    APP_NAME: str = "BurmeseATAN API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    TEST_MODE: bool = False
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Gemini API Key (Server-side only)
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-3.1-flash-tts-preview", validation_alias="GEMINI_MODEL")
    
    # Google Cloud Voice Replication Configuration
    GCP_PROJECT_ID: str = Field(default="", validation_alias="GCP_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS: str = Field(default="", validation_alias="GOOGLE_APPLICATION_CREDENTIALS")
    GCP_SERVICE_ACCOUNT_JSON: str = Field(default="", validation_alias="GCP_SERVICE_ACCOUNT_JSON")
    VOICE_REPLICATION_MODEL: str = Field(default="gemini-3.1-flash-tts-preview", validation_alias="VOICE_REPLICATION_MODEL")
    VOICE_SESSION_TTL_HOURS: int = 168  # 7 days (Google temporary replication key validity)
    MAX_AUDIO_UPLOAD_SIZE_MB: int = 25
    
    # Text limits
    MAX_TEXT_LENGTH: int = 5000
    MIN_TEXT_LENGTH: int = 1
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", ".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


# Official Google Cloud Voice Consent Statements
BURMESE_CONSENT_STATEMENT = "ကျွန်ုပ်သည် ဤအသံ၏ပိုင်ရှင်ဖြစ်ပြီး Google Cloud ကိုအသုံးပြုခြင်းဖြင့် ကျွန်ုပ်၏အသံ၏ ပေါင်းစပ်ပုံစံတစ်ခု ဖန်တီးရန် သဘောတူပါသည်။"
ENGLISH_CONSENT_STATEMENT = "I am the owner of this voice and I consent to Google Cloud using this voice to create a synthetic voice model."

# Supported Voice Replication Languages
SUPPORTED_REPLICATION_LANGUAGES: List[Dict[str, str]] = [
    {
        "id": "my-MM",
        "name": "မြန်မာ (Burmese)",
        "consent_statement": BURMESE_CONSENT_STATEMENT,
        "default_sample": "မင်္ဂလာပါ။ ဒီနေ့ကောင်းမွန်တဲ့နေ့တစ်နေ့ဖြစ်ပါစေ။"
    },
    {
        "id": "en-US",
        "name": "English (US)",
        "consent_statement": ENGLISH_CONSENT_STATEMENT,
        "default_sample": "Hello. This is a voice replication test."
    }
]


# Supported Myanmar AI Voices (Mapped to high-fidelity Gemini neural voices)
# Supported Myanmar AI Voices (Standard Free & Premium Categories)
SUPPORTED_VOICES: List[Dict[str, Any]] = [
    # ==========================================
    # Standard Free Voices
    # ==========================================
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
        "sample_text": "မင်္ဂလာပါရှင်။ သီရိ မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော အသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။",
        "category": "STANDARD",
        "premium": False
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
        "sample_text": "မင်္ဂလာပါ ခင်ဗျာ။ အောင် ပါ။ ပေါ့ဒ်ကတ်စ် နဲ့ ဗီဒီယိုတွေအတွက် အကောင်းဆုံး အသံထွက်ပေးမှာပါ။",
        "category": "STANDARD",
        "premium": False
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
        "sample_text": "ဒီကနေ့ ထူးခြားတဲ့ သတင်းအချက်အလက်များကို မေ က တင်ဆက်ပေးသွားမှာ ဖြစ်ပါတယ်။",
        "category": "STANDARD",
        "premium": False
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
        "sample_text": "အခုပဲ စတင်လိုက်ပါ။ အထူး အစီအစဉ်သစ်များ မကြာမီ လာပါတော့မယ်။",
        "category": "STANDARD",
        "premium": False
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
        "sample_text": "ရှေးရှေးတုန်းက သာယာလှပတဲ့ မြို့ကလေးတစ်မြို့မှာ နေထိုင်ကြတဲ့...",
        "category": "STANDARD",
        "premium": False
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
        "sample_text": "သမိုင်းဝင် အဖြစ်အပျက်များနှင့် လေးနက်သော အကြောင်းအရာများကို ကျော်သူ က ရှင်းလင်းတင်ပြပါမည်။",
        "category": "STANDARD",
        "premium": False
    },

    # ==========================================
    # Premium: FOOTBALL (4 Personas)
    # ==========================================
    {
        "id": "football_live",
        "name": "Live Commentator",
        "myanmar_name": "တိုက်ရိုက် ပွဲစဉ် အသံလွှင့်သူ",
        "gemini_voice": "Fenrir",
        "gender": "Male (အမျိုးသား)",
        "persona": "Live Football Commentary",
        "persona_mm": "သွက်လက်စိတ်လှုပ်ရှားဖွယ် တိုက်ရိုက်ပွဲစဉ် သုံးသပ်အသံ",
        "tone": "Urgent, electrifying, fast-paced and passionate",
        "sample_tag": "Football Matches, Live Sports, Stadium",
        "sample_text": "ဂိုးးးး! ဘယ်ခြေနဲ့ ကန်သွင်းလိုက်တဲ့ ဘောလုံး ဂိုးစည်းထဲကို လှပစွာ ဝင်ရောက်သွားပါပြီ ခင်ဗျာ!",
        "category": "FOOTBALL",
        "premium": True
    },
    {
        "id": "football_excited",
        "name": "Excited Commentator",
        "myanmar_name": "စိတ်လှုပ်ရှားဖွယ် အသံလွှင့်သူ",
        "gemini_voice": "Puck",
        "gender": "Male (အမျိုးသား)",
        "persona": "High Intensity & Hype",
        "persona_mm": "ပွဲအရှိန်မြှင့်တင်ပေးသော စိတ်လှုပ်ရှားဖွယ် အသံ",
        "tone": "Enthusiastic, gripping, and high tempo",
        "sample_tag": "Key Moments, Penalty Shootouts",
        "sample_text": "အခုပဲ တန်ပြန်တိုက်စစ်ကနေ အခွင့်အရေးရရှိသွားပါပြီ! အဆုံးအဖြတ်ပေးနိုင်မလား စောင့်ကြည့်ရပါမယ်!",
        "category": "FOOTBALL",
        "premium": True
    },
    {
        "id": "football_highlights",
        "name": "Match Highlights",
        "myanmar_name": "ပွဲစဉ်အကျဉ်း သုံးသပ်သူ",
        "gemini_voice": "Charon",
        "gender": "Male (အမျိုးသား)",
        "persona": "Tactical & Highlights Review",
        "persona_mm": "ပွဲစဉ်အပြီး ပညာသားပါပါ သုံးသပ်ချက် အသံ",
        "tone": "Insightful, analytical, and authoritative",
        "sample_tag": "Post-match Highlights, Tactical Analysis",
        "sample_text": "ဒီကနေ့ ပွဲစဉ်မှာ နှစ်သင်းစလုံး အကြိတ်အနယ် ကစားခဲ့ကြပြီး ကွင်းလယ်ထိန်းချုပ်မှုက အဆုံးအဖြတ် ဖြစ်ခဲ့ပါတယ်။",
        "category": "FOOTBALL",
        "premium": True
    },
    {
        "id": "football_news",
        "name": "Sports News",
        "myanmar_name": "အားကစား သတင်းကြေညာသူ",
        "gemini_voice": "Aoede",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Sports News Anchor",
        "persona_mm": "အားကစားသတင်း အထူးသတင်းလွှာ တင်ဆက်အသံ",
        "tone": "Polished, crisp, objective and articulate",
        "sample_tag": "Transfer News, League Tables, Daily Sports",
        "sample_text": "ဒီကနေ့ နိုင်ငံတကာ အားကစား သတင်းလွှာများမှာတော့ ကစားသမား အပြောင်းအရွှေ့ စာချုပ်သစ် သတင်းများ ပါဝင်ပါတယ်။",
        "category": "FOOTBALL",
        "premium": True
    },

    # ==========================================
    # Premium: EDUCATION (4 Personas)
    # ==========================================
    {
        "id": "edu_teacher",
        "name": "Teacher",
        "myanmar_name": "ဆရာမ အသံ",
        "gemini_voice": "Kore",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "School Teacher & Instructor",
        "persona_mm": "စိတ်ရှည် နားလည်လွယ်သော သင်ကြားရေး အသံ",
        "tone": "Warm, clear, patient, and instructive",
        "sample_tag": "Classroom, Lessons, Grammar",
        "sample_text": "မင်္ဂလာပါ ကလေးတို့ရေ။ ဒီနေ့ သင်ခန်းစာမှာတော့ မြန်မာစာ သဒ္ဒါစည်းမျဉ်းများကို စတင် လေ့လာကြပါမယ်။",
        "category": "EDUCATION",
        "premium": True
    },
    {
        "id": "edu_lecturer",
        "name": "Lecturer",
        "myanmar_name": "တက္ကသိုလ် ကထိက အသံ",
        "gemini_voice": "Charon",
        "gender": "Male (အမျိုးသား)",
        "persona": "Academic University Lecturer",
        "persona_mm": "လေးနက်၍ ပညာရပ်ဆိုင်ရာ ဩဇာရှိသော အသံ",
        "tone": "Scholarly, steady, deep, and informative",
        "sample_tag": "Higher Education, History, Science",
        "sample_text": "ဒီကနေ့ ပို့ချချက်မှာတော့ ဒစ်ဂျစ်တယ် နည်းပညာနှင့် လူမှုစီးပွား ဆက်နွယ်မှု သဘောတရားများကို လေ့လာပါမည်။",
        "category": "EDUCATION",
        "premium": True
    },
    {
        "id": "edu_tutorial",
        "name": "Tutorial",
        "myanmar_name": "သင်ခန်းစာ လမ်းညွှန်သူ",
        "gemini_voice": "Puck",
        "gender": "Male (အမျိုးသား)",
        "persona": "Step-by-step Explainer",
        "persona_mm": "အဆင့်ဆင့် ရှင်းလင်းသင်ပြသော နည်းပညာအသံ",
        "tone": "Pragmatic, friendly, and structured",
        "sample_tag": "Coding Tutorials, Software Guides, How-to",
        "sample_text": "ပထမဦးစွာ Project folder ကို ဖွင့်ပါ၊ ပြီးရင် Terminal တွင် လိုအပ်သော dependency များကို install ပြုလုပ်ပါ။",
        "category": "EDUCATION",
        "premium": True
    },
    {
        "id": "edu_kids",
        "name": "Kids Learning",
        "myanmar_name": "ကလေးများအတွက် သင်ကြားရေး",
        "gemini_voice": "Leda",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Early Childhood Educator",
        "persona_mm": "ကလေးများအတွက် ချစ်စဖွယ် နုပျိုတက်ကြွသော အသံ",
        "tone": "Gentle, melodic, playful, and cheerful",
        "sample_tag": "Children Stories, Alphabets, Nursery",
        "sample_text": "ကကြီး ကလေးငယ် ချစ်စဖွယ်၊ ခခွေး သခင် ချစ်တဲ့ခွေးကလေး… အတူတူ ဆိုကြမယ်နော်။",
        "category": "EDUCATION",
        "premium": True
    },

    # ==========================================
    # Premium: ENTERTAINMENT (4 Personas)
    # ==========================================
    {
        "id": "ent_storyteller",
        "name": "Storyteller",
        "myanmar_name": "ဇာတ်လမ်းပြောသူ",
        "gemini_voice": "Leda",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Literary Storyteller",
        "persona_mm": "ရသစုံလင်သော စာပေနှင့် ဇာတ်လမ်းဖတ်ကြား အသံ",
        "tone": "Atmospheric, emotive, suspenseful and rich",
        "sample_tag": "Audiobooks, Folk Tales, Fiction",
        "sample_text": "ညဉ့်နက်သန်းခေါင် အချိန်မှာတော့ တောအုပ်နက်ကြီးအတွင်းက လျှို့ဝှက်ဆန်းကြယ်တဲ့ အလင်းရောင်တစ်ခု စတင် တောက်ပလာခဲ့ပါတယ်။",
        "category": "ENTERTAINMENT",
        "premium": True
    },
    {
        "id": "ent_dramatic",
        "name": "Dramatic",
        "myanmar_name": "ပြဇာတ်နှင့် ရုပ်ရှင် အထူးအသံ",
        "gemini_voice": "Charon",
        "gender": "Male (အမျိုးသား)",
        "persona": "Cinematic Trailer & Drama",
        "persona_mm": "ရုပ်ရှင်နှင့် ဇာတ်လမ်းတွဲများအတွက် လေးနက်စိတ်လှုပ်ရှားဖွယ် အသံ",
        "tone": "Cinematic, booming, gravelly, and momentous",
        "sample_tag": "Movie Trailers, Teasers, Epics",
        "sample_text": "ကမ္ဘာမြေ၏ ကံကြမ္မာသည် သူတို့၏ လက်ထဲတွင်သာ ရှိတော့သည်… မကြာမီ ရုံတင်ပြသတော့မည်။",
        "category": "ENTERTAINMENT",
        "premium": True
    },
    {
        "id": "ent_character",
        "name": "Character",
        "myanmar_name": "ကာတွန်းနှင့် ဇာတ်ကောင် အသံ",
        "gemini_voice": "Puck",
        "gender": "Male (အမျိုးသား)",
        "persona": "Animation & Game Voice Acting",
        "persona_mm": "ကာတွန်းနှင့် ဂိမ်းဇာတ်ကောင် သရုပ်ဆောင် အသံ",
        "tone": "Expressive, animated, punchy, and comedic",
        "sample_tag": "Animation, Gaming, Comic Dubbing",
        "sample_text": "ဟေ့လူတွေ… ငါ့နောက်ကို လိုက်ခဲ့ကြ! ဒီစွန့်စားခန်းက အခုမှ တကယ့်ကို စတင်တာ!",
        "category": "ENTERTAINMENT",
        "premium": True
    },
    {
        "id": "ent_podcast",
        "name": "Podcast Host",
        "myanmar_name": "ပေါ့ဒ်ကတ်စ် အစီအစဉ် တင်ဆက်သူ",
        "gemini_voice": "Kore",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Modern Audio Show Host",
        "persona_mm": "နားထောင်သူနှင့် ရင်းနှီးနွေးထွေးသော အစီအစဉ် တင်ဆက်အသံ",
        "tone": "Intimate, relaxed, witty, and engaging",
        "sample_tag": "Talk Shows, Interviews, Lifestyle",
        "sample_text": "ဒီကနေ့ ကျွန်မတို့ရဲ့ ပေါ့ဒ်ကတ်စ် အစီအစဉ်ကနေ အောင်မြင်တဲ့ လူငယ်ဖန်တီးသူတစ်ဦးနဲ့ စကားစမြည် ပြောကြားသွားပါမယ်။",
        "category": "ENTERTAINMENT",
        "premium": True
    },

    # ==========================================
    # Premium: BUSINESS (4 Personas)
    # ==========================================
    {
        "id": "biz_ad",
        "name": "Advertisement",
        "myanmar_name": "အရောင်းမြှင့်တင်ရေး ကြော်ငြာ",
        "gemini_voice": "Fenrir",
        "gender": "Male (အမျိုးသား)",
        "persona": "Commercial Promotion",
        "persona_mm": "ဆွဲဆောင်မှုရှိသော ကုန်ပစ္စည်း အရောင်းကြော်ငြာ အသံ",
        "tone": "Persuasive, energetic, modern, and snappy",
        "sample_tag": "Sales Ads, TikTok Ads, Promotion",
        "sample_text": "အထူး ပရိုမိုးရှင်း အစီအစဉ်ကြီး လာပါပြီ! အခုပဲ ၅၀% လျှော့စျေးနဲ့ ဝယ်ယူလိုက်ပါ။",
        "category": "BUSINESS",
        "premium": True
    },
    {
        "id": "biz_corporate",
        "name": "Corporate Presentation",
        "myanmar_name": "ကော်ပိုရိတ် စီးပွားရေး တင်ပြချက်",
        "gemini_voice": "Kore",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Executive Briefing",
        "persona_mm": "လုပ်ငန်းရှင်များနှင့် ရင်းနှီးမြှုပ်နှံသူများအတွက် အထူးအသံ",
        "tone": "Executive, articulate, trustworthy, and poised",
        "sample_tag": "Pitch Decks, Annual Reports, Strategy",
        "sample_text": "ကျွန်ုပ်တို့၏ ကုမ္ပဏီသည် ယခုဘဏ္ဍာရေးနှစ်အတွင်း ၃၅ ရာခိုင်နှုန်း တိုးတက်မှု စံချိန်တင် ရရှိခဲ့ပါသည်။",
        "category": "BUSINESS",
        "premium": True
    },
    {
        "id": "biz_product",
        "name": "Product Presenter",
        "myanmar_name": "ထုတ်ကုန် မိတ်ဆက်သူ",
        "gemini_voice": "Puck",
        "gender": "Male (အမျိုးသား)",
        "persona": "Tech & Product Launch",
        "persona_mm": "နည်းပညာနှင့် ထုတ်ကုန်အသစ် မိတ်ဆက်ရှင်းလင်းသံ",
        "tone": "Confident, clear, innovative, and sleek",
        "sample_tag": "SaaS Demos, Unboxing, Launch Events",
        "sample_text": "စွမ်းဆောင်ရည် အသစ်များစွာ ပါဝင်လာတဲ့ ကျွန်ုပ်တို့ရဲ့ စမတ်ဖုန်းသစ်ကို ဂုဏ်ယူစွာ မိတ်ဆက်ပေးအပ်ပါတယ်။",
        "category": "BUSINESS",
        "premium": True
    },
    {
        "id": "biz_announcement",
        "name": "Official Announcement",
        "myanmar_name": "တရားဝင် အသိပေး ကြေညာချက်",
        "gemini_voice": "Aoede",
        "gender": "Female (အမျိုးသမီး)",
        "persona": "Formal Public Address",
        "persona_mm": "ရုံးသုံးနှင့် အများပြည်သူဆိုင်ရာ တရားဝင် ထုတ်ပြန်ကြေညာအသံ",
        "tone": "Dignified, serious, clear, and commanding",
        "sample_tag": "Public Notices, Airport/Station, Compliance",
        "sample_text": "မိဘပြည်သူများခင်ဗျာ… မနက်ဖြန်တွင် ပြုလုပ်မည့် အခမ်းအနားနှင့် ပတ်သက်သည့် အသိပေးချက်အား ဖတ်ကြားပါမည်။",
        "category": "BUSINESS",
        "premium": True
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
