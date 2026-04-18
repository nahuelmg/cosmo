# Phase 4: Core Pages — Research

**Researched:** 2026-04-18
**Domain:** Next.js 16 App Router page components, content-layer consumption, bilingual rendering, hero carousel, people routing, lazy-loaded map embed
**Confidence:** HIGH (codebase directly inspected; all accessor APIs and types read from source)

---

## Summary

Phase 4 builds seven page routes on top of a fully verified content layer (Phase 2) and layout shell (Phase 3). The foundational question — "what do the content accessors actually look like?" — is answered by direct inspection of the source; there are no assumptions below.

The single most important finding: **the content layer barrel `@/content` provides all data, all types, and the `localize()` helper in one import.** Pages are pure Server Components that call localized accessors and pass plain strings to presentational children. Interactive pieces (carousel, map, pause button) are isolated `'use client'` leaf components.

No npm packages need to be added for Phase 4. The carousel is hand-rolled with CSS transitions and `useEffect` — a 15-line state machine. The map is a bare `<iframe>` conditionally mounted by an `IntersectionObserver` client component. Email obfuscation reuses the already-shipped `<EmailLink>` component from Phase 3 (`src/components/ui/EmailLink.tsx`). Lucide React (icon library) is the **one potential addition** — needed only if Research page icons come from Lucide; the `icon` field in `research.json` uses names like `"atom"`, `"waves"`, `"sparkles"`, `"cpu"` which match Lucide icon names.

The hero carousel has two existing placeholder images: `public/Portadas/portada_1.jpg` and `public/Portadas/portada_2.png`. A third image is needed to meet the 3–5 slide requirement.

**Primary recommendation:** All pages are server-rendered RSC shells with `'use client'` leaves for carousel, map, and pause button only. Import everything from `@/content`. Reuse `<EmailLink>` for all obfuscated email surfaces. Add `lucide-react` for Research page icons.

---

## Content-Layer API (EXACT — read from source)

This is the load-bearing section. All function signatures and return types come from the verified source files.

### Import surface

```typescript
// All pages import exclusively from here — never from "@/content/accessors/*"
import {
  getPeople, getPeopleByCategory, getPersonBySlug,
  getLocalizedPerson, getLocalizedPeople,
  getPublications, getPublicationsByYear, getPublicationsByTopic,
  getPublicationById, getAllTopics, getAllYears,
  getResearchAreas, getResearchAreaById, getLocalizedResearchAreas,
  getJournalClub, getUpcomingSessions, getPastSessionsByYear,
  getLocalizedSession,
  getOutreach, getOutreachByType, getLocalizedOutreach,
  localize, siteConfig,
  type Person, type Publication, type ResearchArea,
  type JournalClubSession, type OutreachActivity,
  type Locale,
} from "@/content";
```

Source: `src/content/index.ts`

### People accessors

```typescript
// Returns full Person[] in authoring order (bilingual fields NOT resolved)
getPeople(): Person[]

// Returns filtered by category
getPeopleByCategory(category: 'pi' | 'postdoc' | 'phd' | 'undergrad' | 'past'): Person[]

// Returns single Person or undefined
getPersonBySlug(slug: string): Person | undefined

// Returns Person with bilingual fields resolved to plain strings
// role, short_bio, full_bio → string; research_interests → string[]
// thesis_topic, current_position → string | undefined
getLocalizedPerson(slug: string, locale: Locale): LocalizedPerson | undefined

// Returns all people with bilingual fields resolved
getLocalizedPeople(locale: Locale): LocalizedPerson[]
```

Source: `src/content/accessors/people.ts`

**People list page usage:** Call `getLocalizedPeople(locale)` once; filter by `p.category` in the render loop. No per-category accessor needed in the page — the page groups by category.

**People detail page usage:** Call `getLocalizedPerson(slug, locale)`. Returns `undefined` if slug not found — trigger `notFound()`.

### Person type shape (post-localization)

```typescript
type LocalizedPerson = {
  slug: string                    // "esteban-calzetta"
  name: string                    // canonical, never bilingual
  role: string                    // resolved: "Principal Investigator"
  category: 'pi'|'postdoc'|'phd'|'undergrad'|'past'
  photo?: string                  // "people/Esteban_C.png" — relative to public/
  short_bio: string               // resolved
  full_bio: string                // resolved, may contain \n\n paragraph breaks
  research_interests: string[]    // resolved
  publications_selected: string[] // IDs referencing publications.json
  contact: {
    email?: string
    orcid?: string                // "0000-0002-1825-0097"
    office?: string
    scholar?: string              // full URL
  }
  social_links: Array<{
    platform: 'twitter'|'linkedin'|'github'|'orcid'|'scholar'|'website'|'bluesky'|'instagram'
    url: string
  }>
  years?: { start: number; end?: number }           // required for 'past'
  thesis_topic?: string           // resolved, required for 'undergrad'
  current_position?: string       // resolved, optional
}
```

**Past member display format**: `name — position, years.start–years.end` (years.end may be absent for ongoing).

**Note on `full_bio`**: Contains `\n\n`-separated paragraphs in the raw string. The page must split on `\n\n` and render each as a `<p>` tag, or use `whitespace-pre-line` CSS. Do NOT use `dangerouslySetInnerHTML`.

### Publications accessors

```typescript
// All pubs sorted year descending (newest first)
getPublications(): Publication[]

// Filter by year
getPublicationsByYear(year: number): Publication[]

// Filter by topic tag (case-sensitive)
getPublicationsByTopic(tag: string): Publication[]

// By stable id
getPublicationById(id: string): Publication | undefined

// For filter UI (PUBS-04, DEFERRED — do not use in Phase 4)
getAllTopics(): string[]

// All years descending — USE THIS to drive year-grouping
getAllYears(): number[]
```

Source: `src/content/accessors/publications.ts`

**Publications page usage:** Call `getAllYears()` to get `[2026, 2025, 2024]`. For each year render an H2 header, then `getPublicationsByYear(year)` for entries. Or: call `getPublications()` once (already sorted desc) and group in render by `p.year`.

### Publication type shape

```typescript
type Publication = {
  id: string               // stable kebab-case, e.g. "2025-sigma8-cmb-lensing-cross"
  authors: string[]        // ["Rodríguez, M.", "Gómez, L.", ...]
  title: string            // canonical, may contain Greek: σ₈, H₀, Λ-CDM
  journal: string          // "Phys. Rev. D" or "Preprint"
  year: number
  arxiv?: string           // bare "2502.07341" — build https://arxiv.org/abs/{arxiv}
  doi?: string             // bare "10.1088/..." — build https://doi.org/{doi}
  topic_tags: string[]
  abstract?: string
}
```

**Link construction**: `https://arxiv.org/abs/${pub.arxiv}` and `https://doi.org/${pub.doi}`. Never store full URL; always construct.

### Research accessors

```typescript
getResearchAreas(): ResearchArea[]          // sorted by order asc
getResearchAreaById(id: string): ResearchArea | undefined
getLocalizedResearchAreas(locale: Locale): LocalizedResearchArea[]
```

Source: `src/content/accessors/research.ts`

### ResearchArea type shape (post-localization)

```typescript
type LocalizedResearchArea = {
  id: string           // "dark-matter", "gravitational-waves", "early-universe", "artificial-intelligence"
  title: string        // resolved
  short_description: string  // 1-2 sentences, for grid card
  full_description: string   // 1-3 paragraphs, for future detail surface (not used in Phase 4)
  icon?: string        // Lucide icon name: "atom", "waves", "sparkles", "cpu"
  image?: string       // optional photo path relative to public/
  order: number
}
```

**Icon names**: `atom`, `waves`, `sparkles`, `cpu` — these are exact Lucide icon names. Add `lucide-react` to render them.

### Journal Club accessors

```typescript
// upcoming sessions sorted date ascending (soonest first)
getUpcomingSessions(): JournalClubSession[]

// past sessions grouped by academic_year: { "2024-2025": [...], "2023-2024": [...] }
// within each group: sorted date descending (most recent first)
getPastSessionsByYear(): Record<string, JournalClubSession[]>

// resolves optional `notes` bilingual field for display
getLocalizedSession(session: JournalClubSession, locale: Locale): LocalizedSession
```

Source: `src/content/accessors/journal-club.ts`

### JournalClubSession type shape

```typescript
type JournalClubSession = {
  id: string            // stable, used as React key + anchor
  date: string          // "YYYY-MM-DD"
  status: 'upcoming' | 'past'
  speaker: string       // canonical name, e.g. "Prof. Licia Verde"
  affiliation: string   // canonical institution
  title: string         // paper title, paper-native language
  paper_link?: string   // full URL (arXiv/DOI/journal)
  notes?: { es: string; en: string }   // before getLocalizedSession call
  academic_year?: string  // "2024-2025" — guaranteed present on past sessions
}
// after getLocalizedSession():
// notes → string | undefined
```

**Page structure**: Two sections — "Upcoming" (from `getUpcomingSessions()`) and "Past Sessions" (from `getPastSessionsByYear()`). The past section iterates `Object.entries(grouped)`, sorted by academic year key descending.

**Academic year key sort**: `Object.entries(getPastSessionsByYear()).sort(([a], [b]) => b.localeCompare(a))` gives newest-first. The key format is `"YYYY-YYYY"` so lexicographic sort is correct.

### Outreach accessors

```typescript
// all activities sorted date descending (newest first)
getOutreach(): OutreachActivity[]

// filter by type
getOutreachByType(type: OutreachActivity['type']): OutreachActivity[]

// resolves title + description to plain strings
getLocalizedOutreach(locale: Locale): LocalizedOutreachActivity[]
```

Source: `src/content/accessors/outreach.ts`

### OutreachActivity type shape (post-localization)

```typescript
type LocalizedOutreachActivity = {
  id: string
  date: string      // "YYYY-MM-DD"
  type: 'talk' | 'workshop' | 'school-visit' | 'article' | 'interview' | 'video'
  title: string     // resolved
  description: string  // resolved
  image?: string    // optional, relative to public/
  link?: string     // optional full URL — hide when absent (OTRCH-03)
}
```

### siteConfig shape

```typescript
siteConfig = {
  groupName: "Grupo de Cosmología",        // canonical Spanish, used on all pages
  tagline: { es: string; en: string },
  affiliations: Array<{
    name: { es: string; en: string };
    url?: string;
  }>,
  contactEmail: "cosmologia@df.uba.ar",    // split on "@" before passing to <EmailLink>
  socialLinks: SocialLink[],               // currently empty array
}
```

Source: `src/config/site.ts`

### localize() utility

```typescript
// Pick locale-specific string from any { es: string; en: string } object
localize<T extends { es: string; en: string }>(field: T, locale: Locale): string
```

Use this when you need to pull a bilingual field that isn't covered by a localized accessor (e.g., `siteConfig.tagline`).

### i18n: missing-message behaviour

From `src/i18n/request.ts`: when a key is missing, in development it returns `"namespace.key [missing]"` string (with console warning). In production it returns `"namespace.key"` — no crash, no fallback to the other locale. I18N-02 ("no mixed-language fallback") is enforced by the requirement that all page-copy keys exist in both `messages/es.json` and `messages/en.json`. The `pnpm check-translations` script enforces parity at CI time.

**For Phase 4**: Each page's UI-copy strings (section headings, labels like "Research Interests", "Publications", "Email", "Office") must be added to both `messages/es.json` and `messages/en.json`. Content data strings (bios, titles, descriptions) come from the content layer — already bilingual by schema.

---

## File Layout

### Page routes

```
src/app/[locale]/
├── page.tsx                          # Home — REPLACE placeholder
├── people/
│   └── page.tsx                      # People list
│   └── [slug]/
│       └── page.tsx                  # People detail
├── research/
│   └── page.tsx                      # Research (4-area grid)
├── publications/
│   └── page.tsx                      # Publications (year-grouped)
├── journal-club/
│   └── page.tsx                      # Journal Club
├── outreach/
│   └── page.tsx                      # Outreach
└── contact/
    └── page.tsx                      # Contact
```

**Localised path mapping** is already wired in `src/i18n/routing.ts`:
- `/people` → es: `/personas`, en: `/people`
- `/people/[slug]` → es: `/personas/[slug]`, en: `/people/[slug]`
- `/research` → es: `/investigacion`, en: `/research`
- etc.

Next.js App Router uses the **internal key** (`/people`) as the filesystem path. next-intl's `Link` and `router` handle URL translation. The filesystem path is always the internal key, never the translated slug.

### Components — server vs client split

```
src/components/
├── home/
│   └── HeroCarousel.tsx              # 'use client' — timer, pause, visibility
├── people/
│   └── PersonCard.tsx                # server — clickable card (pi/postdoc/phd)
│   └── PersonRow.tsx                 # server — text-only row (undergrad/past)
│   └── PeopleSection.tsx             # server — H2 + grid/list for one category
├── research/
│   └── ResearchGrid.tsx              # server — 4-area grid
│   └── ResearchCard.tsx              # server — icon + title + description
├── publications/
│   └── PublicationEntry.tsx          # server — single pub (authors/title/links)
│   └── PublicationsYearGroup.tsx     # server — H2 + list for one year
├── journal-club/
│   └── SessionRow.tsx                # server — single session row
│   └── JournalClubArchive.tsx        # server — past sessions year groups
├── outreach/
│   └── OutreachCard.tsx              # server — activity card
├── contact/
│   └── MapEmbed.tsx                  # 'use client' — IntersectionObserver gated
└── ui/
    └── EmailLink.tsx                 # ALREADY EXISTS — 'use client', reuse as-is
    └── EmailLinkInner.tsx            # ALREADY EXISTS — do not modify
```

**Lean toward server components.** Only `HeroCarousel.tsx` and `MapEmbed.tsx` are `'use client'`. `EmailLink.tsx` already exists as `'use client'` and is imported by server components safely (the import boundary is the server component; the EmailLink subtree stays client-only).

---

## Architecture Patterns

### Pattern 1: RSC page with locale resolution

```typescript
// src/app/[locale]/research/page.tsx
import { getLocalizedResearchAreas } from "@/content";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ResearchGrid } from "@/components/research/ResearchGrid";

type Locale = (typeof routing.locales)[number];

type Props = { params: Promise<{ locale: Locale }> };

export default async function ResearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const areas = getLocalizedResearchAreas(locale);
  return <ResearchGrid areas={areas} />;
}
```

**Key points:**
- `params` is a `Promise` in Next.js 16 — await before use (same pattern as existing `page.tsx`).
- `setRequestLocale(locale)` must be called in every RSC that reads translations.
- Call localized accessors here; pass resolved data to components (no accessor calls inside components).

### Pattern 2: Dynamic route with generateStaticParams

```typescript
// src/app/[locale]/people/[slug]/page.tsx
import { getPeople, getLocalizedPerson } from "@/content";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  const people = getPeople();
  // Only pi/postdoc/phd categories get detail pages; undergrad/past are non-clickable
  const clickable = people.filter(p =>
    p.category === 'pi' || p.category === 'postdoc' || p.category === 'phd'
  );
  return routing.locales.flatMap(locale =>
    clickable.map(p => ({ locale, slug: p.slug }))
  );
}

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export default async function PersonDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const person = getLocalizedPerson(slug, locale);
  if (!person) notFound();

  // undergrad/past should never reach here (not in generateStaticParams)
  // but guard defensively in case of direct URL access
  if (person.category === 'undergrad' || person.category === 'past') notFound();

  return <PersonDetail person={person} locale={locale} />;
}
```

**Slug source**: slugs come from `Person.slug` (e.g., `"esteban-calzetta"`). All 20 people have unique slugs (verified in Phase 2). Only pi/postdoc/phd categories (13 out of 20) get static params.

**404 behaviour**: Undergrad/past slugs accessed directly → `notFound()` → 404 page. Not-found slug → `getLocalizedPerson` returns `undefined` → `notFound()`.

### Pattern 3: Hero Carousel (hand-rolled)

No library. State machine: index (0..N-1), isPaused (bool), direction (for CSS transition classes).

```typescript
// src/components/home/HeroCarousel.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
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

export function HeroCarousel({ slides, groupName, tagline, affiliation }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations('carousel');

  // Respect prefers-reduced-motion — also check on mount
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const advance = useCallback(() => {
    setIndex(i => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    // pause if reduced motion preference OR manual pause
    if (prefersReduced || isPaused) return;

    timerRef.current = setTimeout(advance, VISIBLE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, isPaused, prefersReduced, advance]);

  // Pause on document.hidden (tab-away)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
      // Timer restarts naturally via the index/isPaused effect when tab returns
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden" aria-roledescription="carousel">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={[
            'absolute inset-0 transition-opacity',
            `duration-[${TRANSITION_MS}ms]`,
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

      {/* Static overlay — same every slide (CONTEXT decision) */}
      <div className="absolute inset-0 bg-ink/40 flex flex-col justify-end p-8 md:p-12">
        <h1 className="font-serif text-4xl md:text-5xl text-surface font-semibold">
          {groupName}
        </h1>
        <p className="mt-2 text-surface/90 text-lg">{tagline}</p>
        <p className="mt-1 text-surface/70 text-sm">{affiliation}</p>
      </div>

      {/* Controls cluster — bottom-right, single focus group (CONTEXT decision) */}
      <div
        role="group"
        aria-label={t('controls')}
        className="absolute bottom-4 right-4 flex items-center gap-2"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('goToSlide', { n: i + 1 })}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className={[
              'w-2 h-2 rounded-full transition-colors',
              i === index ? 'bg-surface' : 'bg-surface/50',
            ].join(' ')}
          />
        ))}
        <button
          type="button"
          aria-label={isPaused ? t('play') : t('pause')}
          aria-pressed={isPaused}
          onClick={() => setIsPaused(p => !p)}
          className="ml-1 p-1 text-surface/80 hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface/60 rounded"
        >
          {/* Inline SVG pause/play icon — no library dependency for a 2-path icon */}
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
      </div>
    </div>
  );
}
```

**Hydration safety**: Initial `useState(0)` is deterministic — no mismatch risk. The `prefersReduced` check uses `typeof window !== 'undefined'` guard for SSR safety, but since this is a `'use client'` component, the server render is minimal (the client takes over immediately).

**Cross-fade implementation**: CSS `transition-opacity duration-[1000ms]` with absolute-positioned slides layered by z-index via opacity. The departing slide fades out while the incoming fades in. No JS animation loop needed.

**Slide images**: `public/Portadas/portada_1.jpg` and `public/Portadas/portada_2.png` already exist. A third placeholder is needed. The planner should add a third image to `public/Portadas/` (e.g. copy one and rename, or use a solid-color SVG placeholder).

**WCAG-AA on overlay text**: `bg-ink/40` over landscape photos may not guarantee AA contrast. Use `bg-ink/50` or higher. Alternatively, use a gradient (`bg-gradient-to-t from-ink/60 to-transparent`) for aesthetic reasons while ensuring the text-adjacent area has sufficient coverage. Contrast must be verified empirically with the actual photos.

**`aria-roledescription="carousel"`**: Announced to screen readers. Each slide wrapper has `aria-hidden={i !== index}` so only the active slide is exposed to AT.

### Pattern 4: People list — server component grouping

```typescript
// src/app/[locale]/people/page.tsx (simplified)
import { getLocalizedPeople } from "@/content";
import { setRequestLocale } from "next-intl/server";

const CLICKABLE_CATEGORIES = ['pi', 'postdoc', 'phd'] as const;
const NON_CLICKABLE_CATEGORIES = ['undergrad', 'past'] as const;
const ORDER: Person['category'][] = ['pi', 'postdoc', 'phd', 'undergrad', 'past'];

export default async function PeoplePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const people = getLocalizedPeople(locale);

  // Group in page, pass per-category arrays to section components
  const byCategory = ORDER.map(cat => ({
    category: cat,
    people: people.filter(p => p.category === cat),
  })).filter(g => g.people.length > 0);

  return (
    <main>
      {byCategory.map(({ category, people }) =>
        CLICKABLE_CATEGORIES.includes(category as any) ? (
          <PeopleSection key={category} category={category} people={people} />
        ) : (
          <PeoplePlainSection key={category} category={category} people={people} />
        )
      )}
    </main>
  );
}
```

**Card vs. row divergence (CONTEXT decision)**: `PersonCard` (clickable) is a large card with square photo, name, role, hover lift. `PersonRow` (non-clickable) is a plain text row with no card container, no hover state, no photo. The visual gap between these must be maximal — different typography size, indentation, and no box styling on rows.

### Pattern 5: Year-grouped list (Publications + Journal Club)

There is no existing shared `YearGroupedList` component. The pattern is simple enough that it does not need to be abstracted into a shared component — it would add a generic props API for minimal benefit. Implement inline in each page's RSC.

```typescript
// Publications page — inline year grouping
const years = getAllYears();  // [2026, 2025, 2024]

return (
  <section>
    {years.map(year => (
      <div key={year}>
        <h2>{year}</h2>
        {getPublicationsByYear(year).map(pub => (
          <PublicationEntry key={pub.id} publication={pub} />
        ))}
      </div>
    ))}
  </section>
);

// Journal Club past sessions — same pattern with academic_year
const grouped = getPastSessionsByYear();
const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

return (
  <section>
    {sortedYears.map(year => (
      <div key={year}>
        <h2>{year}</h2>
        {grouped[year].map(session => (
          <SessionRow key={session.id} session={getLocalizedSession(session, locale)} />
        ))}
      </div>
    ))}
  </section>
);
```

### Pattern 6: Lazy-loaded Google Maps iframe

```typescript
// src/components/contact/MapEmbed.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface MapEmbedProps {
  query: string;         // e.g. "Ciudad Universitaria, Buenos Aires"
  fallbackHref: string;  // e.g. "https://maps.google.com/?q=Ciudad+Universitaria"
  title: string;         // accessible iframe title
}

export function MapEmbed({ query, fallbackHref, title }: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

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
      { rootMargin: '200px' }  // start loading 200px before viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div ref={containerRef} className="relative w-full aspect-[16/9] bg-surface-alt rounded overflow-hidden">
      {/* Fallback link — always rendered, crawlable, used if JS/iframe blocked */}
      <a
        href={fallbackHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center text-accent text-sm underline"
      >
        {title}
      </a>

      {/* iframe mounted only after IntersectionObserver fires */}
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
```

**SSR safety**: `IntersectionObserver` is only accessed inside `useEffect` (client-side only). `shouldLoad` initialises `false` so server render emits only the fallback link. No `window` access at module level.

**Zero LCP impact**: The iframe mounts after the container nears the viewport. The parent page's above-the-fold content (address, email, social links) is server-rendered and requires no JS. The address section renders first and is fully crawlable.

**Google Maps embed URL format**: `https://www.google.com/maps?q=<encoded-query>&output=embed`. No API key required. Confirmed to work for address-based queries (lat/lng also accepted). The `loading="lazy"` attribute on the iframe is redundant here (IntersectionObserver already gates mount) but harmless.

**Scroll-zoom quirk**: The standard embed is fully interactive including scroll-zoom. This can trap keyboard/touch scrolling. Mitigation: no `pointer-events-none` wrapper (that would break interaction). Users may need to click inside the map to enable scroll-zoom. This is standard Google Maps embed behaviour — do not block it.

### Pattern 7: Email obfuscation (reuse existing)

The Phase 3 `<EmailLink>` component is already complete and correct. **Do not re-implement.** Reuse as-is.

```typescript
// Already exists at src/components/ui/EmailLink.tsx
import { EmailLink } from "@/components/ui/EmailLink";

// Usage (same for People detail and Contact page):
const [user, domain] = person.contact.email!.split('@');
// or for siteConfig:
const [user, domain] = siteConfig.contactEmail.split('@');

<EmailLink user={user} domain={domain} />
// Renders: <a href="mailto:user@domain">user@domain</a>
// Server prerender: empty placeholder (ssr: false)
// No mailto: literal in HTML source
```

**Guard for missing email**: `person.contact.email` is optional. Only render `<EmailLink>` when the field is present.

### Pattern 8: ORCID and Google Scholar links

```typescript
// ORCID profile URL
const orcidUrl = `https://orcid.org/${person.contact.orcid}`;
// person.contact.orcid is already the bare ID: "0000-0001-7842-3105"
// person.social_links may also include {platform: 'orcid', url: '...'} — prefer social_links URL

// Google Scholar URL
// person.contact.scholar is already a full URL: "https://scholar.google.com/citations?user=..."

// Accessibility: external links that open in new tab must have visible indicator + sr text
<a
  href={orcidUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${person.name} — ORCID profile (opens in new tab)`}
>
  ORCID
  <ExternalLinkIcon aria-hidden="true" className="inline ml-1 w-3 h-3" />
</a>
```

**Link text conventions for academic profiles**:
- ORCID: "ORCID" or the bare ID "0000-0001-7842-3105" (ID is more informative)
- Google Scholar: "Google Scholar"
- Both should open in new tab with `target="_blank"` + visible indicator

---

## Standard Stack

No new packages are strictly required for Phase 4 functionality. One addition is recommended:

### Core (already installed)

| Library | Version | Purpose |
|---------|---------|---------|
| next | 16.2.4 | App Router, next/image, generateStaticParams, notFound |
| react | 19.2.4 | useState, useEffect, useRef, useCallback |
| next-intl | 4.9.1 | useTranslations, setRequestLocale, hasLocale |
| tailwindcss | 4.x | All styling |
| @radix-ui/react-dialog | 1.1.15 | Already installed (mobile nav) — not needed for Phase 4 |

### Recommended addition

| Library | Purpose | Why |
|---------|---------|-----|
| lucide-react | Research page icons | `research.json` icon field uses Lucide names: "atom", "waves", "sparkles", "cpu". Lucide is the de facto React icon library, tree-shakeable, no config needed. Alternative: SVG inline for 4 icons — feasible but more maintenance. |

**Installation if adding:**
```bash
pnpm add lucide-react
```

**If lucide-react is rejected**: Inline 4 SVG icons directly in `ResearchCard.tsx`. The icon names in `research.json` are still useful as identifiers to switch on.

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled carousel | embla-carousel-react | embla is excellent but 8KB gzipped for a 15-line use case. This carousel is simple: no drag, no touch swipe needed for an academic site. Hand-roll is appropriate. |
| IntersectionObserver (map) | `loading="lazy"` on iframe alone | `loading="lazy"` is sufficient in modern browsers but doesn't give React control over mount. IntersectionObserver + conditional mount provides a clean React pattern and ensures zero pre-fetch. |
| `lucide-react` | heroicons, phosphor | All valid; lucide matches the icon names already in research.json. |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email obfuscation | Another obfuscation component | `src/components/ui/EmailLink.tsx` (already exists) | Phase 3 already built and verified this |
| Focus trap (if needed) | Custom trap | `@radix-ui/react-dialog` (already installed) | Already installed; tested with React 19 |
| Image optimization | `<img>` tags | `next/image` with `fill` + `sizes` | Automatic WebP/AVIF, lazy loading, LCP priority |
| Locale-aware links | `<a href="/es/investigacion">` | `<Link href="/research">` from `@/i18n/navigation` | next-intl translates the path automatically |

---

## Common Pitfalls

### Pitfall 1: Client/server boundary with `useTranslations`

**What goes wrong**: Using `useTranslations` in a Server Component (`async` function) causes a build error. Server Components must use `getTranslations` from `next-intl/server`.

**How to avoid**:
- Server Component (async page/component): `import { getTranslations } from 'next-intl/server'; const t = await getTranslations('namespace');`
- Client Component (`'use client'`): `import { useTranslations } from 'next-intl'; const t = useTranslations('namespace');`
- Pattern: keep page-level Server Components server-only. Pass translated strings as props to client components when needed, or use `useTranslations` in the client leaf directly.

### Pitfall 2: `next/image` `sizes` attribute for carousel

**What goes wrong**: Without a `sizes` attribute, Next.js generates a conservative srcset that may fetch larger images than needed.

**How to avoid**:
- Hero carousel (100vw): `sizes="100vw"` — correct.
- People cards (3-up desktop / 2-up tablet / 1-up mobile): `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"`.
- The `fill` prop is correct for the carousel (replaces `width`/`height` when using `position: absolute`).

### Pitfall 3: `photo` path in `next/image` src

**What goes wrong**: Content data stores photo paths as `"people/Esteban_C.png"` (no leading slash). `next/image` requires `/people/Esteban_C.png` (leading slash).

**How to avoid**: Prefix the path: `src={`/${person.photo}`}` when the photo exists. Guard for undefined:
```typescript
{person.photo && <Image src={`/${person.photo}`} ... />}
```

### Pitfall 4: `full_bio` paragraph rendering

**What goes wrong**: Rendering `person.full_bio` as a single string produces one wall of text. The `\n\n`-separated paragraphs need to be split.

**How to avoid**: Split on `\n\n` and render each as `<p>`:
```typescript
{person.full_bio.split('\n\n').map((para, i) => (
  <p key={i}>{para}</p>
))}
```
Never use `dangerouslySetInnerHTML`. The content is plain text, no HTML.

### Pitfall 5: `generateStaticParams` must cover both locales

**What goes wrong**: Returning only `{ slug }` without `locale` means the static params are locale-unaware. Next.js App Router with `[locale]/[slug]` requires both segments.

**How to avoid**: Always return `{ locale, slug }` pairs:
```typescript
export function generateStaticParams() {
  return routing.locales.flatMap(locale =>
    people.map(p => ({ locale, slug: p.slug }))
  );
}
```

### Pitfall 6: `IntersectionObserver` in SSR

**What goes wrong**: Accessing `IntersectionObserver` at module level or in component body (outside `useEffect`) throws on the server because `window` / `IntersectionObserver` are not defined.

**How to avoid**: All `IntersectionObserver` usage lives inside `useEffect`. The `MapEmbed` component is already `'use client'` so server render is minimal, but the pattern must still be correct for the hydration phase.

### Pitfall 7: Carousel hydration mismatch

**What goes wrong**: If any carousel state or rendering logic reads from `window` or `document` during the initial render (before hydration), React will throw a hydration mismatch warning.

**How to avoid**: `useState(0)` as initial index is safe — deterministic. The `prefersReduced` check uses `typeof window !== 'undefined'` guard. The `useEffect` for the timer only runs client-side. Server render shows slide 0 without any interactive behaviour.

### Pitfall 8: `setRequestLocale` must be called in every async Server Component

**What goes wrong**: Next.js 16 static rendering requires `setRequestLocale(locale)` at the top of every async Server Component that reads the locale from params. Omitting it causes the page to fall back to dynamic rendering.

**How to avoid**: The existing `page.tsx` pattern shows the correct call. Replicate for every new page:
```typescript
const { locale } = await params;
setRequestLocale(locale);
```

### Pitfall 9: Undergrad/past people in `generateStaticParams`

**What goes wrong**: Including undergrads and past members in `generateStaticParams` generates static pages at `/people/past-member-slug` that should not exist. Clicking a text row for a non-clickable person should have no link at all.

**How to avoid**: Filter in `generateStaticParams` to only `pi | postdoc | phd`. The text rows for undergrads/past have no `<a>` wrapper. If someone accesses the URL directly, the `category` guard in the page fires `notFound()`.

### Pitfall 10: Google Maps embed `&output=embed` is required

**What goes wrong**: `https://www.google.com/maps?q=query` without `&output=embed` renders the full Google Maps page, not an embeddable frame.

**How to avoid**: Always append `&output=embed`:
```
https://www.google.com/maps?q=Ciudad+Universitaria+Buenos+Aires&output=embed
```

---

## i18n Message Keys Needed (Phase 4 additions)

All UI labels that are not content-layer strings must be added to both `messages/es.json` and `messages/en.json`. Content-layer strings (bios, descriptions, titles) are already bilingual via schema.

Proposed additions to messages files:

```json
{
  "home": {
    "intro": "...",
    "highlights": "Destacados"
  },
  "people": {
    "title": "Personas / People",
    "pi": "Investigadores Principales / Principal Investigators",
    "postdoc": "Investigadores Postdoctorales / Postdoctoral Researchers",
    "phd": "Estudiantes de Doctorado / PhD Students",
    "undergrad": "Estudiantes de Grado / Undergraduate Students",
    "past": "Miembros Anteriores / Past Members",
    "researchInterests": "Líneas de investigación / Research Interests",
    "selectedPublications": "Publicaciones seleccionadas / Selected Publications",
    "email": "Correo / Email",
    "office": "Oficina / Office",
    "orcid": "ORCID",
    "scholar": "Google Scholar"
  },
  "carousel": {
    "controls": "Controles del carrusel / Carousel controls",
    "pause": "Pausar / Pause",
    "play": "Reproducir / Play",
    "goToSlide": "Ir a la diapositiva {n} / Go to slide {n}"
  },
  "publications": {
    "title": "Publicaciones / Publications",
    "arXiv": "arXiv",
    "doi": "DOI",
    "preprint": "Preprint"
  },
  "journalClub": {
    "title": "Journal Club",
    "upcoming": "Próximas sesiones / Upcoming Sessions",
    "past": "Archivo / Archive",
    "paperLink": "Artículo / Paper"
  },
  "outreach": {
    "title": "Divulgación / Outreach",
    "learnMore": "Más información / Learn more"
  },
  "contact": {
    "title": "Contacto / Contact",
    "address": "Dirección / Address",
    "email": "Correo electrónico / Email",
    "mapTitle": "Ubicación en el mapa / Map location",
    "viewOnMaps": "Ver en Google Maps / View on Google Maps"
  },
  "research": {
    "title": "Investigación / Research"
  }
}
```

Exact wording is Claude's discretion — these are starting points. The planner should add them to both locale files with correct Spanish and English.

---

## Hero Carousel: Slide Data

The Home page needs 3–5 slides. Available in `public/Portadas/`:
- `portada_1.jpg`
- `portada_2.png`

A third image is needed. Options:
1. Copy one of the existing images with a new name (quick placeholder).
2. Generate a solid-color landscape PNG (1920×1080) as a placeholder.
3. Use the group logo as the third slide background with a different overlay colour.

The planner must include a task to add the third placeholder image.

Slide alt text should describe the scene (or be empty `""` if purely decorative, since the overlay carries the text content). Given the overlay contains all meaningful text, `alt=""` on the landscape photos is defensible per WCAG (decorative image).

---

## People Category Counts (from verified people.json)

- PI: 5 (Esteban Calzetta, Susana Landau, Maria Guadalupe Gonzalez Rios-Molina, Diana Lopez Nacir, Gonzalo Sanchez Contreras)
- Postdoc: 2 (Matias Luna, + 1 more)
- PhD: 6
- Undergrad: 3
- Past: 4

Total: 20 people. 8 have photos. 13 (pi+postdoc+phd) get detail pages.

---

## Open Questions

### 1. Third carousel image

- What we know: 2 images exist in `public/Portadas/`
- What's unclear: Whether a third real image exists elsewhere in the repo
- Recommendation: Planner adds a task to create `public/Portadas/portada_3.jpg` as a placeholder (copy of portada_1 with different filename, or a solid-color PNG)

### 2. `lucide-react` approval

- What we know: Research area icons use Lucide icon names in the data
- What's unclear: Whether the user prefers to add lucide-react or inline SVGs
- Recommendation: Add `lucide-react`; it is tree-shakeable and only 4 icons are used. Fall back to inline SVG if not approved.

### 3. Home page intro block and highlight cards

- What we know: HOME-03 (intro block) and HOME-04..06 (highlight cards) are in scope
- What's unclear: Where the intro block text and highlight card content come from — likely `siteConfig` or `messages/` UI copy (not content layer)
- Recommendation: Intro block uses `siteConfig.tagline` (localized via `localize(siteConfig.tagline, locale)`) + a paragraph from messages. Highlight cards are static UI copy in messages.

### 4. Partner logo strip (HOME-07)

- What we know: Logos for UBA, FCEN, CONICET should appear
- What's unclear: Whether logo image files exist in `public/`
- Recommendation: Planner includes a task to confirm/add institution logos to `public/logos/` and renders them with `next/image`. If images are absent, render text with affiliated links from `siteConfig.affiliations`.

### 5. Contact page address data

- What we know: `siteConfig` has `contactEmail` but no postal address or coordinates
- What's unclear: The actual address/coordinates for the map embed
- Recommendation: Add `address` and `mapQuery` fields to `siteConfig` (or hardcode in the Contact page as constants). The planner should add a task for this.

---

## Sources

### Primary (HIGH confidence — direct source inspection)

- `src/content/index.ts` — complete barrel API
- `src/content/accessors/people.ts` — all people accessor functions and return types
- `src/content/accessors/publications.ts` — all publication accessors
- `src/content/accessors/research.ts` — research area accessors
- `src/content/accessors/journal-club.ts` — journal club accessors including `getPastSessionsByYear`
- `src/content/accessors/outreach.ts` — outreach accessors
- `src/content/schemas/*.schema.ts` — all Zod schemas (exact type shapes)
- `src/content/schemas/shared.ts` — `localize()` function, `Locale` type
- `src/config/site.ts` — `siteConfig` shape
- `src/app/[locale]/layout.tsx` — layout shell pattern (`params` as Promise, `setRequestLocale`)
- `src/app/[locale]/page.tsx` — existing page pattern
- `src/i18n/routing.ts` — locale list, `locales: ["es", "en"]`, pathnames map
- `src/components/ui/EmailLink.tsx` — obfuscation pattern (reuse in Phase 4)
- `src/components/layout/LocaleToggle.tsx` — `'use client'` pattern with Suspense wrapper
- `content/people.json` — verified people data (20 entries, 8 photos)
- `content/research.json` — 4 research areas with Lucide icon names
- `content/publications.json` — 13 publications, 2024–2026
- `content/journal-club.json` — 2 upcoming, 3 past
- `content/outreach.json` — 4 activities, 3 with links
- `public/Portadas/` — portada_1.jpg, portada_2.png (only 2 carousel images)
- `public/people/` — 8 photo files confirmed
- `.planning/phases/02-content-layer/02-VERIFICATION.md` — all Phase 2 outputs verified
- `.planning/phases/03-layout-shell/03-VERIFICATION.md` — Phase 3 shell verified

### Secondary (MEDIUM confidence)

- Google Maps embed URL format `?q=<query>&output=embed` — well-known pattern, no API key required
- ORCID URL format `https://orcid.org/{id}` — standard
- arXiv URL format `https://arxiv.org/abs/{id}` — standard
- DOI URL format `https://doi.org/{doi}` — standard

---

## Metadata

**Confidence breakdown:**
- Content-layer API: HIGH — read directly from source
- File layout: HIGH — derived from routing.ts and existing patterns
- Carousel implementation: HIGH — standard React/CSS pattern, no library needed
- Map embed: HIGH — well-established pattern with `output=embed`
- Email obfuscation: HIGH — existing component confirmed and verified
- i18n behaviour: HIGH — request.ts fallback logic read directly

**Research date:** 2026-04-18
**Valid until:** Stable — content layer is frozen by Phase 2; layout shell frozen by Phase 3. Only Phase 4 itself changes.
