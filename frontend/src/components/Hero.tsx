import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Sparkles, Mic } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface HeroProps {
  onStartCreating: () => void;
  onExploreVoices: () => void;
  language: Language;
}

type AnimationPhase = 'typing' | 'holding';

export const Hero: React.FC<HeroProps> = ({ onStartCreating, onExploreVoices, language }) => {
  const t = translations[language].hero;

  // Split headline into exactly two lines
  const lines = useMemo(() => {
    if (language === 'my') {
      return [
        'စာသားများကို သဘာဝကျသော',
        'မြန်မာအသံအဖြစ်သို့ ပြောင်းလဲပါ',
      ];
    }
    return [
      'Turn Your Text Into a',
      'Natural Myanmar Voice...',
    ];
  }, [language]);

  // Segment each line into linguistic grapheme clusters to keep Burmese combining marks intact
  const line1Graphemes = useMemo(() => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        const segmenter = new Intl.Segmenter(language === 'my' ? 'my' : 'en', {
          granularity: 'grapheme',
        });
        return Array.from(segmenter.segment(lines[0]), (s) => s.segment);
      } catch {
        // Fallback
      }
    }
    return Array.from(lines[0]);
  }, [lines, language]);

  const line2Graphemes = useMemo(() => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        const segmenter = new Intl.Segmenter(language === 'my' ? 'my' : 'en', {
          granularity: 'grapheme',
        });
        return Array.from(segmenter.segment(lines[1]), (s) => s.segment);
      } catch {
        // Fallback
      }
    }
    return Array.from(lines[1]);
  }, [lines, language]);

  const totalGraphemes = line1Graphemes.length + line2Graphemes.length;

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [phase, setPhase] = useState<AnimationPhase>('typing');
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return totalGraphemes;
    }
    return 0;
  });

  // Reset when text changes (e.g. language toggle)
  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentIndex(totalGraphemes);
      setPhase('holding');
      return;
    }
    setCurrentIndex(0);
    setPhase('typing');
  }, [totalGraphemes, prefersReducedMotion]);

  // Two-Line Continuous Typewriter Cycle:
  // 1. Line 1 types first, then Line 2 continues naturally (75ms per char)
  // 2. Once Line 2 finishes, hold complete text for exactly 5 seconds (5000ms)
  // 3. Instantly reset to hidden state (no delete animation) and repeat
  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (currentIndex < totalGraphemes) {
        // Smooth typing speed: 75ms per character (between 60–90ms)
        timer = setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 75);
      } else {
        // Both lines completely typed -> hold for 5 seconds
        setPhase('holding');
      }
    } else if (phase === 'holding') {
      // Hold both lines visible for exactly 5 seconds, then instantly reset to empty
      timer = setTimeout(() => {
        setCurrentIndex(0);
        setPhase('typing');
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [currentIndex, phase, totalGraphemes, prefersReducedMotion]);

  const line1Count = Math.min(currentIndex, line1Graphemes.length);
  const line2Count = Math.max(0, currentIndex - line1Graphemes.length);

  const line1Text = prefersReducedMotion
    ? lines[0]
    : line1Graphemes.slice(0, line1Count).join('');

  const line2Text = prefersReducedMotion
    ? lines[1]
    : line2Graphemes.slice(0, line2Count).join('');

  // Exactly ONE cursor at all times:
  // On Line 1 while Line 1 is typing; moves to Line 2 as soon as Line 2 starts
  const isCursorOnLine1 = !prefersReducedMotion && currentIndex <= line1Graphemes.length;
  const isCursorOnLine2 = prefersReducedMotion || currentIndex > line1Graphemes.length;

  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 text-center px-4 sm:px-6 max-w-4xl mx-auto overflow-hidden">
      
      {/* Subtle Myanmar Geometric Acheik Wave Background Texture */}
      <div className="absolute inset-0 bg-acheik-wave pointer-events-none -z-10 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none -z-10" />

      {/* Small top badge with subtle gold border & cultural motif */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-amber-300/60 text-amber-800 text-xs font-semibold mb-6 shadow-2xs">
        <span className="text-amber-500 font-serif">❖</span>
        <span className="font-burmese tracking-wide">{t.badge}</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      </div>

      {/* Main heading: Exactly two lines with stable bounding boxes to prevent any layout shift */}
      <h1 
        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.3] font-burmese text-center space-y-1 sm:space-y-2"
        aria-label={`${lines[0]} ${lines[1]}`}
      >
        {/* LINE 1 */}
        <div className="flex items-center justify-center">
          <span className="inline-block relative text-left max-w-full overflow-hidden align-middle">
            {/* Invisible ghost placeholder establishing exact permanent line 1 bounds */}
            <span 
              className="invisible select-none opacity-0 pointer-events-none whitespace-nowrap block" 
              aria-hidden="true"
            >
              {lines[0]}
              <span className="inline-block ml-0.5">|</span>
            </span>

            {/* Visible text + cursor pinned to left edge of line 1 bounds */}
            <span 
              className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap overflow-hidden select-none"
              aria-hidden="true"
            >
              <span>{line1Text}</span>
              {isCursorOnLine1 && (
                <span 
                  className="inline-block font-normal text-myanmar-red ml-0.5 animate-cursor-blink"
                >
                  |
                </span>
              )}
            </span>
          </span>
        </div>

        {/* LINE 2 */}
        <div className="flex items-center justify-center">
          <span className="inline-block relative text-left max-w-full overflow-hidden align-middle">
            {/* Invisible ghost placeholder establishing exact permanent line 2 bounds */}
            <span 
              className="invisible select-none opacity-0 pointer-events-none whitespace-nowrap block" 
              aria-hidden="true"
            >
              {lines[1]}
              <span className="inline-block ml-0.5">|</span>
            </span>

            {/* Visible text + cursor pinned to left edge of line 2 bounds */}
            <span 
              className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap overflow-hidden select-none"
              aria-hidden="true"
            >
              <span>{line2Text}</span>
              {isCursorOnLine2 && (
                <span 
                  className="inline-block font-normal text-myanmar-red ml-0.5 animate-cursor-blink"
                >
                  |
                </span>
              )}
            </span>
          </span>
        </div>
      </h1>

      {/* Description */}
      <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-[1.8] font-burmese">
        {t.subtitle}
      </p>

      {/* Action buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onStartCreating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm bg-myanmar-red hover:bg-myanmar-red-hover text-white transition-all cursor-pointer shadow-md shadow-myanmar-red/25 hover:shadow-lg hover:shadow-myanmar-red/35 active:scale-[0.98] font-burmese focus-ring"
        >
          <span>{t.startCreating}</span>
          <ArrowRight className="w-4 h-4 text-amber-200" />
        </button>

        <button
          onClick={onExploreVoices}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white hover:bg-amber-50/40 text-zinc-700 border border-zinc-200 hover:border-amber-300/80 transition-all cursor-pointer shadow-2xs font-burmese focus-ring"
        >
          <Mic className="w-4 h-4 text-amber-600" />
          <span>{t.exploreVoices}</span>
        </button>
      </div>

      {/* Refined traditional Kanote-inspired divider with gold lotus-bud/diamond motif */}
      <div className="mt-16 flex items-center justify-center gap-3 opacity-70">
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-zinc-300 to-amber-300" />
        <span className="text-[10px] text-amber-600 select-none">❖</span>
        <div className="w-20 h-[1px] bg-gradient-to-l from-transparent via-zinc-300 to-amber-300" />
      </div>

    </section>
  );
};
