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

interface PerformanceAttribute {
  energy: string;
  pacing: string;
  delivery: string;
  energyBadgeColor: string;
}

const getPerformanceAttribute = (id: string): PerformanceAttribute => {
  const vid = id.toLowerCase();
  if (vid === 'football_live') {
    return { energy: '⚡ Very High', pacing: 'Fast & Dynamic', delivery: 'Live Stadium Commentary', energyBadgeColor: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  if (vid === 'football_highlights') {
    return { energy: '⚡ High', pacing: 'Medium-Fast', delivery: 'Highlights Narration', energyBadgeColor: 'bg-orange-100 text-orange-900 border-orange-300' };
  }
  if (vid === 'football_news') {
    return { energy: '⚡ Medium', pacing: 'Controlled', delivery: 'Sports News Presenter', energyBadgeColor: 'bg-blue-100 text-blue-900 border-blue-300' };
  }
  if (vid === 'edu_teacher') {
    return { energy: '⚡ Medium', pacing: 'Slow-Medium', delivery: 'Classroom Teacher', energyBadgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  }
  if (vid === 'edu_lecturer') {
    return { energy: '⚡ Medium', pacing: 'Deliberate', delivery: 'University Lecturer', energyBadgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
  }
  if (vid === 'edu_tutorial') {
    return { energy: '⚡ Medium', pacing: 'Step-by-Step', delivery: 'Tutorial Guide', energyBadgeColor: 'bg-teal-100 text-teal-900 border-teal-300' };
  }
  if (vid === 'edu_kids') {
    return { energy: '⚡ High', pacing: 'Playful', delivery: 'Kids Learning', energyBadgeColor: 'bg-pink-100 text-pink-900 border-pink-300' };
  }
  if (vid === 'ent_storyteller') {
    return { energy: '⚡ Dynamic', pacing: 'Variable', delivery: 'Storyteller Narration', energyBadgeColor: 'bg-purple-100 text-purple-900 border-purple-300' };
  }
  if (vid === 'ent_dramatic') {
    return { energy: '⚡ High', pacing: 'Intense', delivery: 'Cinematic Drama', energyBadgeColor: 'bg-rose-100 text-rose-900 border-rose-300' };
  }
  if (vid === 'ent_podcast') {
    return { energy: '⚡ Medium', pacing: 'Conversational', delivery: 'Podcast Conversation', energyBadgeColor: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  if (vid === 'ent_character') {
    return { energy: '⚡ High', pacing: 'Agile', delivery: 'Character Acting', energyBadgeColor: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300' };
  }
  if (vid === 'biz_ad') {
    return { energy: '⚡ High', pacing: 'Medium-Fast', delivery: 'Commercial Ad', energyBadgeColor: 'bg-red-100 text-red-900 border-red-300' };
  }
  if (vid === 'biz_corporate') {
    return { energy: '⚡ Medium', pacing: 'Executive', delivery: 'Corporate Presentation', energyBadgeColor: 'bg-slate-100 text-slate-900 border-slate-300' };
  }
  if (vid === 'biz_product') {
    return { energy: '⚡ Med-High', pacing: 'Modern', delivery: 'Product Showcase', energyBadgeColor: 'bg-sky-100 text-sky-900 border-sky-300' };
  }
  if (vid === 'biz_announcement') {
    return { energy: '⚡ Medium', pacing: 'Dignified', delivery: 'Public Address', energyBadgeColor: 'bg-zinc-100 text-zinc-900 border-zinc-300' };
  }
  return { energy: '⚡ Balanced', pacing: 'Natural', delivery: 'Conversational', energyBadgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
};

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

  const filteredVoices = voices.filter((v) => {
    if (activeCategory === 'ALL') return true;
    return (v.category || 'STANDARD').toUpperCase() === activeCategory;
  });

  const handleVoiceClick = (voice: VoiceInfo) => {
    if (disabled) return;
    if (voice.premium && !isAuthorized) {
      if (onSelectPremiumBlocked) {
        onSelectPremiumBlocked(voice);
      }
      return;
    }
    onSelectVoice(voice.id);
  };

  return (
    <div className="w-full space-y-4">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-left">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer font-burmese ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Voices with distinct Performance Profiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoice.toLowerCase() === v.id.toLowerCase();
          const isFemale = v.gender.toLowerCase().includes('female') || v.gender.includes('အမျိုးသမီး');
          const isLocked = v.premium && !isAuthorized;
          const perf = getPerformanceAttribute(v.id);

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
              className={`group relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none focus-ring ${
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

                  {/* Performance Description */}
                  <p className="text-[11px] text-zinc-700 font-medium line-clamp-1 mt-0.5" title={language === 'my' ? v.persona_mm : v.persona}>
                    {language === 'my' ? v.persona_mm : v.persona}
                  </p>
                </div>
              </div>

              {/* Performance Profile Badges */}
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${perf.energyBadgeColor}`}>
                  {perf.energy}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {perf.pacing}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-50 text-zinc-500 border border-zinc-200/80 truncate max-w-[110px]" title={perf.delivery}>
                  {perf.delivery}
                </span>
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
