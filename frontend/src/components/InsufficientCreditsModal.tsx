import React from 'react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  requiredCredits: number;
  currentBalance: number;
  onBuyCredits: () => void;
}

export const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  isOpen,
  onClose,
  language,
  requiredCredits,
  currentBalance,
  onBuyCredits,
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

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs border border-amber-200/70">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-900 font-burmese">
            {t.insufficientTitle}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 font-burmese leading-relaxed">
            {language === 'my'
              ? `ဤအသံကို ဖန်တီးရန် ${requiredCredits} ခရက်ဒစ် လိုအပ်ပါသည်။ လက်ကျန်ခရက်ဒစ်မှာ ${currentBalance} ဖြစ်ပါသဖြင့် ခရက်ဒစ် ဖြည့်သွင်းပေးပါ။`
              : `You need ${requiredCredits} credit(s) to generate this audio, but your current balance is ${currentBalance}. Please top up to proceed.`}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-around text-xs font-burmese">
          <div>
            <div className="text-zinc-400 font-medium">လက်ရှိလက်ကျန်</div>
            <div className="text-base font-extrabold text-zinc-800">⚡ {currentBalance}</div>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <div className="text-zinc-400 font-medium">လိုအပ်သည့်ခရက်ဒစ်</div>
            <div className="text-base font-extrabold text-myanmar-red">⚡ {requiredCredits}</div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onBuyCredits();
            }}
            className="w-full py-3 rounded-xl bg-myanmar-red hover:bg-myanmar-red-hover text-white text-xs sm:text-sm font-bold font-burmese transition-all shadow-md shadow-myanmar-red/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{t.buyCredits}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
