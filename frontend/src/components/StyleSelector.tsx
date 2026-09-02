import React from 'react';
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
    <div className="w-full space-y-2">
      <label htmlFor="style-select" className="block text-sm font-semibold text-zinc-900">
        {t.styleLabel}
      </label>
      <div className="relative">
        <select
          id="style-select"
          value={selectedStyle}
          onChange={(e) => onSelectStyle(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-myanmar-red focus:ring-1 focus:ring-myanmar-red transition-all cursor-pointer disabled:opacity-60 disabled:bg-zinc-50"
        >
          {styles.map((s) => (
            <option key={s.id} value={s.id}>
              {language === 'my' ? s.myanmar_name : s.name} ({s.description})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
