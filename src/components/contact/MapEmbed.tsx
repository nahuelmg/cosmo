'use client';

import { useEffect, useRef, useState } from 'react';

interface MapEmbedProps {
  query: string;        // siteConfig.mapQuery
  fallbackHref: string; // e.g. `https://www.google.com/maps?q=${encodeURIComponent(query)}`
  title: string;        // accessible iframe + fallback-link title (from t('mapTitle'))
}

export default function MapEmbed({ query, fallbackHref, title }: MapEmbedProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] bg-surface-alt rounded overflow-hidden"
    >
      {/* Always-rendered fallback anchor — crawlable in the prerender, works with JS disabled */}
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center text-accent text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {title}
      </a>

      {/* Conditionally mounted iframe after IntersectionObserver fires */}
      {shouldLoad && (
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      )}
    </div>
  );
}

export type { MapEmbedProps };
