import React from 'react';
import { Loader2, Sparkles, Check } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

export type GenerationState = 'idle' | 'loading' | 'success' | 'error';

interface GenerateButtonProps {
  state: GenerationState;
  onClick: () => void;
  disabled?: boolean;
  language: Language;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  state,
  onClick,
  disabled = false,
  language,
}) => {
  const t = translations[language].studio;
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold text-base transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${
        isLoading
          ? 'bg-myanmar-red text-white shadow-sm shadow-myanmar-red/20 cursor-wait'
          : isSuccess
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 scale-[0.99]'
          : 'bg-myanmar-red hover:bg-myanmar-red-hover text-white shadow-md shadow-myanmar-red/25 hover:shadow-lg hover:shadow-myanmar-red/35 active:scale-[0.99]'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
          <span className="font-burmese">{t.generatingBtn}</span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-5 h-5 text-white shrink-0" />
          <span className="font-burmese">{t.generatedSuccess}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="font-burmese">{t.generateBtn}</span>
        </>
      )}
    </button>
  );
};
