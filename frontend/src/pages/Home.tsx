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
        <div className="border-t border-zinc-200 pt-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-8">
            {language === 'my' ? 'အသုံးပြုပုံ အဆင့်ဆင့်' : 'How It Works'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-1.5 shadow-xs">
              <span className="text-xs font-mono font-bold text-myanmar-gold">01</span>
              <h4 className="font-semibold text-zinc-900">{language === 'my' ? 'စာသား ရေးသားပါ' : 'Write text'}</h4>
              <p className="text-xs text-zinc-500">{language === 'my' ? 'မြန်မာ သို့မဟုတ် အင်္ဂလိပ် စာသား ၅၀၀၀ လုံးအထိ ထည့်သွင်းပါ။' : 'Type or paste up to 5,000 characters of text.'}</p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-1.5 shadow-xs">
              <span className="text-xs font-mono font-bold text-myanmar-gold">02</span>
              <h4 className="font-semibold text-zinc-900">{language === 'my' ? 'အသံ ရွေးချယ်ပါ' : 'Choose voice'}</h4>
              <p className="text-xs text-zinc-500">{language === 'my' ? 'သီရိ၊ အောင်၊ မေ၊ မင်း အစရှိသော အသံများကို ရွေးပါ။' : 'Select from natural Myanmar voice personas.'}</p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-1.5 shadow-xs">
              <span className="text-xs font-mono font-bold text-myanmar-gold">03</span>
              <h4 className="font-semibold text-zinc-900">{language === 'my' ? 'အသံဖန်တီးပါ' : 'Generate'}</h4>
              <p className="text-xs text-zinc-500">{language === 'my' ? 'Gemini AI က တိကျသဘာဝကျသော အသံကို ဖန်တီးပေးမည်။' : 'Gemini AI synthesizes natural Burmese speech.'}</p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-1.5 shadow-xs">
              <span className="text-xs font-mono font-bold text-myanmar-gold">04</span>
              <h4 className="font-semibold text-zinc-900">{language === 'my' ? 'နားထောင် & ဒေါင်းလုဒ်' : 'Listen & Download'}</h4>
              <p className="text-xs text-zinc-500">{language === 'my' ? 'ဘရောက်ဆာတွင် ဖွင့်ကြည့်ပြီး WAV ဖိုင် ရယူပါ။' : 'Play in browser and download lossless WAV audio.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-8 sm:p-12 text-center space-y-4">
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {language === 'my' ? 'မြန်မာ အသံထွက် စတင်ဖန်တီးရန် အဆင်သင့်ဖြစ်ပြီလား' : 'Ready to create Myanmar voiceovers?'}
          </h3>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            {language === 'my' ? 'စတူဒီယိုတွင် စာသားများ ရိုက်ထည့်ပြီး ချက်ချင်း အသံထွက် နားဆင်လိုက်ပါ။' : 'Experience natural Burmese voice synthesis in our dedicated studio.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-colors cursor-pointer shadow-sm shadow-myanmar-red/20"
            >
              <span>{t.nav.getStarted}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 pt-8 max-w-5xl mx-auto px-4 sm:px-6 text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-900">BurmaVoice</span>
          <span className="text-myanmar-gold font-burmese">မြန်မာအသံ</span>
          <span>• © {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Gemini TTS</span>
          <span>FastAPI</span>
          <span>Myanmar Unicode NFC</span>
        </div>
      </footer>

    </div>
  );
};
