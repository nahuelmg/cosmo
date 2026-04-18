'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

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

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, VISIBLE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [index, slides.length]);

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
      className="relative w-full aspect-[21/9] overflow-hidden rounded-md"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
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
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Static overlay — same on every slide per CONTEXT decision */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/45 to-transparent flex flex-col justify-end p-8 md:p-12">
        <h1 className="font-serif text-4xl md:text-5xl text-surface [text-shadow:_0_2px_16px_rgb(0_0_0_/_0.65)]">
          {groupName}
        </h1>
        <p className="text-surface/95 [text-shadow:_0_1px_8px_rgb(0_0_0_/_0.55)]">{tagline}</p>
        <p className="text-surface/80 text-sm [text-shadow:_0_1px_8px_rgb(0_0_0_/_0.55)]">{affiliation}</p>
      </div>

      {/* Controls cluster */}
      <div
        role="group"
        aria-label={t('controls')}
        className="absolute bottom-4 right-4 flex items-center gap-2"
      >
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
