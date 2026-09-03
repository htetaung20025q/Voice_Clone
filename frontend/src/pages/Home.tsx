import React from 'react';
import { Hero } from '../components/Hero';
import { MadeForMyanmar } from '../components/MadeForMyanmar';
import { Sparkles, Mic, SlidersHorizontal, ArrowRight } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface HomeProps {
  onOpenStudio: () => void;
  onExploreVoices: () => void;
  language: Language;
}

export const Home: React.FC<HomeProps> = ({ onOpenStudio, onExploreVoices, language }) => {
  const t = translations[language];

  const features = [
    {
      icon: Sparkles,
      title: t.features.f1Title,
      description: t.features.f1Desc,
    },
    {
      icon: Mic,
      title: t.features.f2Title,
      description: t.features.f2Desc,
    },
    {
      icon: SlidersHorizontal,
      title: t.features.f3Title,
      description: t.features.f3Desc,
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero */}
      <Hero
        onStartCreating={onOpenStudio}
        onExploreVoices={onExploreVoices}
        language={language}
      />

      {/* 3-Column Core Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="border-t border-zinc-200 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-myanmar-gold mb-2">
              {t.features.title}
            </h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {language === 'my' ? 'ခေတ်မီ အသံနည်းပညာ စွမ်းဆောင်ရည်' : 'Modern AI Speech Engine'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="space-y-3">
                  <div className="w-9 h-9 rounded-md bg-myanmar-red-light flex items-center justify-center text-myanmar-red">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Made for Myanmar Cultural Section */}
      <MadeForMyanmar language={language} />

      {/* How It Works 4-Step Sequence */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="border-t border-zinc-200/80 pt-16">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-amber-500 font-serif text-xs">❖</span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-burmese">
              {language === 'my' ? 'အသုံးပြုပုံ အဆင့်ဆင့်' : 'How It Works'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-amber-300/80 transition-all space-y-2 shadow-2xs">
              <span className="text-xs font-mono font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">01</span>
              <h4 className="font-bold text-zinc-900 font-burmese">{language === 'my' ? 'စာသား ရေးသားပါ' : 'Write text'}</h4>
              <p className="text-xs text-zinc-500 font-burmese leading-[1.8]">{language === 'my' ? 'မြန်မာ သို့မဟုတ် အင်္ဂလိပ် စာသား ၅၀၀၀ လုံးအထိ ထည့်သွင်းပါ။' : 'Type or paste up to 5,000 characters of text.'}</p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-amber-300/80 transition-all space-y-2 shadow-2xs">
              <span className="text-xs font-mono font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">02</span>
              <h4 className="font-bold text-zinc-900 font-burmese">{language === 'my' ? 'အသံ ရွေးချယ်ပါ' : 'Choose voice'}</h4>
              <p className="text-xs text-zinc-500 font-burmese leading-[1.8]">{language === 'my' ? 'သီရိ၊ အောင်၊ မေ၊ မင်း အစရှိသော သဘာဝအသံများကို ရွေးပါ။' : 'Select from natural Myanmar voice personas.'}</p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-amber-300/80 transition-all space-y-2 shadow-2xs">
              <span className="text-xs font-mono font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">03</span>
              <h4 className="font-bold text-zinc-900 font-burmese">{language === 'my' ? 'အသံဖန်တီးပါ' : 'Generate'}</h4>
              <p className="text-xs text-zinc-500 font-burmese leading-[1.8]">{language === 'my' ? 'Gemini AI က တိကျသဘာဝကျသော အသံကို ချက်ချင်း ဖန်တီးပေးမည်။' : 'Gemini AI synthesizes natural Burmese speech.'}</p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/90 bg-white hover:border-amber-300/80 transition-all space-y-2 shadow-2xs">
              <span className="text-xs font-mono font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">04</span>
              <h4 className="font-bold text-zinc-900 font-burmese">{language === 'my' ? 'နားထောင် & ဒေါင်းလုဒ်' : 'Listen & Download'}</h4>
              <p className="text-xs text-zinc-500 font-burmese leading-[1.8]">{language === 'my' ? 'Player တွင် အမြန်နှုန်းညှိ၍ Lossless WAV ဖိုင် ရယူပါ။' : 'Play in browser and download lossless WAV audio.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA with Acheik background */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-zinc-200/90 bg-gradient-to-br from-white via-amber-50/20 to-red-50/20 p-8 sm:p-12 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-acheik-wave opacity-20 pointer-events-none" />
          <div className="relative space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-burmese leading-tight">
              {language === 'my' ? 'မြန်မာ အသံထွက် စတင်ဖန်တီးရန် အဆင်သင့်ဖြစ်ပြီလား' : 'Ready to create Myanmar voiceovers?'}
            </h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto font-burmese leading-[1.8]">
              {language === 'my' ? 'BurmeseATAN စတူဒီယိုတွင် စာသားများ ရိုက်ထည့်ပြီး ချက်ချင်း အသံထွက် နားဆင်လိုက်ပါ။' : 'Experience natural Burmese voice synthesis in our dedicated studio.'}
            </p>
          </div>
          <div className="relative pt-2">
            <button
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-md shadow-myanmar-red/25 hover:shadow-lg hover:shadow-myanmar-red/35 active:scale-[0.98] font-burmese focus-ring"
            >
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="w-4 h-4 text-amber-200" />
            </button>
          </div>
        </div>
      </section>

      {/* Refined Cultural Footer */}
      <footer className="border-t border-zinc-200/80 pt-10 max-w-5xl mx-auto px-4 sm:px-6 text-xs text-zinc-500 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-myanmar-red flex items-center justify-center text-white text-[10px] font-bold">
              BA
            </div>
            <span className="font-extrabold text-zinc-900">BurmeseATAN</span>
            <span className="text-amber-600 font-burmese font-bold">မြန်မာအသံ</span>
            <span>• © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-5 text-zinc-500 font-mono text-[11px]">
            <span className="hover:text-zinc-900 transition-colors">Gemini 3.1 Flash</span>
            <span>•</span>
            <span className="hover:text-zinc-900 transition-colors">FastAPI</span>
            <span>•</span>
            <span className="hover:text-zinc-900 transition-colors">Unicode NFC</span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
          <p className="font-burmese">
            {language === 'my'
              ? 'မြန်မာဘာသာစကားနှင့် ယဉ်ကျေးမှုအမွေအနှစ်ကို လေးစားတန်ဖိုးထားလျက် AI နည်းပညာဖြင့် ဖန်တီးထားပါသည်။'
              : 'Crafted with reverence for Myanmar language, literature, and cultural heritage.'}
          </p>
          <span className="font-mono text-zinc-400">v1.0.0 Studio</span>
        </div>
      </footer>

    </div>
  );
};
