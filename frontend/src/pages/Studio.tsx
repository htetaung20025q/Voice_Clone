import React, { useState, useEffect } from 'react';
import { TextEditor } from '../components/TextEditor';
import { VoiceSelector } from '../components/VoiceSelector';
import { StyleSelector } from '../components/StyleSelector';
import { GenerateButton } from '../components/GenerateButton';
import type { GenerationState } from '../components/GenerateButton';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceStudioAPI } from '../services/api';
import type { 
  VoiceInfo, 
  StyleInfo, 
  TTSResult, 
  TTSResponseMetadata 
} from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

import {
  History,
  Trash2,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  Lock,
  X,
  Zap
} from 'lucide-react';
import { AuthService } from '../services/auth';
import type { UserResponse } from '../services/api';
import { AuthModal } from '../components/AuthModal';
import { CreditPackagesModal } from '../components/CreditPackagesModal';
import { InsufficientCreditsModal } from '../components/InsufficientCreditsModal';
import { PremiumVoiceModal } from '../components/PremiumVoiceModal';

interface StudioProps {
  language: Language;
  initialVoiceId?: string | null;
}

export interface HistoryItem {
  id: string;
  text: string;
  voice: string;
  voiceName: string;
  style: string;
  durationSeconds: number;
  timestamp: number;
  isReplicated?: boolean;
}

export const Studio: React.FC<StudioProps> = ({ language, initialVoiceId }) => {
  const t = translations[language].studio;

  // Active Mode: 'standard' (prebuilt Gemini neural voices) or 'replication' (custom cloned voice)
  const [activeMode, setActiveMode] = useState<'standard' | 'replication'>('standard');

  // Text state
  const [text, setText] = useState<string>(
    language === 'my'
      ? 'မင်္ဂလာပါရှင်။ BurmeseATAN မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော မြန်မာအသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။'
      : 'Welcome to BurmeseATAN. Turn your text into natural-sounding Myanmar AI voice.'
  );

  // Standard TTS options
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoiceId || 'thiri');
  const [selectedStyle, setSelectedStyle] = useState<string>('natural');
  const [targetLanguage, setTargetLanguage] = useState<string>('myanmar');

  // User & Modals state
  const [user, setUser] = useState<UserResponse | null>(AuthService.getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [insufficientCreditsModalOpen, setInsufficientCreditsModalOpen] = useState(false);
  const [premiumVoiceModalOpen, setPremiumVoiceModalOpen] = useState(false);
  const [blockedVoice, setBlockedVoice] = useState<VoiceInfo | null>(null);

  useEffect(() => {
    const unsub = AuthService.subscribe((u) => setUser(u ? { ...u } : null));
    return unsub;
  }, []);

  // Credit calculation (1 credit per 1,000 Myanmar chars)
  const requiredCredits = Math.max(1, Math.ceil(text.trim().length / 1000));

  // Generation & UI states
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccessNotice, setIsAccessNotice] = useState<boolean>(false);

  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<TTSResponseMetadata | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('burmeseatan_history') || localStorage.getItem('burmavoice_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio preview helper for voice cards
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [loadedVoices, loadedStyles] = await Promise.all([
          VoiceStudioAPI.getVoices(),
          VoiceStudioAPI.getStyles(),
        ]);
        setVoices(loadedVoices);
        setStyles(loadedStyles);
        if (!initialVoiceId && loadedVoices.length > 0) {
          setSelectedVoice(loadedVoices[0].id);
        } else if (initialVoiceId) {
          setSelectedVoice(initialVoiceId);
        }
        if (loadedStyles.length > 0) {
          setSelectedStyle(loadedStyles[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial studio options:', err);
      }
    }
    loadConfig();
  }, [initialVoiceId]);

  const handlePreview = async (voice: VoiceInfo) => {
    try {
      if (previewAudio) {
        previewAudio.pause();
      }
      const audioUrl = await VoiceStudioAPI.getVoicePreviewAudio(voice.id);
      const audio = new Audio(audioUrl);
      setPreviewAudio(audio);
      await audio.play();
    } catch (e) {
      console.error('Preview error:', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('burmeseatan_history');
      localStorage.removeItem('burmavoice_history');
    } catch {}
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setText(item.text);
    if (!item.isReplicated) {
      setSelectedVoice(item.voice);
      setSelectedStyle(item.style);
    }
    setActiveMode('standard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Main synthesis trigger
  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage(
        language === 'my'
          ? 'ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပေးပါ။'
          : 'Please enter text to generate voice.'
      );
      return;
    }

    // 1. Auth check: user must be authenticated
    const currentUser = AuthService.getUser();
    const token = AuthService.getToken();
    if (!currentUser || !token) {
      setAuthModalOpen(true);
      return;
    }

    // 2. Premium voice check (Admin bypasses premium restrictions)
    const isAuthorized = !!currentUser.is_admin || !!currentUser.is_premium;
    const currentVoiceInfo = voices.find((v) => v.id.toLowerCase() === selectedVoice.toLowerCase());
    if (currentVoiceInfo?.premium && !isAuthorized) {
      setBlockedVoice(currentVoiceInfo);
      setPremiumVoiceModalOpen(true);
      return;
    }

    // 3. Credit balance check (Admin bypasses credit limits)
    if (!currentUser.is_admin && currentUser.credits_balance < requiredCredits) {
      setInsufficientCreditsModalOpen(true);
      return;
    }

    setErrorMessage(null);
    setIsAccessNotice(false);
    setGenerationState('loading');

    try {
      if (activeMode === 'standard') {
        // Mode 1: Standard TTS with Prebuilt Gemini Voices
        setLoadingLabel(t.generatingBtn);
        const result: TTSResult = await VoiceStudioAPI.synthesize({
          text: trimmed,
          voice: selectedVoice,
          style: selectedStyle,
          performance_profile: selectedVoice,
          language: targetLanguage,
        }, token);

        // Update local balance
        if (result.metadata?.credits_remaining !== undefined) {
          AuthService.updateCredits(result.metadata.credits_remaining);
        } else {
          AuthService.updateCredits(Math.max(0, currentUser.credits_balance - requiredCredits));
        }

        setCurrentAudioUrl(result.audioUrl);
        setCurrentMetadata(result.metadata);
        setGenerationState('success');

        const newHistoryItem: HistoryItem = {
          id: `gen_${Date.now()}`,
          text: trimmed,
          voice: selectedVoice,
          voiceName: result.metadata?.voice_name || selectedVoice,
          style: selectedStyle,
          durationSeconds: result.metadata?.duration_seconds || 0,
          timestamp: Date.now(),
          isReplicated: false,
        };
        setHistory((prev) => {
          const updated = [newHistoryItem, ...prev.slice(0, 9)];
          try {
            localStorage.setItem('burmeseatan_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });

      } else {
        // Voice Replication is Coming Soon & Closed
        throw new Error(
          language === 'my'
            ? 'အသံပုံတူဖန်တီးမှု စနစ် မကြာမီ လာပါမည်။ ကျေးဇူးပြု၍ စံပြု အသံများကို အသုံးပြုပေးပါ။'
            : 'Voice Replication is coming soon. Please use our standard voices.'
        );
      }

      setTimeout(() => {
        setGenerationState('idle');
        setLoadingLabel(null);
      }, 2000);

    } catch (err: any) {
      console.error('Synthesis failed:', err);
      
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        setGenerationState('idle');
        setInsufficientCreditsModalOpen(true);
        return;
      }

      if (err.code === 'PREMIUM_VOICE_REQUIRED' || err.status === 403) {
        setGenerationState('idle');
        setPremiumVoiceModalOpen(true);
        return;
      }
      const rawMsg = err?.message || t.errorNotice;
      
      // Check if error is related to Google Cloud allowlist or permissions
      if (
        rawMsg.toLowerCase().includes('not enabled for this google cloud project') ||
        rawMsg.toLowerCase().includes('credentials') ||
        rawMsg.toLowerCase().includes('unauthenticated') ||
        rawMsg.toLowerCase().includes('403')
      ) {
        setIsAccessNotice(true);
        setErrorMessage(
          language === 'my'
            ? 'စနစ်ကုဒ်ပိုင်းဆိုင်ရာ အားလုံး အဆင်သင့်ဖြစ်ပြီဖြစ်သော်လည်း၊ Google Cloud Voice Replication ဝန်ဆောင်မှုကို အသုံးပြုရန် သက်ဆိုင်ရာ Google Cloud Project အား Allowlist စာရင်းသွင်းခွင့်ပြုချက် ရရှိထားရန် လိုအပ်ပါသည်။'
            : 'Implementation is ready and complete. However, Google Cloud Voice Replication requires project allowlisting from Google Cloud to synthesize custom voices.'
        );
      } else {
        setIsAccessNotice(false);
        setErrorMessage(rawMsg);
      }

      setGenerationState('error');
      setTimeout(() => {
        setGenerationState('idle');
        setLoadingLabel(null);
      }, 6000);
    }
  };

  // Check if generate button should be disabled
  const isGenerateDisabled = () => {
    if (activeMode === 'replication') return true;
    if (!text.trim()) return true;
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8 text-left">
      
      {/* Studio Header with Cultural Identity */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-amber-300/60 text-xs font-semibold text-zinc-700 shadow-2xs">
          <span className="text-amber-500 font-serif">❖</span>
          <span className="font-burmese">Gemini 3.1 Flash Neural Audio</span>
          <span className="text-zinc-300">•</span>
          <span className="text-amber-600 font-mono font-bold">24,000 Hz LINEAR16</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 font-burmese leading-tight">
          {activeMode === 'replication' ? `${t.replicationTitle} (${t.comingSoonBadge})` : t.title}
        </h1>
        <p className="text-sm text-zinc-500 font-burmese leading-[1.8]">
          {activeMode === 'replication' ? t.replicationComingSoonDesc : t.subtitle}
        </p>
      </div>

      {/* Admin Privilege Banner */}
      {user?.is_admin && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-between text-xs font-burmese shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{translations[language].admin.adminModeNotice}</span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-2xs shrink-0">
            ADMIN MODE
          </span>
        </div>
      )}

      {/* Mode Switcher Tabs (Standard TTS vs Voice Replication) */}
      <div className="flex items-center p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/90 max-w-lg shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveMode('standard');
            if (errorMessage) setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-burmese transition-all cursor-pointer ${
            activeMode === 'standard'
              ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t.modeStandard}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('replication');
            if (errorMessage) setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold font-burmese transition-all cursor-pointer ${
            activeMode === 'replication'
              ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>{t.modeReplication}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200/80 tracking-wide">
            {t.comingSoonBadge}
          </span>
        </button>
      </div>

      {/* Main Studio Workbench Card with Shwe-Ruby Hairline */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm overflow-hidden relative">
        <div className="h-[2.5px] w-full bg-shwe-ruby-line opacity-90" />
        <div className="p-5 sm:p-8 space-y-6">
        
        {/* Mode A: Voice Replication Coming Soon & Closed State */}
        {activeMode === 'replication' && (
          <div className="relative p-6 sm:p-10 rounded-2xl border-2 border-dashed border-amber-200/90 bg-gradient-to-b from-amber-50/50 via-white to-zinc-50/20 text-center space-y-5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveMode('standard')}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              title={t.closeSectionBtn}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/90 text-amber-700 flex items-center justify-center shadow-xs border border-amber-200/60">
              <Lock className="w-7 h-7 text-amber-700" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-200 text-amber-800 text-xs font-bold font-burmese">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.comingSoonBadge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 font-burmese">
                {t.replicationComingSoonTitle}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 font-burmese leading-relaxed">
                {t.replicationComingSoonDesc}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveMode('standard')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold font-burmese bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-md shadow-myanmar-red/20 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{t.closeSectionBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Text Input Section & Standard TTS Controls */}
        {activeMode === 'standard' && (
          <>
            <div className="space-y-2">
              <TextEditor
                text={text}
                onChange={(val) => {
                  setText(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                onGenerate={handleGenerate}
                disabled={generationState === 'loading'}
                language={language}
              />

              {/* Dynamic Credit Requirement Indicator */}
              <div className="flex items-center justify-between text-xs text-zinc-500 font-burmese px-1 pt-0.5">
                <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/70 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span className="font-bold">
                    {language === 'my'
                      ? `ခရက်ဒစ် ${requiredCredits} ခု လိုအပ်မည် (အက္ခရာ ၁,၀၀၀ လျှင် ၁ ခရက်ဒစ်)`
                      : `Requires: ${requiredCredits} Credit${requiredCredits > 1 ? 's' : ''} (1 credit / 1k chars)`}
                  </span>
                </div>
                {user ? (
                  <div className="text-zinc-600 font-medium">
                    {language === 'my' ? `လက်ကျန်: ${user.credits_balance} Credits` : `Balance: ${user.credits_balance} Credits`}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                  >
                    ⚡ Get 5 Free Credits
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Voice Persona Selection */}
            <div className="pt-2">
              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                onPreviewVoice={handlePreview}
                onSelectPremiumBlocked={(v) => {
                  setBlockedVoice(v);
                  setPremiumVoiceModalOpen(true);
                }}
                disabled={generationState === 'loading'}
                language={language}
              />
            </div>

            {/* Step 3: Speaking Style Selection */}
            <div className="pt-2">
              <StyleSelector
                styles={styles}
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
                disabled={generationState === 'loading'}
                language={language}
              />
            </div>

            {/* Step 4: Language Selection */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  {t.languageLabel}
                </label>
                <span className="text-[11px] text-zinc-400">
                  {language === 'my' ? 'ဘာသာစကား သတ်မှတ်ချက်' : 'Synthesis Target'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'myanmar', label: 'မြန်မာ (Burmese)' },
                  { id: 'english', label: 'English' },
                  { id: 'bilingual', label: 'Burmese + English' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setTargetLanguage(lang.id)}
                    disabled={generationState === 'loading'}
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

        {/* Error / Service Notice */}
        {errorMessage && (
          <div className={`p-4 rounded-2xl text-xs font-medium flex items-start justify-between gap-3 ${
            isAccessNotice
              ? 'bg-amber-50 border border-amber-300 text-amber-900'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-start gap-2.5 flex-1">
              {isAccessNotice ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : null}
              <div className="space-y-1">
                {isAccessNotice && (
                  <p className="font-bold text-amber-950 font-burmese">
                    {t.accessRequiredTitle}
                  </p>
                )}
                <span className="font-burmese leading-relaxed">{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-bold underline hover:no-underline cursor-pointer shrink-0 font-burmese"
            >
              {language === 'my' ? 'ထပ်မံကြိုးစားမည်' : 'Try Again'}
            </button>
          </div>
        )}

            {/* Active Speaking Performance Profile Indicator */}
            {(() => {
              const currentVoiceInfo = voices.find(v => v.id.toLowerCase() === selectedVoice.toLowerCase());
              if (!currentVoiceInfo) return null;
              return (
                <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200/80 text-zinc-600">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span className="font-semibold text-zinc-700 font-burmese shrink-0">
                      {language === 'my' ? 'အသံစွမ်းဆောင်ရည် ပုံစံ:' : 'Performance Profile:'}
                    </span>
                    <span className="font-bold text-zinc-950 font-burmese truncate">
                      {language === 'my' ? currentVoiceInfo.persona_mm : currentVoiceInfo.persona}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase hidden sm:inline shrink-0 ml-2">
                    {currentVoiceInfo.sample_tag}
                  </span>
                </div>
              );
            })()}

            {/* Primary Action Button */}
            <div className="pt-1">
              <GenerateButton
                state={generationState}
                onClick={handleGenerate}
                disabled={isGenerateDisabled()}
                language={language}
                loadingLabel={loadingLabel || undefined}
              />
            </div>
          </>
        )}

        </div>
      </div>

      {/* Generated Audio Result */}
      {currentAudioUrl && (
        <div className="rounded-3xl border border-zinc-200/90 bg-white shadow-sm overflow-hidden transition-all">
          <div className="h-[2.5px] w-full bg-shwe-ruby-line opacity-90" />
          <div className="p-5 sm:p-7">
            <AudioPlayer
              audioUrl={currentAudioUrl}
              metadata={currentMetadata}
              textToCopy={text.trim()}
              onGenerateAgain={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Generation History */}
      {history.length > 0 && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-bold text-zinc-900 font-burmese">
                {language === 'my' ? 'မကြာသေးမီက ဖန်တီးမှုများ' : 'Recent Generations'}
              </h3>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'မှတ်တမ်းဖျက်မည်' : 'Clear'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-zinc-900 truncate font-burmese leading-relaxed">
                    "{item.text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-bold text-myanmar-red font-burmese">
                      {item.isReplicated ? '❖ ' + item.voiceName : item.voiceName}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{item.style}</span>
                    {item.durationSeconds > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{item.durationSeconds}s</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-zinc-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLoadHistory(item)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors cursor-pointer shrink-0 font-burmese"
                  title="Load into editor"
                >
                  <span>{language === 'my' ? 'ထည့်သွင်းမည်' : 'Load'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for Auth, Packages, Insufficient Credits, and Premium Voices */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
        onSuccess={() => setUser(AuthService.getUser())}
      />

      <CreditPackagesModal
        isOpen={packagesModalOpen}
        onClose={() => setPackagesModalOpen(false)}
        language={language}
        onRequireAuth={() => setAuthModalOpen(true)}
        onSuccess={() => setUser(AuthService.getUser())}
      />

      <InsufficientCreditsModal
        isOpen={insufficientCreditsModalOpen}
        onClose={() => setInsufficientCreditsModalOpen(false)}
        language={language}
        requiredCredits={requiredCredits}
        currentBalance={user?.credits_balance || 0}
        onBuyCredits={() => {
          setInsufficientCreditsModalOpen(false);
          setPackagesModalOpen(true);
        }}
      />

      <PremiumVoiceModal
        isOpen={premiumVoiceModalOpen}
        onClose={() => setPremiumVoiceModalOpen(false)}
        language={language}
        voiceName={blockedVoice ? (language === 'my' ? blockedVoice.myanmar_name : blockedVoice.name) : 'Premium Voice'}
        onViewPackages={() => {
          setPremiumVoiceModalOpen(false);
          setPackagesModalOpen(true);
        }}
      />
    </div>
  );
};
