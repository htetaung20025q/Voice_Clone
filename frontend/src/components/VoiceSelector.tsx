import React from 'react';
import { Volume2 } from 'lucide-react';
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
  const currentVoice = voices.find((v) => v.id.toLowerCase() === selectedVoice.toLowerCase()) || voices[0];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="voice-select" className="block text-sm font-semibold text-zinc-900">
          {t.voiceLabel}
        </label>
        {onPreviewVoice && currentVoice && (
          <button
            type="button"
            onClick={() => onPreviewVoice(currentVoice)}
            className="inline-flex items-center gap-1 text-xs font-medium text-myanmar-red hover:text-myanmar-red-hover transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{language === 'my' ? 'နမူနာနားဆင်ရန်' : 'Preview'}</span>
          </button>
        )}
      </div>

      <div className="relative">
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => onSelectVoice(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-myanmar-red focus:ring-1 focus:ring-myanmar-red transition-all cursor-pointer disabled:opacity-60 disabled:bg-zinc-50"
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.myanmar_name} ({v.name}) — {language === 'my' ? v.persona_mm : v.persona}
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
