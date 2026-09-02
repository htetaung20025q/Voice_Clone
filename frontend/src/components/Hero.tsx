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
      
      {/* Subtle Myanmar Geometric Acheik Line Accent Background */}
      <div className="absolute inset-0 bg-myanmar-pattern pointer-events-none -z-10 opacity-70" />

      {/* Small top badge with subtle gold border */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-myanmar-gold/30 text-myanmar-gold text-xs font-semibold mb-6 shadow-sm">
        <Sparkles className="w-3 h-3 text-myanmar-gold" />
        <span>{t.badge}</span>
      </div>

      {/* Main heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.2] font-sans">
        {t.headline}
      </h1>

      {/* Description */}
      <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed font-normal">
        {t.subtitle}
      </p>

      {/* Action buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <button
          onClick={onStartCreating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-colors cursor-pointer shadow-sm shadow-myanmar-red/25"
        >
          <span>{t.startCreating}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onExploreVoices}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
        >
          <Mic className="w-4 h-4 text-zinc-500" />
          <span>{t.exploreVoices}</span>
        </button>
      </div>

      {/* Subtle traditional divider line with gold center dot */}
      <div className="mt-16 flex items-center justify-center gap-3 opacity-60">
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-zinc-300" />
        <div className="w-1.5 h-1.5 rounded-full bg-myanmar-gold" />
        <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-zinc-300" />
      </div>

    </section>
  );
};
