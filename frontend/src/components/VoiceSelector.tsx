import React from 'react';
import { Volume2, Check } from 'lucide-react';
import type { VoiceInfo } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface VoiceSelectorProps {
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice?: (voice: VoiceInfo) => void;
  disabled?: boolean;
  language: Language;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onPreviewVoice,
  disabled = false,
  language,
}) => {
  const t = translations[language].studio;

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
          {t.voiceLabel}
        </label>
        <span className="text-[11px] font-medium text-zinc-400">
          {voices.length} {language === 'my' ? 'ဦး ရွေးချယ်နိုင်သည်' : 'voices available'}
        </span>
      </div>

      <div 
        role="radiogroup" 
        aria-label={t.voiceLabel}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {voices.map((v) => {
          const isSelected = v.id.toLowerCase() === selectedVoice.toLowerCase();
          const isFemale = v.gender.toLowerCase().includes('female');

          return (
            <div
              key={v.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && onSelectVoice(v.id)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  onSelectVoice(v.id);
                }
              }}
              className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer select-none focus-ring ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? 'border-myanmar-red bg-gradient-to-br from-myanmar-red-light/90 to-amber-50/40 shadow-2xs ring-1 ring-amber-400/50'
                  : 'border-zinc-200/90 bg-white hover:border-amber-300/60 hover:bg-zinc-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-burmese font-bold text-sm text-zinc-900 leading-tight">
                      {v.myanmar_name}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400 font-mono">
                      {v.name}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-500 truncate mt-0.5" title={language === 'my' ? v.persona_mm : v.persona}>
                    {language === 'my' ? v.persona_mm : v.persona}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected ? (
                  <div className="w-4 h-4 rounded-full bg-myanmar-red text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : onPreviewVoice ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(v);
                    }}
                    title={language === 'my' ? 'နမူနာ နားဆင်ရန်' : 'Audition voice'}
                    className="w-5 h-5 rounded-full text-zinc-400 hover:text-myanmar-red hover:bg-white flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                ) : null}
              </div>

              {/* Subtle bottom gender indicator tag */}
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-zinc-100/80">
                <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                  isFemale ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {isFemale ? (language === 'my' ? 'အမျိုးသမီး' : 'Female') : (language === 'my' ? 'အမျိုးသား' : 'Male')}
                </span>

                {onPreviewVoice && isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(v);
                    }}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-myanmar-red hover:text-myanmar-red-hover cursor-pointer"
                  >
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>{language === 'my' ? 'နားဆင်ရန်' : 'Preview'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
