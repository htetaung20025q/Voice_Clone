import os
from typing import Dict, Any

# Application Settings
APP_TITLE = "BurmeseATAN - Myanmar AI Text-to-Speech"
APP_VERSION = "1.0.0"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# TTS Engine Configuration
MODEL_ID = os.getenv("TTS_MODEL_ID", "facebook/mms-tts-mya")
SAMPLE_RATE = 16000  # MMS-TTS VITS default output sample rate
MAX_TEXT_LENGTH = 2500  # Character limit for single synthesis request
CACHE_DIR = os.getenv("CACHE_DIR", os.path.join(os.path.dirname(__file__), ".cache"))

# Pre-defined Burmese Voice Profiles
VOICE_PROFILES: Dict[str, Dict[str, Any]] = {
    "thiri": {
        "id": "thiri",
        "name": "သီရိ (Thiri)",
        "gender": "Female",
        "category": "Natural",
        "tag": "Standard / ပုံမှန်",
        "description": "သဘာဝကျပြီး ကြည်လင်ပြတ်သားသော မြန်မာအမျိုးသမီးအသံ",
        "avatar": "👩",
        "pitch_shift": 1.06,
        "speed_factor": 1.0,
        "warmth": 1.05,
        "is_default": True
    },
    "kyaw_thu": {
        "id": "kyaw_thu",
        "name": "ကျော်သူ (Kyaw Thu)",
        "gender": "Male",
        "category": "Storyteller",
        "tag": "Storyteller / ဇာတ်ကြောင်းပြော",
        "description": "နက်နဲခန့်ညားသော ပုံပြင်နှင့် ဇာတ်ကြောင်းပြော အမျိုးသားအသံ",
        "avatar": "👨",
        "pitch_shift": 0.86,
        "speed_factor": 0.94,
        "warmth": 1.25,
        "is_default": False
    },
    "may_hnin": {
        "id": "may_hnin",
        "name": "မေနှင်း (May Hnin)",
        "gender": "Female",
        "category": "News Anchor",
        "tag": "News Anchor / သတင်းကြေညာ",
        "description": "လေးနက်တည်ကြည်ပြီး သတင်းနှင့် တရားဝင်အကြောင်းအရာများအတွက် သင့်လျော်သောအသံ",
        "avatar": "🎙️",
        "pitch_shift": 1.0,
        "speed_factor": 1.05,
        "warmth": 1.0,
        "is_default": False
    },
    "min_khant": {
        "id": "min_khant",
        "name": "မင်းခန့် (Min Khant)",
        "gender": "Male",
        "category": "Conversational",
        "tag": "Conversational / စကားပြော",
        "description": "ဖော်ရွေသွက်လက်သော နေ့စဉ်လူနေမှုနှင့် podcast စကားပြောအသံ",
        "avatar": "🎧",
        "pitch_shift": 0.93,
        "speed_factor": 1.08,
        "warmth": 1.15,
        "is_default": False
    }
}

# Preset Sample Prompts for UI
SAMPLE_PROMPTS = [
    {
        "title": "နှုတ်ခွန်းဆက် (Greeting)",
        "text": "မင်္ဂလာပါရှင်။ BurmeseATAN မြန်မာ AI အသံဖန်တီးမှုမှ ကြိုဆိုပါတယ်။ လူကြီးမင်းတို့ လိုအပ်သော စာသားများကို သဘာဝကျသော အသံများအဖြစ် ပြောင်းလဲပေးနိုင်ပါသည်။"
    },
    {
        "title": "သတင်းခေါင်းစဉ် (News)",
        "text": "ယနေ့အတွက် အဓိက သတင်းများ။ နည်းပညာတိုးတက်မှုများနှင့်အတူ မြန်မာနိုင်ငံတွင် ဉာဏ်ရည်တု AI စနစ်များ ကျယ်ပြန့်စွာ အသုံးပြုလာပြီ ဖြစ်ပါသည်။"
    },
    {
        "title": "ပုံပြင်ပြော (Storytelling)",
        "text": "ဟိုးရှေးရှေးတုန်းက သာယာလှပတဲ့ တောအုပ်ကြီးတစ်ခုထဲမှာ ဉာဏ်ပညာကြီးမားတဲ့ ပညာရှိကြီးတစ်ဦး နေထိုင်ခဲ့ပါတယ်။ သူဟာ ရွာသူရွာသားတွေကို အမြဲတမ်း ကူညီပေးလေ့ရှိပါတယ်။"
    },
    {
        "title": "စကားလက်ဆုံ (Casual)",
        "text": "နေကောင်းကြရဲ့လားခင်ဗျာ။ ဒီနေ့ ရာသီဥတုလေးက တော်တော်လေး သာယာပြီး အေးချမ်းလှပါတယ်။ စာဖတ်ရင်း ကော်ဖီတစ်ခွက်လောက် သောက်လိုက်ရရင် အတော်ကောင်းမှာပဲနော်။"
    }
]
