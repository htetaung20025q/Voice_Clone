import React from 'react';
import { ArrowRight, Sparkles, Shield, HeartHandshake } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface AboutProps {
  onOpenStudio: () => void;
  language: Language;
}

export const About: React.FC<AboutProps> = ({ onOpenStudio, language }) => {
  const t = translations[language].aboutPage;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-myanmar-red-light border border-myanmar-red/20 text-myanmar-red text-xs font-semibold">
          <Sparkles className="w-3 h-3 text-myanmar-gold" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
          {t.title}
        </h1>
        <p className="text-base text-zinc-600 leading-relaxed max-w-2xl">
          {t.subtitle}
        </p>
      </div>

      {/* Mission & Linguistic Care */}
      <div className="space-y-4 border-t border-zinc-200 pt-10">
        <h2 className="text-xl font-bold text-zinc-900">
          {language === 'my' ? 'ကျွန်ုပ်တို့၏ ရည်ရွယ်ချက်' : 'Our Mission'}
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {language === 'my'
            ? 'မြန်မာဘာသာစကား၏ အသံထွက်၊ လေယူလေသိမ်းနှင့် သဒ္ဒါစည်းမျဉ်းများသည် အခြားဘာသာစကားများနှင့် မတူဘဲ ထူးခြားဆန်းကြယ်လှပါသည်။ BurmeseATAN သည် မြန်မာစာလုံးပေါင်း သတ်ပုံများနှင့် အသံထွက်များကို အမှန်ကန်ဆုံး ဖတ်ကြားပေးနိုင်ရန် ခေတ်မီ Gemini Multimodal AI နည်းပညာဖြင့် ဖန်တီးထားပါသည်။'
            : 'Burmese is a rich, tonal language with distinct phonology, complex diacritics, and nuanced syllable boundaries. BurmeseATAN bridges state-of-the-art multimodal AI voice models with precise Myanmar Unicode processing so creators and developers can produce authentic speech effortlessly.'}
        </p>
      </div>

      {/* Key Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-200 pt-10">
        <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-myanmar-red-light text-myanmar-red flex items-center justify-center mb-2">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {language === 'my' ? 'လုံခြုံစိတ်ချရသော စနစ်' : 'Secure Server-Side Mediation'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'my'
              ? 'API Key များကို Backend တွင်သာ လုံခြုံစွာ ထိန်းသိမ်းထားပြီး Browser ထံ မည်သည့်အခါမျှ ထုတ်ဖော်ပြသခြင်း မပြုပါ။'
              : 'Gemini API keys are protected on the server with strict CORS policies and input validation.'}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-myanmar-gold flex items-center justify-center mb-2">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {language === 'my' ? 'မြန်မာယူနီကုဒ် အပြည့်အဝ ထောက်ပံ့မှု' : 'Universal Myanmar Unicode'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'my'
              ? 'စံမီ မြန်မာယူနီကုဒ် စာသားများကို အလိုအလျောက် ပုံမှန်ပြုပြင်ပေးပြီး တိကျသော အသံထွက်ကို ဖန်တီးပေးသည်။'
              : 'Standard Unicode NFC normalization ensures zero broken glyphs or phoneme distortion.'}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-zinc-200 pt-10">
        <button
          onClick={onOpenStudio}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-colors cursor-pointer shadow-sm shadow-myanmar-red/20"
        >
          <span>{translations[language].nav.getStarted}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
