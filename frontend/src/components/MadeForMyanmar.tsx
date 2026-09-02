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
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-8 sm:p-12 relative overflow-hidden">
        
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-acheik-lines opacity-50 pointer-events-none" />

        {/* Section Header */}
        <div className="relative text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-myanmar-gold/30 text-myanmar-gold text-xs font-semibold shadow-xs">
            <Sparkles className="w-3 h-3 text-myanmar-gold" />
            <span>{t.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            {t.title}
          </h2>
          <p className="text-sm text-zinc-600">
            {t.subtitle}
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white border border-zinc-200 space-y-2 hover:border-zinc-300 transition-colors shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-myanmar-red-light flex items-center justify-center text-myanmar-red mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
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
