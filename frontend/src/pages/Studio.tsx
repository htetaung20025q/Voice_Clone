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

import { History, Trash2, ArrowUpRight, Sparkles } from 'lucide-react';

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
}

export const Studio: React.FC<StudioProps> = ({ language, initialVoiceId }) => {
  const t = translations[language].studio;

  const [text, setText] = useState<string>(
    language === 'my'
      ? 'မင်္ဂလာပါရှင်။ BurmaVoice မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော မြန်မာအသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။'
      : 'Welcome to BurmaVoice. Turn your text into natural-sounding Myanmar AI voice.'
  );

  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(initialVoiceId || 'thiri');
  const [selectedStyle, setSelectedStyle] = useState<string>('natural');
  const [targetLanguage, setTargetLanguage] = useState<string>('myanmar');

  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Audio preview helper
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
    setSelectedVoice(item.voice);
    setSelectedStyle(item.style);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage(language === 'my' ? 'ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပေးပါ။' : 'Please enter text to generate voice.');
      return;
    }

    setErrorMessage(null);
    setGenerationState('loading');

    try {
      const result: TTSResult = await VoiceStudioAPI.synthesize({
        text: trimmed,
        voice: selectedVoice,
        style: selectedStyle,
        language: targetLanguage,
      });

      setCurrentAudioUrl(result.audioUrl);
      setCurrentMetadata(result.metadata);
      setGenerationState('success');

      // Save to localStorage history
      const newHistoryItem: HistoryItem = {
        id: `gen_${Date.now()}`,
        text: trimmed,
        voice: selectedVoice,
        voiceName: result.metadata?.voice_name || selectedVoice,
        style: selectedStyle,
        durationSeconds: result.metadata?.duration_seconds || 0,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev.slice(0, 9)];
        try {
          localStorage.setItem('burmavoice_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setTimeout(() => {
        setGenerationState('idle');
      }, 2000);

    } catch (err: any) {
      console.error('Synthesis failed:', err);
      const msg = err?.message || t.errorNotice;
      setErrorMessage(msg);
      setGenerationState('error');
      setTimeout(() => {
        setGenerationState('idle');
      }, 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      
      {/* Studio Header with Cultural Identity */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-amber-300/60 text-xs font-semibold text-zinc-700 shadow-2xs">
          <span className="text-amber-500 font-serif">❖</span>
          <span className="font-burmese">Gemini 3.1 Flash Neural Audio</span>
          <span className="text-zinc-300">•</span>
          <span className="text-amber-600 font-mono font-bold">24,000 Hz PCM</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 font-burmese leading-tight">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-500 font-burmese leading-[1.8]">
          {t.subtitle}
        </p>
      </div>

      {/* Main Studio Workbench Card with Shwe-Ruby Hairline */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm overflow-hidden relative">
        <div className="h-[2.5px] w-full bg-shwe-ruby-line opacity-90" />
        <div className="p-5 sm:p-8 space-y-6">
        
        {/* Step 1: Large Text Editor */}
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

        {/* Step 4: Language & Engine Options */}
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

          {/* Option B: Native AI Cadence & Pitch Notice */}
          <div className="p-3.5 rounded-2xl border border-amber-200/60 bg-amber-50/40 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-myanmar-gold shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 font-burmese">
                  {language === 'my' ? 'သဘာဝ AI အသံနေအထားနှင့် လေယူလေသိမ်း' : 'Native AI Cadence & Pitch'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                  Neural Native
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-relaxed font-burmese">
                {language === 'my'
                  ? 'Gemini Neural Speech သည် စကားပြောအသံထွက်နှင့် အဖြတ်အတောက်ကို သဘာဝအတိုင်း ထိန်းညှိပေးပါသည်။ အသံဖွင့်သည့် အမြန်နှုန်း (Speed) ကို အောက်ပါ Player တွင် ပြောင်းလဲနိုင်ပါသည်။'
                  : 'Gemini Neural Speech generates authentic Burmese cadence natively. Playback speed controls are available in the player.'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between gap-3">
            <span className="font-burmese leading-relaxed">{errorMessage}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-bold underline hover:no-underline cursor-pointer shrink-0"
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
            disabled={!text.trim()}
            language={language}
          />
        </div>

        </div>
      </div>

      {/* Generated Audio Result (Card with subtle Shwe-Ruby accent) */}
      {currentAudioUrl && (
        <div className="rounded-3xl border border-zinc-200/90 bg-white shadow-sm overflow-hidden transition-all">
          <div className="h-[2.5px] w-full bg-shwe-ruby-line opacity-90" />
          <div className="p-5 sm:p-7">
            <AudioPlayer
              audioUrl={currentAudioUrl}
              metadata={currentMetadata}
              onGenerateAgain={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Generation History (P2) */}
      {history.length > 0 && (
        <div className="pt-4 space-y-4 text-left">
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
                    <span className="font-bold text-myanmar-red font-burmese">{item.voiceName}</span>
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
