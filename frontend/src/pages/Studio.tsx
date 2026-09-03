import React, { useState, useEffect } from 'react';
import { TextEditor } from '../components/TextEditor';
import { VoiceSelector } from '../components/VoiceSelector';
import { StyleSelector } from '../components/StyleSelector';
import { GenerateButton } from '../components/GenerateButton';
import type { GenerationState } from '../components/GenerateButton';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceReplicationPanel } from '../components/VoiceReplicationPanel';
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
  Fingerprint,
  AlertTriangle
} from 'lucide-react';

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
      ? 'မင်္ဂလာပါရှင်။ BurmaVoice မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော မြန်မာအသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။'
      : 'Welcome to BurmaVoice. Turn your text into natural-sounding Myanmar AI voice.'
  );

  // Standard TTS options
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoiceId || 'thiri');
  const [selectedStyle, setSelectedStyle] = useState<string>('natural');
  const [targetLanguage, setTargetLanguage] = useState<string>('myanmar');

  // Voice Replication options
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [replicationLanguage, setReplicationLanguage] = useState<string>('my-MM');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Generation & UI states
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccessNotice, setIsAccessNotice] = useState<boolean>(false);

  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<TTSResponseMetadata | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('burmavoice_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio preview helper for voice cards
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  // When source or consent files change, invalidate existing voiceSessionId
  const handleSourceFileChange = (file: File | null) => {
    setSourceFile(file);
    setActiveSessionId(null);
    if (errorMessage) setErrorMessage(null);
  };

  const handleConsentFileChange = (file: File | null) => {
    setConsentFile(file);
    setActiveSessionId(null);
    if (errorMessage) setErrorMessage(null);
  };

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
      const res = await VoiceStudioAPI.synthesize({
        text: voice.sample_text,
        voice: voice.id,
        style: 'natural',
        language: 'myanmar',
      });
      const audio = new Audio(res.audioUrl);
      setPreviewAudio(audio);
      audio.play();
    } catch (e) {
      console.error('Preview error:', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('burmavoice_history');
    } catch {}
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setText(item.text);
    if (item.isReplicated) {
      setActiveMode('replication');
    } else {
      setActiveMode('standard');
      setSelectedVoice(item.voice);
      setSelectedStyle(item.style);
    }
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
          language: targetLanguage,
        });

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
            localStorage.setItem('burmavoice_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });

      } else {
        // Mode 2: Custom Voice Replication (Voice Sample + Consent -> Replicated Voice)
        if (!sourceFile) {
          throw new Error(
            language === 'my'
              ? 'ကျေးဇူးပြု၍ အသံနမူနာ ဖိုင်တင်ပေးပါ။'
              : 'Please upload a voice sample.'
          );
        }
        if (!consentFile) {
          throw new Error(
            language === 'my'
              ? 'ကျေးဇူးပြု၍ ခွင့်ပြုချက် အသံသွင်းဖိုင် တင်ပေးပါ။'
              : 'Please upload the required consent recording.'
          );
        }
        if (!consentConfirmed) {
          throw new Error(
            language === 'my'
              ? 'ကျေးဇူးပြု၍ အသံပိုင်ဆိုင်ခွင့် သို့မဟုတ် ခွင့်ပြုချက် ရှိကြောင်း အတည်ပြုပေးပါ။'
              : 'Please confirm that you own this voice or have permission to use it.'
          );
        }

        let sessionId = activeSessionId;

        // Step 1: Create voice replication key if not already cached
        if (!sessionId) {
          setLoadingLabel(t.creatingVoiceBtn);
          const repRes = await VoiceStudioAPI.replicateVoice(
            sourceFile,
            consentFile,
            consentConfirmed,
            replicationLanguage
          );
          sessionId = repRes.voice_session_id;
          setActiveSessionId(sessionId);
        }

        // Step 2: Synthesize speech in replicated voice
        setLoadingLabel(t.generatingSpeechBtn);
        const result: TTSResult = await VoiceStudioAPI.synthesizeReplicated({
          voice_session_id: sessionId,
          text: trimmed,
          language_code: replicationLanguage,
        });

        setCurrentAudioUrl(result.audioUrl);
        setCurrentMetadata(result.metadata);
        setGenerationState('success');

        const newHistoryItem: HistoryItem = {
          id: `rep_${Date.now()}`,
          text: trimmed,
          voice: 'replicated',
          voiceName: language === 'my' ? 'စိတ်ကြိုက် ပုံတူအသံ' : 'Replicated Voice',
          style: 'custom',
          durationSeconds: result.metadata?.duration_seconds || 0,
          timestamp: Date.now(),
          isReplicated: true,
        };
        setHistory((prev) => {
          const updated = [newHistoryItem, ...prev.slice(0, 9)];
          try {
            localStorage.setItem('burmavoice_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }

      setTimeout(() => {
        setGenerationState('idle');
        setLoadingLabel(null);
      }, 2000);

    } catch (err: any) {
      console.error('Synthesis failed:', err);
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
    if (!text.trim()) return true;
    if (activeMode === 'replication') {
      if (!sourceFile || !consentFile || !consentConfirmed) return true;
    }
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
          {activeMode === 'replication' ? t.replicationTitle : t.title}
        </h1>
        <p className="text-sm text-zinc-500 font-burmese leading-[1.8]">
          {activeMode === 'replication' ? t.replicationSubtitle : t.subtitle}
        </p>
      </div>

      {/* Mode Switcher Tabs (Standard TTS vs Voice Replication) */}
      <div className="flex items-center p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/90 max-w-md shadow-2xs">
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold font-burmese transition-all cursor-pointer ${
            activeMode === 'replication'
              ? 'bg-white text-myanmar-red shadow-xs border border-zinc-200/80'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5 text-myanmar-red" />
          <span>{t.modeReplication}</span>
        </button>
      </div>

      {/* Main Studio Workbench Card with Shwe-Ruby Hairline */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm overflow-hidden relative">
        <div className="h-[2.5px] w-full bg-shwe-ruby-line opacity-90" />
        <div className="p-5 sm:p-8 space-y-6">
        
        {/* Mode A: Voice Replication Upload Section */}
        {activeMode === 'replication' && (
          <div className="pb-2 border-b border-zinc-100">
            <VoiceReplicationPanel
              sourceFile={sourceFile}
              onSourceFileChange={handleSourceFileChange}
              consentFile={consentFile}
              onConsentFileChange={handleConsentFileChange}
              consentConfirmed={consentConfirmed}
              onConsentConfirmedChange={setConsentConfirmed}
              targetLanguage={replicationLanguage}
              onTargetLanguageChange={setReplicationLanguage}
              language={language}
              disabled={generationState === 'loading'}
            />
          </div>
        )}

        {/* Text Input Section */}
        <div className="space-y-2">
          {activeMode === 'replication' && (
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                {language === 'my' ? '၃။ ဖတ်ကြားလိုသော စာသား (Text Input)' : '3. Enter Text to Synthesize'}
              </label>
              <span className="text-[11px] text-zinc-400 font-burmese">
                {language === 'my' ? 'မြန်မာ ယူနီကုဒ် အထောက်အပံ့' : 'Burmese Unicode'}
              </span>
            </div>
          )}

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
        </div>

        {/* Mode B: Standard TTS Persona & Style Controls */}
        {activeMode === 'standard' && (
          <>
            {/* Step 2: Voice Persona Selection */}
            <div className="pt-2">
              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                onPreviewVoice={handlePreview}
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
          </>
        )}

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

        {/* Primary Action Button */}
        <div className="pt-2">
          <GenerateButton
            state={generationState}
            onClick={handleGenerate}
            disabled={isGenerateDisabled()}
            language={language}
            loadingLabel={loadingLabel || undefined}
            buttonLabel={activeMode === 'replication' ? t.generateBtn : undefined}
          />
        </div>

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

    </div>
  );
};
