import React from 'react';
import { Video, GraduationCap, Briefcase, Code2, Sparkles } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface MadeForMyanmarProps {
  language: Language;
}

export const MadeForMyanmar: React.FC<MadeForMyanmarProps> = ({ language }) => {
  const t = translations[language].madeForMyanmar;

  const items = [
    {
      icon: Video,
      title: t.creatorsTitle,
      description: t.creatorsDesc,
    },
    {
      icon: GraduationCap,
      title: t.studentsTitle,
      description: t.studentsDesc,
    },
    {
      icon: Briefcase,
      title: t.businessTitle,
      description: t.businessDesc,
    },
    {
      icon: Code2,
      title: t.developersTitle,
      description: t.developersDesc,
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-amber-50/25 via-white to-zinc-50/40 p-8 sm:p-12 relative overflow-hidden shadow-xs">
        
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-acheik-wave opacity-25 pointer-events-none" />

        {/* Section Header */}
        <div className="relative text-center max-w-2xl mx-auto mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-300/60 text-amber-800 text-xs font-semibold shadow-2xs">
            <span className="text-amber-500 font-serif">❖</span>
            <span className="font-burmese">{t.badge}</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 font-burmese leading-tight">
            {t.title}
          </h2>
          <p className="text-sm text-zinc-600 font-burmese leading-[1.8]">
            {t.subtitle}
          </p>
        </div>

        {/* 4 Cards Grid with subtle lacquer/gold accents */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-zinc-200/90 hover:border-amber-400/50 hover:shadow-xs transition-all space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-xl bg-myanmar-red-light/80 border border-myanmar-red/10 flex items-center justify-center text-myanmar-red group-hover:scale-105 transition-transform mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 font-burmese">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-[1.8] font-burmese">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
