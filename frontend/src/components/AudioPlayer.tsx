import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, VolumeX, CheckCircle2, Copy, Check, Sparkles } from 'lucide-react';
import type { TTSResponseMetadata } from '../services/api';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface AudioPlayerProps {
  audioUrl: string | null;
  metadata: TTSResponseMetadata | null;
  onGenerateAgain?: () => void;
  language: Language;
  textToCopy?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  metadata,
  onGenerateAgain,
  language,
  textToCopy,
}) => {
  const t = translations[language].studio;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1.0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
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

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error('Replay error:', e));
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
    const voiceTag = metadata?.voice?.toLowerCase() || 'burmeseatan';
    a.download = `myanmar-ai-voice-${voiceTag}.wav`;
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 font-burmese">
                {metadata?.is_replicated ? t.replicatedVoiceReady : t.readyTitle}
              </h3>
              {metadata?.is_replicated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80 font-mono">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Replicated</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
              <span className="font-semibold text-myanmar-red">{metadata?.voice_name}</span>
              <span>•</span>
              <span className="capitalize">{metadata?.style}</span>
              <span>•</span>
              <span className="capitalize">{metadata?.language}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {metadata?.duration_seconds ? (
            <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200">
              {metadata.duration_seconds}s
            </span>
          ) : null}
          {metadata?.latency_ms ? (
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100 hidden sm:inline">
              ⚡ {(metadata.latency_ms / 1000).toFixed(1)}s
            </span>
          ) : null}
        </div>
      </div>

      {/* Waveform Visualization Simulator with Click-to-Seek */}
      <div 
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          if (effectiveDuration > 0) {
            const targetTime = ratio * effectiveDuration;
            setCurrentTime(targetTime);
            if (audioRef.current) audioRef.current.currentTime = targetTime;
          }
        }}
        title="Click to seek / နေရာရွှေ့ရန် နှိပ်ပါ"
        className="h-14 bg-zinc-50/80 hover:bg-zinc-100/60 rounded-xl border border-zinc-200/80 p-3 flex items-center justify-between gap-1 overflow-hidden cursor-pointer transition-colors"
      >
        {Array.from({ length: 48 }).map((_, i) => {
          const isPassed = (i / 48) * 100 <= progressPercent;
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
                height: isPlaying 
                  ? `${Math.max(20, Math.sin((i + currentTime * 8) * 0.5) * 45 + 50)}%` 
                  : `${Math.max(18, Math.sin(i * 0.35) * 35 + 40)}%`,
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
          className="w-12 h-12 rounded-full bg-myanmar-red hover:bg-myanmar-red-hover text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer flex-shrink-0 shadow-md shadow-myanmar-red/25 focus-ring"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
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

      {/* Playback Speed and Actions Bar */}
      <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 transition-colors cursor-pointer"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'my' ? 'ပြန်ဖွင့်ရန်' : 'Replay'}</span>
          </button>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200 text-xs">
            <span className="text-[10px] text-zinc-400 font-semibold px-1.5">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {textToCopy && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(textToCopy).then(() => {
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 transition-colors cursor-pointer"
              title="Copy synthesized text"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-burmese">{language === 'my' ? 'စာသားကူးယူရန်' : 'Copy text'}</span>
                </>
              )}
            </button>
          )}

          {onGenerateAgain && (
            <button
              type="button"
              onClick={onGenerateAgain}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 transition-colors cursor-pointer"
            >
              <span>{t.generateAgainBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98] focus-ring"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-burmese">{t.downloadBtn}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
