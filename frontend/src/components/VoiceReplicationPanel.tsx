import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileAudio,
  Play,
  Pause,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface VoiceReplicationPanelProps {
  sourceFile: File | null;
  onSourceFileChange: (file: File | null) => void;
  consentFile: File | null;
  onConsentFileChange: (file: File | null) => void;
  consentConfirmed: boolean;
  onConsentConfirmedChange: (confirmed: boolean) => void;
  targetLanguage: string;
  onTargetLanguageChange: (lang: string) => void;
  language: Language;
  disabled?: boolean;
}

const BURMESE_CONSENT =
  'ကျွန်ုပ်သည် ဤအသံ၏ပိုင်ရှင်ဖြစ်ပြီး Google Cloud ကိုအသုံးပြုခြင်းဖြင့် ကျွန်ုပ်၏အသံ၏ ပေါင်းစပ်ပုံစံတစ်ခု ဖန်တီးရန် သဘောတူပါသည်။';
const ENGLISH_CONSENT =
  'I am the owner of this voice and I consent to Google Cloud using this voice to create a synthetic voice model.';

export const VoiceReplicationPanel: React.FC<VoiceReplicationPanelProps> = ({
  sourceFile,
  onSourceFileChange,
  consentFile,
  onConsentFileChange,
  consentConfirmed,
  onConsentConfirmedChange,
  targetLanguage,
  onTargetLanguageChange,
  language,
  disabled = false,
}) => {
  const t = translations[language].studio;

  // Source audio state & preview
  const [sourceDuration, setSourceDuration] = useState<number | null>(null);
  const [sourceAudioUrl, setSourceAudioUrl] = useState<string | null>(null);
  const [isSourcePlaying, setIsSourcePlaying] = useState(false);
  const sourceAudioRef = useRef<HTMLAudioElement | null>(null);
  const sourceInputRef = useRef<HTMLInputElement | null>(null);

  // Consent audio state & preview
  const [consentDuration, setConsentDuration] = useState<number | null>(null);
  const [consentAudioUrl, setConsentAudioUrl] = useState<string | null>(null);
  const [isConsentPlaying, setIsConsentPlaying] = useState(false);
  const consentAudioRef = useRef<HTMLAudioElement | null>(null);
  const consentInputRef = useRef<HTMLInputElement | null>(null);

  // Consent script copy state
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'my' | 'en'>(
    targetLanguage === 'en-US' ? 'en' : 'my'
  );

  useEffect(() => {
    if (targetLanguage === 'en-US') {
      setActiveScriptTab('en');
    } else {
      setActiveScriptTab('my');
    }
  }, [targetLanguage]);

  // Load source audio preview
  useEffect(() => {
    if (sourceFile) {
      const url = URL.createObjectURL(sourceFile);
      setSourceAudioUrl(url);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setSourceDuration(audio.duration);
      };
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setSourceAudioUrl(null);
      setSourceDuration(null);
      setIsSourcePlaying(false);
    }
  }, [sourceFile]);

  // Load consent audio preview
  useEffect(() => {
    if (consentFile) {
      const url = URL.createObjectURL(consentFile);
      setConsentAudioUrl(url);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setConsentDuration(audio.duration);
      };
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setConsentAudioUrl(null);
      setConsentDuration(null);
      setIsConsentPlaying(false);
    }
  }, [consentFile]);

  const toggleSourcePlay = () => {
    if (!sourceAudioRef.current) return;
    if (isSourcePlaying) {
      sourceAudioRef.current.pause();
      setIsSourcePlaying(false);
    } else {
      if (consentAudioRef.current) {
        consentAudioRef.current.pause();
        setIsConsentPlaying(false);
      }
      sourceAudioRef.current.play().then(() => setIsSourcePlaying(true)).catch(() => {});
    }
  };

  const toggleConsentPlay = () => {
    if (!consentAudioRef.current) return;
    if (isConsentPlaying) {
      consentAudioRef.current.pause();
      setIsConsentPlaying(false);
    } else {
      if (sourceAudioRef.current) {
        sourceAudioRef.current.pause();
        setIsSourcePlaying(false);
      }
      consentAudioRef.current.play().then(() => setIsConsentPlaying(true)).catch(() => {});
    }
  };

  const handleCopyScript = () => {
    const textToCopy = activeScriptTab === 'my' ? BURMESE_CONSENT : ENGLISH_CONSENT;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    });
  };

  const formatSeconds = (sec: number | null) => {
    if (sec === null || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Hidden audio elements for previews */}
      {sourceAudioUrl && (
        <audio
          ref={sourceAudioRef}
          src={sourceAudioUrl}
          onEnded={() => setIsSourcePlaying(false)}
        />
      )}
      {consentAudioUrl && (
        <audio
          ref={consentAudioRef}
          src={consentAudioUrl}
          onEnded={() => setIsConsentPlaying(false)}
        />
      )}

      {/* Header Notice on Voice Replication Policy */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 text-xs text-zinc-700 font-burmese leading-relaxed">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">
              {language === 'my' ? 'ခွင့်ပြုချက်ဖြင့်သာ အသံပုံတူပြုလုပ်ခြင်း' : 'Authorized Voice Replication Only'}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Google Cloud Voices API
            </span>
          </div>
          <p>
            {language === 'my'
              ? 'အသံပိုင်ရှင်၏ ခွင့်ပြုချက်မရှိဘဲ အယောင်ဆောင်အသံပြုလုပ်ခြင်းကို ခွင့်မပြုပါ။ ၇ ရက်ကြာ ယာယီ key အဖြစ်သာ စနစ်အတွင်း သိမ်းဆည်းပါသည်။'
              : 'Impersonation of unauthorized persons is strictly prohibited. Voice keys are temporary (7-day validity) and managed securely server-side.'}
          </p>
        </div>
      </div>

      {/* Grid: A. Voice Sample & B. Consent Audio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* A. Voice Sample Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-burmese">
                {t.sourceSampleTitle}
              </h4>
            </div>
            {sourceDuration !== null && (
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                sourceDuration >= 10 && sourceDuration <= 30
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {sourceDuration.toFixed(1)}s {sourceDuration >= 10 && sourceDuration <= 30 ? '✓ Optimal' : ''}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500 font-burmese leading-relaxed">
            {t.sourceSampleDesc}
          </p>

          {!sourceFile ? (
            <div
              onClick={() => !disabled && sourceInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!disabled && e.dataTransfer.files?.[0]) {
                  onSourceFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed border-zinc-200 hover:border-myanmar-red/50 hover:bg-zinc-50/70 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-xs font-medium text-zinc-700 font-burmese">
                <span className="text-myanmar-red font-bold">{t.clickToUpload}</span> {t.dragAndDrop}
              </div>
              <p className="text-[11px] text-zinc-500 font-burmese leading-relaxed">
                {t.sourceSampleHint}
              </p>
              <input
                ref={sourceInputRef}
                type="file"
                accept=".wav,.mp3,.m4a,.ogg,.flac,.webm,audio/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onSourceFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {sourceFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB • {formatSeconds(sourceDuration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleSourcePlay}
                    className="p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                    title={isSourcePlaying ? 'Pause' : 'Play preview'}
                  >
                    {isSourcePlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSourceFileChange(null)}
                    disabled={disabled}
                    className="p-2 rounded-lg bg-white hover:bg-red-50 border border-zinc-200 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t.removeAudio}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {sourceDuration !== null && sourceDuration < 5 && (
                <div className="text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Recording is shorter than recommended 10 seconds.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* B. Consent Audio Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-2xs space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-burmese">
                {t.consentRecordingTitle}
              </h4>
            </div>
            {consentDuration !== null && (
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {consentDuration.toFixed(1)}s
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500 font-burmese leading-relaxed">
            {t.consentRecordingDesc}
          </p>

          {!consentFile ? (
            <div
              onClick={() => !disabled && consentInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!disabled && e.dataTransfer.files?.[0]) {
                  onConsentFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed border-zinc-200 hover:border-myanmar-red/50 hover:bg-zinc-50/70 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-xs font-medium text-zinc-700 font-burmese">
                <span className="text-myanmar-red font-bold">{t.clickToUpload}</span> {t.dragAndDrop}
              </div>
              <p className="text-[11px] text-zinc-500 font-burmese leading-relaxed">
                {language === 'my'
                  ? 'အသံဖိုင်ကို WAV, MP3, M4A, OGG, FLAC သို့မဟုတ် WebM format ဖြင့် ထည့်နိုင်ပါသည်။'
                  : 'Supported formats: WAV, MP3, M4A, OGG, FLAC, or WebM.'}
              </p>
              <input
                ref={consentInputRef}
                type="file"
                accept=".wav,.mp3,.m4a,.ogg,.flac,.webm,audio/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onConsentFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {consentFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      {(consentFile.size / (1024 * 1024)).toFixed(2)} MB • {formatSeconds(consentDuration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleConsentPlay}
                    className="p-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                    title={isConsentPlaying ? 'Pause' : 'Play preview'}
                  >
                    {isConsentPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConsentFileChange(null)}
                    disabled={disabled}
                    className="p-2 rounded-lg bg-white hover:bg-red-50 border border-zinc-200 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title={t.removeAudio}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Required Consent Statement Script Box */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-serif">❖</span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-burmese">
              {t.consentScriptLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-zinc-200 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveScriptTab('my')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeScriptTab === 'my'
                    ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                မြန်မာ (Burmese)
              </button>
              <button
                type="button"
                onClick={() => setActiveScriptTab('en')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  activeScriptTab === 'en'
                    ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              {copiedScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">{t.consentCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.consentCopyBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/90 shadow-2xs">
          <p className="text-xs sm:text-sm text-zinc-900 font-burmese leading-[1.9] select-all">
            "{activeScriptTab === 'my' ? BURMESE_CONSENT : ENGLISH_CONSENT}"
          </p>
        </div>
      </div>

      {/* C. Mandatory Consent Confirmation Checkbox */}
      <div className={`p-4 rounded-2xl border transition-all ${
        consentConfirmed
          ? 'border-emerald-300 bg-emerald-50/40'
          : 'border-zinc-300 bg-white hover:border-zinc-400'
      }`}>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => onConsentConfirmedChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 w-4 h-4 rounded text-myanmar-red focus:ring-myanmar-red border-zinc-300 cursor-pointer"
          />
          <div className="space-y-0.5 text-xs text-zinc-700 font-burmese leading-relaxed">
            <span className={`font-semibold ${consentConfirmed ? 'text-emerald-950 font-bold' : 'text-zinc-900'}`}>
              {t.consentConfirmLabel}
            </span>
            <p className="text-[11px] text-zinc-500 font-burmese">
              {language === 'my'
                ? 'ဤအချက်ကို သဘောမတူပါက အသံပုံတူ ဖန်တီးခြင်းကို ဆောင်ရွက်ခွင့်ပြုမည် မဟုတ်ပါ။'
                : 'The Generate button will remain disabled until explicit authorization is confirmed.'}
            </p>
          </div>
        </label>
      </div>

      {/* Target Language Selection for Voice Replication */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
            {t.languageLabel}
          </label>
          <span className="text-[11px] text-zinc-400 font-burmese">
            {language === 'my' ? 'ဘာသာစကား သတ်မှတ်ချက်' : 'Synthesis Language'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'my-MM', label: 'မြန်မာ (Burmese)' },
            { id: 'en-US', label: 'English (US)' },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => onTargetLanguageChange(lang.id)}
              disabled={disabled}
              className={`py-2.5 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer focus-ring ${
                targetLanguage === lang.id
                  ? 'border-myanmar-red bg-myanmar-red-light/80 text-myanmar-red font-bold shadow-2xs'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
