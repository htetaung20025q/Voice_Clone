import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import type { TTSResponseMetadata } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface AudioPlayerProps {
  audioUrl: string | null;
  metadata: TTSResponseMetadata | null;
  onGenerateAgain?: () => void;
  language: Language;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  metadata,
  onGenerateAgain,
  language,
}) => {
  const t = translations[language].studio;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error('Audio play error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || metadata?.duration_seconds || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const voiceTag = metadata?.voice?.toLowerCase() || 'burmavoice';
    a.download = `burmavoice_${voiceTag}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!audioUrl) {
    return null;
  }

  const effectiveDuration = duration || metadata?.duration_seconds || 0;
  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 space-y-5 shadow-xs animate-in fade-in zoom-in-95 duration-200">
      
      {/* Hidden native HTML5 audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header: "Your voice is ready" */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">{t.readyTitle}</h3>
            <p className="text-xs text-zinc-500">
              {metadata?.voice_name} • {metadata?.style} ({metadata?.language})
            </p>
          </div>
        </div>

        {metadata?.duration_seconds && (
          <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
            {metadata.duration_seconds}s
          </span>
        )}
      </div>

      {/* Waveform Visualization Simulator */}
      <div className="h-12 bg-zinc-50 rounded-xl border border-zinc-100 p-2.5 flex items-center justify-between gap-1 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const isPassed = (i / 40) * 100 <= progressPercent;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? isPassed
                    ? 'bg-myanmar-red'
                    : 'bg-zinc-300'
                  : isPassed
                  ? 'bg-myanmar-red/80'
                  : 'bg-zinc-200'
              }`}
              style={{
                height: isPlaying ? `${Math.max(20, Math.sin((i + currentTime * 6) * 0.6) * 45 + 50)}%` : `${Math.max(15, (i % 5) * 18 + 20)}%`,
              }}
            />
          );
        })}
      </div>

      {/* Play Controls & Seekbar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-myanmar-red hover:bg-myanmar-red-hover text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer flex-shrink-0 shadow-sm shadow-myanmar-red/20"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
        </button>

        {/* Progress Timeline */}
        <div className="flex-1 space-y-1">
          <input
            type="range"
            min="0"
            max={effectiveDuration || 1}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-14 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Action CTAs: Download & Generate Again */}
      <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        {onGenerateAgain && (
          <button
            type="button"
            onClick={onGenerateAgain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.generateAgainBtn}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.downloadBtn}</span>
        </button>
      </div>

    </div>
  );
};
