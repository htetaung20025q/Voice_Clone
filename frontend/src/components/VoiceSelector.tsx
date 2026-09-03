import React, { useState } from 'react';
import { Volume2, Check, Lock } from 'lucide-react';
import type { VoiceInfo } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';
import { AuthService } from '../services/auth';

interface VoiceSelectorProps {
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice?: (voice: VoiceInfo) => void;
  onSelectPremiumBlocked?: (voice: VoiceInfo) => void;
  disabled?: boolean;
  language: Language;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  onPreviewVoice,
  onSelectPremiumBlocked,
  disabled = false,
  language,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const tStudio = translations[language].studio;
  const tCredits = translations[language].credits;
  const user = AuthService.getUser();
  const isAuthorized = !!user?.is_admin || !!user?.is_premium;

  const categories = [
    { id: 'ALL', label: language === 'my' ? 'အားလုံး' : 'All Voices' },
    { id: 'STANDARD', label: tCredits.categoryStandard },
    { id: 'FOOTBALL', label: tCredits.categoryFootball },
    { id: 'EDUCATION', label: tCredits.categoryEducation },
    { id: 'ENTERTAINMENT', label: tCredits.categoryEntertainment },
    { id: 'BUSINESS', label: tCredits.categoryBusiness },
  ];

  const filteredVoices = activeCategory === 'ALL'
    ? voices
    : voices.filter((v) => (v.category || 'STANDARD').toUpperCase() === activeCategory);

  const handleVoiceClick = (v: VoiceInfo) => {
    if (disabled) return;
    if (v.premium && !isAuthorized) {
      if (onSelectPremiumBlocked) {
        onSelectPremiumBlocked(v);
        return;
      }
    }
    onSelectVoice(v.id);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
          {tStudio.voiceLabel}
        </label>
        <span className="text-[11px] font-medium text-zinc-400 font-burmese">
          {filteredVoices.length} {language === 'my' ? 'ဦး ရွေးချယ်နိုင်သည်' : 'voices available'}
        </span>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-burmese ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Voices Grid */}
      <div 
        role="radiogroup" 
        aria-label={tStudio.voiceLabel}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1"
      >
        {filteredVoices.map((v) => {
          const isSelected = v.id.toLowerCase() === selectedVoice.toLowerCase();
          const isFemale = v.gender.toLowerCase().includes('female');
          const isLocked = !!v.premium && !isAuthorized;

          return (
            <div
              key={v.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleVoiceClick(v)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  handleVoiceClick(v);
                }
              }}
              className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer select-none focus-ring ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? 'border-myanmar-red bg-gradient-to-br from-myanmar-red-light/90 to-amber-50/40 shadow-2xs ring-1 ring-amber-400/50'
                  : isLocked
                  ? 'border-amber-200/70 bg-gradient-to-br from-amber-50/20 via-white to-zinc-50/30 hover:border-amber-300'
                  : 'border-zinc-200/90 bg-white hover:border-amber-300/60 hover:bg-zinc-50/70'
              }`}
            >
              {/* Premium Badge */}
              {v.premium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100/90 text-amber-800 text-[10px] font-bold font-burmese border border-amber-200 shadow-2xs">
                  {isLocked && <Lock className="w-2.5 h-2.5 text-amber-700" />}
                  <span>{tCredits.premiumLockedBadge}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-1 pr-14">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
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
              </div>

              {/* Bottom tag & action */}
              <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {isFemale ? 'Female' : 'Male'}
                </span>

                <div className="flex items-center gap-1">
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
                      className="w-5 h-5 rounded-full text-zinc-400 hover:text-myanmar-red hover:bg-zinc-100 flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
