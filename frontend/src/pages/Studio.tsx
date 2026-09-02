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

interface StudioProps {
  language: Language;
  initialVoiceId?: string | null;
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
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0.0);

  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<TTSResponseMetadata | null>(null);

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
        speed: speed,
        pitch: pitch,
      });

      setCurrentAudioUrl(result.audioUrl);
      setCurrentMetadata(result.metadata);
      setGenerationState('success');

      setTimeout(() => {
        setGenerationState('idle');
      }, 2000);

    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setErrorMessage(t.errorNotice);
      setGenerationState('error');
      setTimeout(() => {
        setGenerationState('idle');
      }, 4000);
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

        {/* Speed & Pitch Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Speed */}
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800">{t.speedLabel}</span>
              <span className="font-mono text-zinc-900 font-bold">{speed}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400">0.5x</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                disabled={generationState === 'loading'}
                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-zinc-400">2.0x</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800">{t.pitchLabel}</span>
              <span className="font-mono text-zinc-900 font-bold">{pitch > 0 ? `+${pitch}` : pitch}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400">-1.0</span>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                disabled={generationState === 'loading'}
                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-zinc-400">+1.0</span>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-xs font-semibold underline hover:no-underline ml-3"
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

    </div>
  );
};
