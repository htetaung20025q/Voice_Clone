import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, Sparkles, ArrowRight } from 'lucide-react';
import { VoiceStudioAPI } from '../services/api';
import type { VoiceInfo } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface VoicesPageProps {
  onSelectVoiceForStudio: (voiceId: string) => void;
  language: Language;
}

export const Voices: React.FC<VoicesPageProps> = ({ onSelectVoiceForStudio, language }) => {
  const t = translations[language].voicesPage;
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadVoices() {
      const data = await VoiceStudioAPI.getVoices();
      setVoices(data);
    }
    loadVoices();

    return () => {
      if (audioInstance) {
        audioInstance.pause();
      }
    };
  }, []);

  const handlePlayPreview = async (voice: VoiceInfo) => {
    if (playingVoiceId === voice.id && audioInstance) {
      audioInstance.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioInstance) {
      audioInstance.pause();
    }

    try {
      setPlayingVoiceId(voice.id);
      const res = await VoiceStudioAPI.synthesize({
        text: voice.sample_text,
        voice: voice.id,
        style: 'natural',
        language: 'myanmar',
      });

      const audio = new Audio(res.audioUrl);
      setAudioInstance(audio);
      audio.onended = () => setPlayingVoiceId(null);
      await audio.play();
    } catch (e) {
      console.error('Playback error:', e);
      setPlayingVoiceId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      
      {/* Header with subtle Acheik motif accent */}
      <div className="relative text-left space-y-2 border-b border-zinc-200 pb-8 overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-acheik-lines opacity-40 pointer-events-none" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-myanmar-red-light border border-myanmar-red/20 text-myanmar-red text-xs font-semibold">
          <Sparkles className="w-3 h-3 text-myanmar-gold" />
          <span>{t.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-600 max-w-2xl">
          {t.subtitle}
        </p>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voices.map((voice) => {
          const isPlaying = playingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all flex flex-col justify-between space-y-5 shadow-xs"
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {voice.myanmar_name}
                      </h3>
                      <span className="text-xs font-semibold text-zinc-500 font-mono">
                        ({voice.name})
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {voice.gender}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-myanmar-red-light text-myanmar-red flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-myanmar-gold">
                    {language === 'my' ? voice.persona_mm : voice.persona}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {voice.tone}
                  </p>
                </div>

                {/* Sample text snippet */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 font-burmese italic">
                  "{voice.sample_text}"
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handlePlayPreview(voice)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    isPlaying
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? t.playing : t.preview}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectVoiceForStudio(voice.id)}
                  className="inline-flex items-center gap-1 py-2 px-3 rounded-lg text-xs font-semibold bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-colors cursor-pointer shadow-xs"
                >
                  <span>{t.useInStudio}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
