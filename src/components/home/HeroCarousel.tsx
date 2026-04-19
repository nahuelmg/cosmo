'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';

interface Slide {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface HeroCarouselProps {
  slides: Slide[];
  groupName: string;
  tagline: string;
  affiliation: string;
}

const VISIBLE_MS = 7000;
const TRANSITION_MS = 1000;

export default function HeroCarousel({
  slides,
  groupName,
  tagline,
  affiliation,
}: HeroCarouselProps) {
  const t = useTranslations('carousel');
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize isPaused from prefers-reduced-motion so users who opt out of motion
  // start with auto-advance disabled (WAI-ARIA APG carousel pattern).
  const [isPaused, setIsPaused] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Auto-advance timer — gated on isPaused.
  // Uses setTimeout (not setInterval) to avoid drift when the tab is hidden.
  // The visibilitychange effect below calls `setIndex(i => i)` to re-trigger
  // this effect after the tab becomes visible again; that no-op re-run is
  // intentional — do NOT "fix" it — it lets isPaused guard correctly when
  // the tab returns to view.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isPaused) return; // paused = no timer

    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, VISIBLE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [index, slides.length, isPaused]);

  // Pause the timer while the tab is hidden; resume (via effect re-trigger)
  // when visible again — the no-op setIndex call above re-runs the effect,
  // which then correctly skips the timer if isPaused === true.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setIndex((i) => i);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-roledescription="carousel"
      aria-label={t('label')}
      // WAI-ARIA APG: keyboard focus entering the carousel pauses auto-advance
      // so users navigating by Tab are not interrupted by unexpected slide changes.
      onFocus={() => setIsPaused(true)}
      className="relative w-full h-[min(85svh,720px)] md:h-auto md:aspect-[21/9] overflow-hidden rounded-md"
    >
      {/* Live region wraps the slides map so screen readers announce changes
          only when the user has paused (polite), not during auto-advance (off).
          WAI-ARIA APG correction: always-on "polite" causes interruptions every
          7 s; the toggle prevents that. className="contents" has no layout impact
          on the absolutely-positioned slide children. */}
      <div
        id="carousel-slides"
        aria-live={isPaused ? 'polite' : 'off'}
        aria-atomic="false"
        className="contents"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            aria-hidden={i !== index}
            className={[
              'absolute inset-0 transition-opacity duration-1000',
              i === index ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              className="object-cover"
              // Slide 0 is the LCP candidate on Home — use Next.js 16 preload
              // props instead of the deprecated `priority` (RESEARCH.md Pattern 3).
              // Slides 1–2 use default lazy loading (Pitfall #3).
              {...(i === 0 && {
                preload: true,
                loading: 'eager' as const,
                fetchPriority: 'high' as const,
              })}
            />
          </div>
        ))}
      </div>

      {/* Softer scrim — lets the photo breathe while keeping text legible.
          Contrast is carried by tight, high-contrast text-shadows rather than
          a heavy gradient. Pure white (#fff) on a cool neutral reads crisper
          than warm-white against JWST starfields. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 from-0% via-ink/20 via-45% to-transparent to-75% flex flex-col justify-end p-8 md:p-12">
        <h1 className="font-serif font-bold text-4xl md:text-5xl text-stone-200 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.9),_0_2px_8px_rgb(0_0_0_/_0.7)]">
          {groupName}
        </h1>
        <p className="text-stone-200 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.85),_0_1px_6px_rgb(0_0_0_/_0.55)]">{tagline}</p>
        <p className="text-stone-200/90 text-sm [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.85),_0_1px_6px_rgb(0_0_0_/_0.55)]">{affiliation}</p>
      </div>

      {/* Controls cluster — pause/play button leads the dots (visual order: [pause][dot1][dot2][dot3]) */}
      <div
        role="group"
        aria-label={t('controls')}
        className="absolute bottom-4 right-4 flex items-center gap-2"
      >
        {/* Pause/play button — dynamic aria-label (NOT aria-pressed) per WAI-ARIA APG Pitfall #2.
            aria-controls links to the live region so assistive tech can associate the button
            with the element it controls. */}
        <button
          type="button"
          aria-label={isPaused ? t('startCarousel') : t('stopCarousel')}
          aria-controls="carousel-slides"
          onClick={() => setIsPaused((p) => !p)}
          className={[
            'w-6 h-6 flex items-center justify-center rounded',
            'text-surface/90 hover:text-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/70',
            'transition-colors',
          ].join(' ')}
        >
          {isPaused
            ? <Play className="w-3.5 h-3.5" aria-hidden />
            : <Pause className="w-3.5 h-3.5" aria-hidden />
          }
        </button>

        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={t('goToSlide', { n: i + 1 })}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={[
              'w-2.5 h-2.5 rounded-full',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/70',
              'active:scale-95 transition-[background-color,transform] duration-75',
              i === index ? 'bg-surface' : 'bg-surface/50',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

export { HeroCarousel };
export type { Slide, HeroCarouselProps };
export { VISIBLE_MS, TRANSITION_MS };
