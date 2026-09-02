import React from 'react';
import { Check } from 'lucide-react';
import type { StyleInfo } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface StyleSelectorProps {
  styles: StyleInfo[];
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  disabled?: boolean;
  language: Language;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  styles,
  selectedStyle,
  onSelectStyle,
  disabled = false,
  language,
}) => {
  const t = translations[language].studio;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
          {t.styleLabel}
        </label>
        <span className="text-[11px] font-medium text-zinc-400">
          {styles.length} {language === 'my' ? 'မျိုး ရွေးချယ်နိုင်သည်' : 'styles'}
        </span>
      </div>

      <div 
        role="radiogroup" 
        aria-label={t.styleLabel}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {styles.map((s) => {
          const isSelected = s.id.toLowerCase() === selectedStyle.toLowerCase();

          return (
            <div
              key={s.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && onSelectStyle(s.id)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  onSelectStyle(s.id);
                }
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none focus-ring ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? 'border-myanmar-red bg-gradient-to-br from-myanmar-red-light/90 to-amber-50/40 shadow-2xs ring-1 ring-amber-400/50'
                  : 'border-zinc-200/90 bg-white hover:border-amber-300/60 hover:bg-zinc-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-burmese font-bold text-xs text-zinc-900 leading-tight">
                  {language === 'my' ? s.myanmar_name : s.name}
                </span>

                {isSelected && (
                  <div className="w-3.5 h-3.5 rounded-full bg-myanmar-red text-white flex items-center justify-center shrink-0">
                    <Check className="w-2 h-2 stroke-[3]" />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                {s.name}
              </span>

              <p className="text-[10px] text-zinc-500 truncate mt-1 pt-1 border-t border-zinc-100/80" title={s.description}>
                {s.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
