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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      
      {/* Studio Header */}
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-500">
          {t.subtitle}
        </p>
      </div>

      {/* Main Workspace Form */}
      <div className="space-y-6">
        
        {/* Large Text Editor */}
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

        {/* Voice & Speaking Style Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VoiceSelector
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            onPreviewVoice={handlePreview}
            disabled={generationState === 'loading'}
            language={language}
          />
          <StyleSelector
            styles={styles}
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
            disabled={generationState === 'loading'}
            language={language}
          />
        </div>

        {/* Language Selection Bar */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-900">
            {t.languageLabel}
          </label>
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
                className={`py-2.5 px-3 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                  targetLanguage === lang.id
                    ? 'border-myanmar-red bg-myanmar-red-light text-myanmar-red font-semibold'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Option B: Native AI Cadence & Pitch Notice */}
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <Sparkles className="w-3.5 h-3.5 text-myanmar-gold" />
              <span>{language === 'my' ? 'သဘာဝ AI အသံနေအထားနှင့် လေယူလေသိမ်း' : 'Native AI Cadence & Pitch'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              {language === 'my' ? 'အလိုအလျောက် ပေါင်းစပ်' : 'Neural Native'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {language === 'my'
              ? 'Gemini Neural Speech စနစ်သည် စကားပြောအသံထွက်နှင့် အဖြတ်အတောက်ကို သဘာဝအတိုင်း အလိုအလျောက် ထိန်းညှိပေးပါသည်။ (အသံဖွင့်သည့် အမြန်နှုန်းကို အောက်ဖော်ပြပါ Audio Player တွင် ချိန်ညှိနိုင်ပါသည်)'
              : 'Gemini Neural Speech generates authentic Burmese cadence and intonation natively. Playback speed can be adjusted directly in the generated Audio Player below.'}
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-semibold underline hover:no-underline ml-3 cursor-pointer shrink-0"
            >
              {language === 'my' ? 'ထပ်မံကြိုးစားမည်' : 'Try Again'}
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        <GenerateButton
          state={generationState}
          onClick={handleGenerate}
          disabled={!text.trim()}
          language={language}
        />

      </div>

      {/* Generated Audio Result (Displays naturally after generation) */}
      {currentAudioUrl && (
        <div className="pt-6 border-t border-zinc-200">
          <AudioPlayer
            audioUrl={currentAudioUrl}
            metadata={currentMetadata}
            onGenerateAgain={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            language={language}
          />
        </div>
      )}

      {/* Generation History (P2) */}
      {history.length > 0 && (
        <div className="pt-8 border-t border-zinc-200 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-bold text-zinc-900">
                {language === 'my' ? 'မကြာသေးမီက ဖန်တီးမှုများ' : 'Recent Generations'}
              </h3>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
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
                className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-zinc-900 truncate font-burmese">
                    "{item.text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-semibold text-myanmar-red">{item.voiceName}</span>
                    <span>•</span>
                    <span className="capitalize">{item.style}</span>
                    {item.durationSeconds > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{item.durationSeconds}s</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-zinc-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLoadHistory(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium transition-colors cursor-pointer shrink-0"
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
