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
      className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
        isLoading
          ? 'bg-myanmar-red-hover text-white'
          : isSuccess
          ? 'bg-emerald-600 text-white'
          : 'bg-myanmar-red hover:bg-myanmar-red-hover text-white shadow-myanmar-red/20 active:scale-[0.99]'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>{t.generatingBtn}</span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="w-4 h-4 text-white" />
          <span>{t.generatedSuccess}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-myanmar-gold-light" />
          <span>{t.generateBtn}</span>
        </>
      )}
    </button>
  );
};
