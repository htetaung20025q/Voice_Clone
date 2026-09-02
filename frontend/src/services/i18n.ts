/**
 * Internationalization (i18n) service for BurmaVoice.
 * Supports Burmese Unicode (မြန်မာ) and English.
 */

export type Language = 'my' | 'en';

export interface TranslationDictionary {
  nav: {
    home: string;
    studio: string;
    voices: string;
    about: string;
    docs: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    headline: string;
    subtitle: string;
    startCreating: string;
    exploreVoices: string;
  };
  studio: {
    title: string;
    subtitle: string;
    textLabel: string;
    placeholder: string;
    clearText: string;
    charCount: string;
    estimatedDuration: string;
    presetsLabel: string;
    voiceLabel: string;
    styleLabel: string;
    languageLabel: string;
    speedLabel: string;
    pitchLabel: string;
    generateBtn: string;
    generatingBtn: string;
    generatedSuccess: string;
    readyTitle: string;
    readyDesc: string;
    downloadBtn: string;
    generateAgainBtn: string;
    errorNotice: string;
  };
  features: {
    title: string;
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
  };
  madeForMyanmar: {
    badge: string;
    title: string;
    subtitle: string;
    creatorsTitle: string;
    creatorsDesc: string;
    studentsTitle: string;
    studentsDesc: string;
    businessTitle: string;
    businessDesc: string;
    developersTitle: string;
    developersDesc: string;
  };
  voicesPage: {
    badge: string;
    title: string;
    subtitle: string;
    preview: string;
    playing: string;
    useInStudio: string;
  };
  aboutPage: {
    badge: string;
    title: string;
    subtitle: string;
    archTitle: string;
    archDesc: string;
  };
  docsPage: {
    badge: string;
    title: string;
    subtitle: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  my: {
    nav: {
      home: 'ပင်မစာမျက်နှာ',
      studio: 'စတူဒီယို',
      voices: 'အသံများ',
      about: 'အကြောင်းအရာ',
      docs: 'စာရွက်စာတမ်း',
      getStarted: 'စတင်အသုံးပြုရန်',
    },
    hero: {
      badge: 'မြန်မာ AI အသံ စတူဒီယို',
      headline: 'စာသားများကို သဘာဝကျသော မြန်မာအသံအဖြစ်သို့ ပြောင်းလဲပါ',
      subtitle: 'မြန်မာဘာသာစကားနှင့် အကြောင်းအရာဖန်တီးသူများအတွက် အထူးပြုလုပ်ထားသော ခေတ်မီ AI အသံထွက် နည်းပညာ။',
      startCreating: 'စတင်ဖန်တီးရန်',
      exploreVoices: 'အသံများလေ့လာရန်',
    },
    studio: {
      title: 'အသံဖန်တီးမှု စတူဒီယို',
      subtitle: 'စာသားများကို သဘာဝကျသော မြန်မာ AI အသံအဖြစ်သို့ ပြောင်းလဲပါ',
      textLabel: 'စာသား ထည့်သွင်းရန်',
      placeholder: 'အသံထွက်စေလိုသော မြန်မာ သို့မဟုတ် အင်္ဂလိပ် စာသားများကို ရေးသားပါ...',
      clearText: 'စာသားအားလုံးဖျက်ရန်',
      charCount: 'အက္ခရာ အရေအတွက်',
      estimatedDuration: 'ခန့်မှန်းကြာချိန်',
      presetsLabel: 'နမူနာ စာသားများ',
      voiceLabel: 'မြန်မာ အသံရွေးချယ်ရန်',
      styleLabel: 'အသံထွက် ပုံစံ',
      languageLabel: 'ဘာသာစကား',
      speedLabel: 'အသံ အမြန်နှုန်း',
      pitchLabel: 'အသံ အနိမ့်အမြင့်',
      generateBtn: 'အသံဖန်တီးမည်',
      generatingBtn: 'အသံ ဖန်တီးနေပါသည်...',
      generatedSuccess: 'အသံ ဖန်တီးပြီးပါပြီ',
      readyTitle: 'အသံဖန်တီးမှု ပြီးစီးပါပြီ',
      readyDesc: 'ဖန်တီးထားသော အသံကို ဖွင့်ကြည့်ပြီး ဒေါင်းလုဒ် ရယူနိုင်ပါသည်။',
      downloadBtn: 'အသံဖိုင် ဒေါင်းလုဒ်ယူရန်',
      generateAgainBtn: 'အသစ်ပြန်လည် ဖန်တီးရန်',
      errorNotice: 'အသံဖန်တီးရာတွင် အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့ပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားကြည့်ပါ။',
    },
    features: {
      title: 'အဓိက အင်္ဂါရပ်များ',
      f1Title: 'သဘာဝကျသော အသံထွက်',
      f1Desc: 'မြန်မာအသံထွက် အဖြတ်အတောက်နှင့် လေယူလေသိမ်း တိကျမှန်ကန်စွာ ထွက်ရှိစေခြင်း။',
      f2Title: 'စုံလင်သော အသံရွေးချယ်စရာများ',
      f2Desc: 'သီရိ၊ အောင်၊ မေ၊ မင်း၊ နန္ဒာ၊ ကျော်သူ စသည့် အရည်အသွေးမြင့် အသံစုံတွဲများ။',
      f3Title: 'လွယ်ကူရှင်းလင်းသော ထိန်းချုပ်မှုများ',
      f3Desc: 'အသံပုံစံ၊ အမြန်နှုန်း၊ အနိမ့်အမြင့်တို့ကို စက္ကန့်ပိုင်းအတွင်း စိတ်ကြိုက်ညှိနိုင်ခြင်း။',
    },
    madeForMyanmar: {
      badge: 'မြန်မာပြည်အတွက် ဖန်တီးထားသည်',
      title: 'မြန်မာဖန်တီးသူများအတွက် အထူးသင့်လျော်သည်',
      subtitle: 'ဗီဒီယိုဖန်တီးသူများ၊ ကျောင်းသားများ၊ စီးပွားရေးလုပ်ငန်းများနှင့် ပညာရေးအတွက် အထောက်အကူပြုသည်။',
      creatorsTitle: 'ဗီဒီယိုနှင့် ဆိုရှယ်မီဒီယာ ဖန်တီးသူများ',
      creatorsDesc: 'YouTube, TikTok, Facebook ဗီဒီယိုများအတွက် အရည်အသွေးမြင့် Voiceover များ ပြုလုပ်ရန်။',
      studentsTitle: 'ကျောင်းသားနှင့် ပညာရေးဝန်ထမ်းများ',
      studentsDesc: 'စာအုပ်စာစောင်များနှင့် သင်ခန်းစာများကို အသံဖြင့် နားဆင်လေ့လာရန်။',
      businessTitle: 'စီးပွားရေးနှင့် ကြော်ငြာလုပ်ငန်းများ',
      businessDesc: 'ကုန်ပစ္စည်းမိတ်ဆက်၊ အသိပေးချက်များနှင့် Customer Service အသံများအတွက်။',
      developersTitle: 'ဆော့ဖ်ဝဲလ် ရေးသားသူများ',
      developersDesc: 'API ဖြင့် Application များအတွင်း မြန်မာ AI အသံထွက်ကို လွယ်ကူစွာ ချိတ်ဆက်ရန်။',
    },
    voicesPage: {
      badge: 'အသံ စုစည်းမှု',
      title: 'မြန်မာ AI အသံများ',
      subtitle: 'သင့်လုပ်ငန်းနှင့် အကိုက်ညီဆုံးဖြစ်မည့် အသံများကို နားထောင်ရွေးချယ်ပါ။',
      preview: 'နားဆင်ရန်',
      playing: 'ဖွင့်နေသည်...',
      useInStudio: 'စတူဒီယိုတွင် သုံးမည်',
    },
    aboutPage: {
      badge: 'အကြောင်းအရာ',
      title: 'မြန်မာဘာသာစကားအတွက် အထူးပြုလုပ်ထားသည်',
      subtitle: 'မြန်မာစာပေနှင့် အသံထွက်နည်းပညာကို ခေတ်မီ AI နည်းပညာဖြင့် ပေါင်းစပ်တီထွင်ထားပါသည်။',
      archTitle: 'လုံခြုံစိတ်ချရသော စနစ်တည်ဆောက်ပုံ',
      archDesc: 'FastAPI Backend နှင့် Gemini Multimodal TTS API ကို အသုံးပြုထားပြီး မြန်ဆန်ထိရောက်မှုရှိသည်။',
    },
    docsPage: {
      badge: 'ဆော့ဖ်ဝဲလ်ချိတ်ဆက်ရန်',
      title: 'BurmaVoice API စာရွက်စာတမ်း',
      subtitle: 'REST API ဖြင့် သင်၏ Application များအတွင်း အသံထွက်စနစ် ချိတ်ဆက်နိုင်ပါသည်။',
    }
  },
  en: {
    nav: {
      home: 'Home',
      studio: 'Studio',
      voices: 'Voices',
      about: 'About',
      docs: 'Docs',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'Myanmar AI Voice Studio',
      headline: 'Turn Your Text Into a Natural Myanmar Voice',
      subtitle: 'Create natural-sounding speech using AI, designed for Myanmar language and creators.',
      startCreating: 'Start Creating',
      exploreVoices: 'Explore Voices',
    },
    studio: {
      title: 'Create Voice',
      subtitle: 'Transform your text into natural-sounding Myanmar AI voice narration.',
      textLabel: 'Text',
      placeholder: 'Type or paste your text here...',
      clearText: 'Clear text',
      charCount: 'Characters',
      estimatedDuration: 'Est. Duration',
      presetsLabel: 'Sample Presets',
      voiceLabel: 'Myanmar Voices',
      styleLabel: 'Speaking Style',
      languageLabel: 'Language',
      speedLabel: 'Voice Speed',
      pitchLabel: 'Voice Pitch',
      generateBtn: 'Generate Voice',
      generatingBtn: 'Generating voice...',
      generatedSuccess: 'Voice Generated',
      readyTitle: 'Your voice is ready',
      readyDesc: 'Listen to your generated speech or download the audio file directly.',
      downloadBtn: 'Download Audio',
      generateAgainBtn: 'Generate Again',
      errorNotice: "We couldn't generate the voice. Please try again.",
    },
    features: {
      title: 'Core Capabilities',
      f1Title: 'Natural Voices',
      f1Desc: 'Generate authentic Myanmar speech with accurate tone marks and intonation.',
      f2Title: 'Multiple Voices',
      f2Desc: 'Choose from distinct voices including Thiri, Aung, May, Min, Nandar, and Kyaw Thu.',
      f3Title: 'Simple Controls',
      f3Desc: 'Tune style, pacing, and pitch with straightforward controls in seconds.',
    },
    madeForMyanmar: {
      badge: 'Made for Myanmar',
      title: 'Built for Myanmar Creators & Businesses',
      subtitle: 'Engineered specifically for Burmese phonetics, syntax, and multimedia creators.',
      creatorsTitle: 'Content Creators & YouTubers',
      creatorsDesc: 'Produce broadcast-quality voiceovers for YouTube, TikTok, and social reels.',
      studentsTitle: 'Students & Educators',
      studentsDesc: 'Convert textbook passages, articles, and study guides into listenable audio.',
      businessTitle: 'Businesses & Marketing',
      businessDesc: 'Craft polished product explainers, customer onboarding, and commercial spots.',
      developersTitle: 'Developers & SaaS Builders',
      developersDesc: 'Integrate natural Myanmar voice synthesis directly into your apps via REST API.',
    },
    voicesPage: {
      badge: 'Voice Library',
      title: 'Myanmar AI Voices',
      subtitle: 'Browse and audition natural voice personas crafted for diverse Burmese use cases.',
      preview: 'Preview',
      playing: 'Playing...',
      useInStudio: 'Use in Studio',
    },
    aboutPage: {
      badge: 'About Us',
      title: 'Built for the Myanmar Language',
      subtitle: 'Bridging modern artificial intelligence with rich Burmese linguistics and cultural heritage.',
      archTitle: 'Secure, Decoupled Architecture',
      archDesc: 'Powered by FastAPI and Google Gemini TTS with zero client-side API key exposure.',
    },
    docsPage: {
      badge: 'Developer API',
      title: 'BurmaVoice API Documentation',
      subtitle: 'Integrate high-fidelity Myanmar TTS synthesis into your software with simple REST endpoints.',
    }
  }
};
