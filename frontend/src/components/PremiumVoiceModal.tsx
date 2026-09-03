import React from 'react';
import { X, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface PremiumVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  voiceName?: string;
  onViewPackages: () => void;
}

export const PremiumVoiceModal: React.FC<PremiumVoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  voiceName = 'Premium Voice',
  onViewPackages,
}) => {
  const t = translations[language].credits;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden text-center p-6 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs border border-amber-500/20">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold font-burmese">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{t.premiumLockedBadge}</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 font-burmese">
            {voiceName}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 font-burmese leading-relaxed">
            {t.premiumVoiceDesc}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-zinc-50 border border-amber-200/60 text-left space-y-2 text-xs font-burmese">
          <div className="font-bold text-zinc-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ဘောလုံး၊ ပညာရေး၊ ဇာတ်လမ်းပြော အသံ ၁၆ မျိုး အားလုံးရရှိမည်</span>
          </div>
          <div className="font-bold text-zinc-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>မည်သည့် ခရက်ဒစ်ပက်ကေ့ချ် ဝယ်ယူမှုမဆို ချက်ချင်း အသုံးပြုနိုင်မည်</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewPackages();
            }}
            className="w-full py-3 rounded-xl bg-myanmar-red hover:bg-myanmar-red-hover text-white text-xs sm:text-sm font-bold font-burmese transition-all shadow-md shadow-myanmar-red/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{t.viewPackages}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
