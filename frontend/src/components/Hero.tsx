import React from 'react';
import { ArrowRight, Sparkles, Mic } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface HeroProps {
  onStartCreating: () => void;
  onExploreVoices: () => void;
  language: Language;
}

export const Hero: React.FC<HeroProps> = ({ onStartCreating, onExploreVoices, language }) => {
  const t = translations[language].hero;

  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 text-center px-4 sm:px-6 max-w-4xl mx-auto overflow-hidden">
      
      {/* Subtle Myanmar Geometric Acheik Wave Background Texture */}
      <div className="absolute inset-0 bg-acheik-wave pointer-events-none -z-10 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none -z-10" />

      {/* Small top badge with subtle gold border & cultural motif */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-amber-300/60 text-amber-800 text-xs font-semibold mb-6 shadow-2xs">
        <span className="text-amber-500 font-serif">❖</span>
        <span className="font-burmese tracking-wide">{t.badge}</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      </div>

      {/* Main heading with high readability Burmese typography */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.3] font-burmese">
        {t.headline}
      </h1>

      {/* Description */}
      <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-[1.8] font-burmese">
        {t.subtitle}
      </p>

      {/* Action buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onStartCreating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-md shadow-myanmar-red/25 hover:shadow-lg hover:shadow-myanmar-red/35 active:scale-[0.98] font-burmese focus-ring"
        >
          <span>{t.startCreating}</span>
          <ArrowRight className="w-4 h-4 text-amber-200" />
        </button>

        <button
          onClick={onExploreVoices}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white hover:bg-amber-50/40 text-zinc-700 border border-zinc-200 hover:border-amber-300/80 transition-all cursor-pointer shadow-2xs font-burmese focus-ring"
        >
          <Mic className="w-4 h-4 text-amber-600" />
          <span>{t.exploreVoices}</span>
        </button>
      </div>

      {/* Refined traditional Kanote-inspired divider with gold lotus-bud/diamond motif */}
      <div className="mt-16 flex items-center justify-center gap-3 opacity-70">
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-zinc-300 to-amber-300" />
        <span className="text-[10px] text-amber-600 select-none">❖</span>
        <div className="w-20 h-[1px] bg-gradient-to-l from-transparent via-zinc-300 to-amber-300" />
      </div>

    </section>
  );
};
