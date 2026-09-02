import React from 'react';
import { Clock } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface TextEditorProps {
  text: string;
  onChange: (text: string) => void;
  onGenerate?: () => void;
  disabled?: boolean;
  language: Language;
}

const SAMPLE_PRESETS_MY = [
  { label: '✨ နှုတ်ခွန်းဆက်', text: 'မင်္ဂလာပါရှင်။ BurmaVoice မြန်မာ AI အသံဖန်တီးမှု စတူဒီယိုမှ နွေးထွေးစွာ ကြိုဆိုပါတယ်။' },
  { label: '📰 သတင်းတို', text: 'ဒီကနေ့ နံနက်ပိုင်း သတင်းများအရ နည်းပညာကဏ္ဍတွင် ဉာဏ်ရည်တု အသံစနစ်များ ပိုမိုဖွံ့ဖြိုးတိုးတက်လာကြောင်း သိရှိရပါသည်။' },
  { label: '📖 ဇာတ်လမ်း', text: 'ရှေးရှေးတုန်းက သာယာလှပတဲ့ မြို့ကလေးတစ်မြို့မှာ အလွန်ကြင်နာတတ်တဲ့ ပညာရှိတစ်ဦး နေထိုင်ခဲ့ပါတယ်။' },
  { label: '🎙️ ပေါ့ဒ်ကတ်စ်', text: 'အားလုံးပဲ မင်္ဂလာပါ ခင်ဗျာ။ ဒီနေ့ အစီအစဉ်မှာတော့ AI ခေတ်သစ်ရဲ့ အသံနည်းပညာအကြောင်း ဆွေးနွေးသွားပါမယ်။' },
];

const SAMPLE_PRESETS_EN = [
  { label: '✨ Greeting', text: 'Hello and welcome to BurmaVoice. Transform your text into natural-sounding speech in seconds.' },
  { label: '📰 News Update', text: 'Good morning. Here is your daily update on technology breakthroughs and AI voice synthesis innovations.' },
  { label: '📖 Storytelling', text: 'Once upon a time in a tranquil ancient town, the morning mist gently lifted over the golden pagodas.' },
  { label: '🎙️ Podcast Intro', text: 'Welcome back to the podcast. Today we are diving into the creative potential of multimodal AI speech.' },
];

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  onGenerate,
  disabled = false,
  language,
}) => {
  const t = translations[language].studio;
  const maxLength = 5000;
  const currentLength = text.length;
  const isOverLimit = currentLength > maxLength;

  // Approximate duration (~12 characters per second for Burmese speech)
  const estSeconds = Math.round(currentLength / 12);
  const estDurationFormatted = estSeconds < 60 ? `~${estSeconds}s` : `~${Math.floor(estSeconds / 60)}m ${estSeconds % 60}s`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim() && !disabled && onGenerate) {
        onGenerate();
      }
    }
  };

  const presets = language === 'my' ? SAMPLE_PRESETS_MY : SAMPLE_PRESETS_EN;

  return (
    <div className="w-full space-y-2.5">
      
      {/* Header and Action */}
      <div className="flex items-center justify-between">
        <label htmlFor="tts-text-input" className="text-sm font-semibold text-zinc-900">
          {t.textLabel}
        </label>
        {text.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled}
            className="text-xs font-medium text-zinc-500 hover:text-myanmar-red transition-colors cursor-pointer"
          >
            {t.clearText}
          </button>
        )}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="tts-text-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={t.placeholder}
          rows={6}
          className="w-full rounded-xl bg-white border border-zinc-200 p-4 text-base text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-myanmar-red focus:ring-1 focus:ring-myanmar-red transition-all resize-y min-h-[160px] leading-relaxed disabled:opacity-60 disabled:bg-zinc-50 font-sans"
        />
      </div>

      {/* Preset sample buttons if empty */}
      {!text && (
        <div className="pt-1">
          <span className="text-xs text-zinc-400 font-medium">{t.presetsLabel}:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(preset.text)}
                disabled={disabled}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Counter and Estimated Duration */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t.estimatedDuration}: <strong className="font-mono text-zinc-700">{estDurationFormatted}</strong></span>
        </div>

        <span className={`font-mono ${isOverLimit ? 'text-myanmar-red font-semibold' : 'text-zinc-500'}`}>
          {currentLength.toLocaleString()} / {maxLength.toLocaleString()} {t.charCount}
        </span>
      </div>

    </div>
  );
};
