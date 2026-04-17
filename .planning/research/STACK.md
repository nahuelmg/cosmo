# Stack Research — Cosmology Group Website (UBA / FCEN)

**Domain:** Bilingual institutional/academic research group website (content-editable, static-friendly)
**Researched:** 2026-04-17
**Confidence:** HIGH (core stack verified against official 2026-04 docs; a few LOW-confidence flags noted inline)

---

## TL;DR

Use **Next.js 16.2.x + React 19 + TypeScript strict + Tailwind v4 + next-intl v4 + Zod v4 + schema-dts**, deployed to Vercel with a static-export escape hatch. Map via **lazy-loaded Google Maps iframe embed** (no React library, no API key). Content via **plain JSON + Zod validation at build time**. Images via **`next/image` on Vercel**; keep a `unoptimized: true` switch for static-export fallback. This matches the validated landing-page project stack with 2026 version bumps and academic-site-specific additions (`schema-dts`).

> **Version note — deviates from PROJECT.md's "Next.js 15":** Next.js **16.2.4** has been the current stable since 2026-04-15. The `web-dev-general` skill default ("Next.js 15") predates that release. Recommend updating PROJECT.md to "Next.js 16" — no significant API change, and Next.js 14 is EOL as of 2025-10.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | **16.2.4** (2026-04-15) | React framework, App Router, SSG | Current stable. App Router + RSC is the standard for content-driven bilingual sites. `generateStaticParams` gives us statically pre-rendered locale pages. Turbopack stable, ~400% faster dev startup vs 15. Static export (`output: 'export'`) supported as escape hatch. |
| **React** | **19.2** | UI library | Shipped with Next.js 16. React Server Components let us fetch translations + content server-side with zero client JS for the majority of pages. |
| **TypeScript** | **5.x** (strict) | Type safety | Non-negotiable for content schemas (Person, Publication) and i18n type inference. |
| **Tailwind CSS** | **v4.2.2** (2026-03 per GitHub releases) | Styling, design tokens | v4's CSS-first `@theme inline` + OKLCH tokens is exactly the pattern in `references/patterns/design-tokens-starter.md` — already validated. 5× faster builds matter for image-heavy pages. |
| **next-intl** | **4.9.1** (2026-04-10) | i18n (Spanish default, English toggle) | Industry standard for Next.js App Router i18n. `localePrefix: 'as-needed'` gives clean `/` for Spanish + `/en/` for English. Validated pattern in `references/patterns/i18n-next-intl.md`. Works with `output: 'export'` when every dynamic route provides `generateStaticParams`. |
| **Zod** | **4.3.6** (2025-01, stable) | Content validation + type inference | Reads `content/*.json`, validates shape at build time, auto-derives TypeScript types. Eliminates the need for Velite/Content Collections (those target MDX; we have pure JSON). Overwhelming ecosystem adoption. |
| **schema-dts** | **2.0.0** (2022-03, still current) | Typed JSON-LD (Schema.org) | Published by Google. Provides `WithContext<Organization>`, `WithContext<Person>`, etc. Compile-time type checking of structured data with zero runtime cost. Non-negotiable for academic SEO credibility. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/font/google` | (built-in) | Self-hosted Google Fonts | All typography. Per academic aesthetic, pair **Libre Caslon Text** (serif display) or **Source Serif 4** (academic body) with **Inter** (UI) — decided during Phase 1 design system. Self-hosted = no CLS, no third-party cookies, GDPR-safe. |
| `next/image` | (built-in) | Image optimization | All photos (people, hero carousel, partner logos). Uses Vercel's image CDN on Vercel; `images.unoptimized = true` fallback when `output: 'export'` is active. |
| **embla-carousel-react** | ^8.x | Hero image carousel | Only actual third-party UI lib needed. ~10 KB, accessible, respects `prefers-reduced-motion`. Lighter than Swiper (~40 KB) and Keen Slider; no DOM virtualization overhead we don't need for 3–5 slides. |
| `clsx` | ^2.x | Conditional classnames | Tailwind class composition — keep over `classnames` for smaller bundle. |
| (no map library) | — | Google Maps | Plain `<iframe src="https://www.google.com/maps/embed?...">` with `loading="lazy"`. No API key, no billing, no React wrapper needed. See "Maps" below. |

**Explicitly not needed:**
- `shadcn/ui`, `radix-ui`, `@base-ui` — academic site needs minimal components (card, nav, filter chips). Hand-roll with Tailwind. shadcn is overkill and the extra complexity hurts non-technical maintainability.
- `framer-motion` — "no flashy animations" is an explicit design constraint. Use CSS transitions for hero fade.
- `next-themes` — dark mode is explicitly out of scope.
- `@tanstack/react-query`, `swr`, `zustand` — no client-side data fetching; content is all static JSON bundled at build time.
- `react-hook-form`, `zod-form-data` — no forms (contact uses `mailto:`).
- `@vis.gl/react-google-maps` — official Google-sponsored React wrapper, but needs an API key and 60+ KB bundle to render one pin. Overkill for a single contact map.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | Strict peer resolution catches next-intl / Next.js version mismatches early. |
| **ESLint 9** (flat config) | Linting | Use `eslint-config-next`; Next.js 16 ships a flat-config-compatible preset. `next lint` is deprecated in 15.5+, so configure ESLint directly. |
| **Prettier 3** + `prettier-plugin-tailwindcss` | Formatting | Auto-sorts Tailwind classes to canonical order. Critical for legibility in long className strings. |
| **TypeScript strict mode** | Compiler | `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true` per `web-dev-general`. |
| **Vitest** or **Node's `node:test`** | Content schema tests | Run Zod parsing against `content/*.json` in CI to catch content breakage before deploy. Vitest preferred if any React Testing Library later. |
| `@axe-core/playwright` or **Lighthouse CI** | a11y + perf gates | WCAG AA is in the requirements; automate the check. |
| **schema-dts** (as dev) | Ambient types only | Zero runtime cost. |

---

## Installation

```bash
# Core runtime
pnpm add next@^16.2.4 react@^19.2 react-dom@^19.2
pnpm add next-intl@^4.9
pnpm add zod@^4

# UI
pnpm add embla-carousel-react clsx

# SEO / structured data
pnpm add schema-dts

# Dev
pnpm add -D typescript@^5 @types/react @types/react-dom @types/node
pnpm add -D tailwindcss@^4.2 @tailwindcss/postcss postcss
pnpm add -D eslint@^9 eslint-config-next@^16 @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D vitest @vitest/coverage-v8
```

---

## Stack-Specific Decisions

### 1. Content Layer: Zod + JSON, not Velite / Content Collections

**Problem space:** `content/people.json`, `content/publications.json`, `content/research.json`, `content/outreach.json`. No Markdown, no MDX — pure structured data edited by non-technical maintainers.

**Decision:** Define Zod schemas in `src/content/schemas.ts`, parse JSON at module import time:

```ts
// src/content/people.ts
import { z } from 'zod';
import raw from '../../content/people.json';

const BilingualText = z.object({ en: z.string(), es: z.string() });

const Person = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: BilingualText,
  category: z.enum(['pi', 'postdoc', 'phd', 'undergrad', 'past']),
  photo: z.string(),
  short_bio: BilingualText,
  full_bio: BilingualText.optional(),
  research_interests: z.array(z.string()),
  publications_selected: z.array(z.string()).default([]),
  contact: z.object({ email: z.string().email().optional() }).optional(),
  social_links: z.object({ orcid: z.string().url().optional(), arxiv: z.string().url().optional(), website: z.string().url().optional() }).partial().optional(),
});

export const people = z.array(Person).parse(raw);
export type Person = z.infer<typeof Person>;
```

**Why not Velite / Content Collections / Contentlayer:**
- **Velite / Content Collections** are Markdown/MDX-first. Our content is pure JSON — no frontmatter, no body. Using them adds a build step + watcher config for zero benefit.
- **Contentlayer** is unmaintained since 2024-03 — do not use.
- Plain Zod gives: (1) build-time validation with stack traces pointing to the offending JSON line, (2) auto-derived TS types, (3) zero runtime overhead (parse runs once at module init), (4) trivial testability (`pnpm test content`).

**Downside:** If the group later wants MDX for long-form research descriptions or blog posts, revisit Velite in v2. For now, `full_bio` as a plain string or `{ en: string; es: string }` array of paragraphs is sufficient.

### 2. i18n: next-intl with `localePrefix: 'as-needed'`, default `'es'`

Exactly the pattern in `references/patterns/i18n-next-intl.md` — already validated 2026-03. Changes for this project:

```ts
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ['es', 'en'],       // Spanish first
  defaultLocale: 'es',
  localePrefix: 'as-needed',   // '/people' for Spanish, '/en/people' for English
});
```

**Static export compatibility (CRITICAL):** Every dynamic route segment — `[locale]`, `[slug]`, `[...rest]` — **must** export `generateStaticParams()` returning all locale × slug combinations, and every Server Component that calls `getTranslations()` must first call `setRequestLocale(locale)`. This is how the working `azu/next-intl-example` repo achieves `output: 'export'` with next-intl. Without these, `next build` with `output: 'export'` will throw "missing `generateStaticParams()`" errors.

**Content-file bilingualism:** Keep UI strings in `messages/{es,en}.json`, keep structured content (bios, role titles) in `content/*.json` using the `BilingualText = { en: string; es: string }` pattern. Access via `person.role[locale]`. Pattern already validated.

### 3. Images: `next/image` with Vercel-first + static-export fallback

**Vercel deployment (primary):** Use `next/image` with default loader. Vercel handles AVIF/WebP, responsive sizes, CDN. Starting Next.js 16, the **`quality` prop is required-ish** (unrestricted quality can be abused) — set explicitly per image, e.g., `quality={85}`.

**Static-export fallback:** If deploying to university hosting, flip:

```js
// next.config.ts
const nextConfig = {
  // ...
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' as const } : {}),
};
```

Photos will serve as originals from `/public` (no optimization). Acceptable for ~30 people at 400×400 — pre-compress source images to ~80% JPEG / WebP in the content pipeline. If we want optimized images on static hosts, `next-image-export-optimizer` runs a build-step optimization (flagged as LOW confidence — only suggest if static hosting becomes the primary target).

**Photos convention:**
- People: square WebP, source 800×800, displayed 400×400 with `sizes="(max-width: 768px) 50vw, 25vw"`
- Hero carousel: landscape WebP, source 2400×1000, displayed 1920×800 with `priority` on first slide for LCP
- Partner logos: SVG preferred, PNG fallback at 2× DPR

### 4. Map Embed: Google Maps iframe + lazy loading + facade

**Requirement:** Contact page shows the FCEN building location.

**Recommended approach:** Plain iframe, no JavaScript library, no API key (Google's free embed API).

```tsx
// Contact page
<iframe
  src="https://www.google.com/maps/embed?pb=..."  // "Share → Embed" from Google Maps
  title="Ubicación del Grupo de Cosmología, FCEN, UBA"
  className="aspect-video w-full border-0 rounded-lg"
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  allowFullScreen
/>
```

**Why:**
- Zero bundle cost (no map library)
- No API key, no billing tier to manage
- `loading="lazy"` defers the map iframe until near viewport — per Chrome devs, this saves ~500 KB and ~200 ms TBT for below-the-fold maps
- CWV-safe when wrapped in `aspect-video` (reserves layout space → no CLS)

**If LCP/CWV still suffers (unlikely for below-the-fold map):** Upgrade to facade pattern — render a static Google Maps static-API image (or custom SVG) with a "Click for interactive map" button that swaps in the iframe on interaction. This pattern is documented by Chrome's web.dev team. Add only if measured CWV regression, not preemptively.

**Explicitly NOT using:** `@vis.gl/react-google-maps`, `@react-google-maps/api`, `google-maps-react`. All three require a Maps JavaScript API key (billing-enabled), add 60–120 KB to the bundle, and provide zero value for a single static location pin.

### 5. Structured Data: `schema-dts` for Organization + Person + ResearchProject

Per the validated `references/patterns/seo-metadata.md`, but upgrading from `as const` plain objects to typed:

```tsx
// src/components/structured-data.tsx
import type { WithContext, Organization, Person, ResearchProject } from 'schema-dts';

export function OrganizationJsonLd({ locale }: { locale: 'es' | 'en' }) {
  const data: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',  // More specific than Organization
    name: 'Grupo de Cosmología UBA',
    url: SITE_URL,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Universidad de Buenos Aires',
    },
    // ...
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
```

**Schema types needed:**
- `ResearchOrganization` on home + contact
- `Person` with `affiliation`, `jobTitle`, `email` on each `/people/[slug]` page
- `CreativeWork` or `ScholarlyArticle` on publications (v2 feature — metadata only for now)
- Schema.org Schema v30 (shipped in schema-dts 2.0.0) covers all of these

**Note:** schema-dts was last released 2022-03. It's still the canonical typed-Schema.org package (maintained by Google Open Source) — Schema.org itself moves slowly and v30 is current. LOW concern.

### 6. Fonts: Self-hosted via `next/font/google`

Academic-aesthetic pairing candidates (decide in Phase 1 with `ui-ux-pro-max`):

| Body | Display/Headings | Character |
|------|------------------|-----------|
| **Source Serif 4** | **Source Sans 3** | Adobe sibling pair — classic academic, very legible |
| **Lora** | **Inter** | Lora (serif) reads like a journal; Inter UI |
| **Crimson Pro** | **Inter** | Closest to Nature.com's body serif |
| **Libre Caslon Text** | **Inter** | Distinctive, academic heritage feel |

Pattern (matches `references/patterns/design-tokens-starter.md`):

```tsx
import { Source_Serif_4, Inter } from 'next/font/google';
const fontBody = Source_Serif_4({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
```

Both subsets cover Spanish (latin-ext not needed unless Quechua/Mapuche content appears later).

### 7. Deployment: Vercel-first, static-export escape hatch

**Primary:** Vercel. Out of the box: automatic HTTPS, image optimization, preview deploys, CDN, analytics. `NEXT_PUBLIC_SITE_URL` set in env. Zero config for everything except custom domain.

**Fallback:** `STATIC_EXPORT=true pnpm build` → `out/` folder → SCP to university server or GitHub Pages. Limitations documented in "Images" and "i18n" above. Test this path in CI at least once a milestone so it doesn't silently break.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 App Router | Astro | If the site were 100% static with zero interactive state — but the i18n toggle + hero carousel + publications filter argue for React; also team familiarity with Next.js is higher per `web-dev-general`. |
| next-intl | next-international, Lingui, i18next | next-international has cleaner TS inference but smaller ecosystem; Lingui uses ICU messages (overkill); i18next is not App-Router-native. next-intl is the default for a reason. |
| Zod v4 (JSON validation) | Valibot | Valibot is 90% smaller bundle. Use if we ever ship schemas to the client (we don't — validation is build-time only). For build-time + type inference, Zod's ecosystem wins. |
| Zod v4 | TypeBox, ArkType, Typia | Faster runtime, but smaller communities; overkill for <200 content records validated once at build. |
| Plain JSON + Zod | Velite, Content Collections | Use if we add MDX for long-form research descriptions or group blog posts. Until then, adds a build step for no gain. |
| Google Maps iframe | `@vis.gl/react-google-maps` | Use if the site needs interactive features (multiple markers, info windows, custom styled tiles). Not this project. |
| Google Maps iframe | OpenStreetMap + Leaflet | Use if avoiding Google is a requirement (it isn't here) — Leaflet is ~40 KB + OSM tiles are free. Academic sites sometimes prefer this for privacy/ideology; raise with user only if they ask. |
| schema-dts | react-schemaorg | react-schemaorg wraps schema-dts with a `<JsonLd>` component; unnecessary 2 KB of React components. Plain `<script>` injection is simpler. |
| embla-carousel-react | Swiper, Keen Slider | Swiper is 4× bigger; Keen Slider is comparable but has a less maintained React binding. Embla is what the Next.js docs / Tailwind examples use. |
| Self-hosted `next/font` | Fontsource, Google Fonts CDN | Fontsource is good (npm-hosted fonts) but `next/font` already self-hosts with CLS prevention + `display: swap`. Direct CDN = CLS + third-party cookies. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Contentlayer / next-contentlayer** | Unmaintained since 2024-03. Last author commits stopped. App Router support never shipped cleanly. | Zod + JSON (this project) or Velite (if MDX needed). |
| **gatsby-plugin-\*** anything | Gatsby is in maintenance mode; the React ecosystem has moved. | Next.js App Router. |
| **`@react-google-maps/api`** | Needs Maps JavaScript API key (billing), ~80 KB bundle, overkill for one pin. | Google Maps `/embed` iframe with `loading="lazy"`. |
| **`next-i18next`** | Pages-Router era, being sunset. | next-intl. |
| **`date-fns` + `date-fns/locale`** (if imported wholesale) | Tree-shaking caveats; bundle bloat easy. | Native `Intl.DateTimeFormat` — sufficient for "Jan 2024" publication dates. If more is needed, import specific `date-fns/*` functions. |
| **`framer-motion`** | Explicit design constraint: "no flashy animations." Plus 60 KB bundle cost. | CSS transitions for hero fade, `@keyframes` for any other needs. |
| **`shadcn/ui` full install** | Too many components pulled in for what is effectively a static site with ~5 interactive pieces (nav, carousel, publications filter). Maintainability burden for non-technical users who might poke the codebase. | Hand-rolled Tailwind components; pull a single shadcn primitive (e.g., `Select` for publication filter) only if needed. |
| **CSS-in-JS (styled-components, emotion)** | RSC incompatibility, runtime cost, Tailwind v4 obsoletes the use case. | Tailwind v4 with `@theme inline` tokens. |
| **`axios`** | No HTTP requests in this app; all content is compiled in. | N/A — delete if it shows up. |
| **Vercel Analytics, Posthog, GA4** on day 1 | Scope discipline. Not in requirements. Add post-validation if the group requests. | Measure CWV locally with Lighthouse CI during build. |
| **Dark mode tokens in globals.css** | Explicit out-of-scope. Keep CSS simpler. | Light-mode-only OKLCH tokens. (The `@custom-variant dark` line from the starter can stay disabled/commented.) |

---

## Stack Patterns by Variant

**If Vercel hosting (primary):**
- `next/image` with default loader (automatic AVIF/WebP)
- `middleware.ts` enabled for next-intl locale detection
- Vercel env: `NEXT_PUBLIC_SITE_URL=https://cosmo.uba.ar` (or similar)
- `export const revalidate = false` (everything is static; no ISR needed)

**If static-export hosting (fallback):**
- `next.config.ts`: `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`
- Drop middleware (it doesn't execute at static-host edge anyway; next-intl routing still works via `generateStaticParams` on `[locale]`)
- Pre-optimize source photos (`sharp`, `squoosh-cli`) in a content pipeline step
- Make sure every `[slug]` has `generateStaticParams` returning all locale × slug pairs
- Test with `STATIC_EXPORT=true pnpm build && npx serve out` locally before every major merge

**If content volume grows beyond ~50 people or ~500 publications:**
- Replace JSON with Velite collections (MDX for long bios, YAML/TOML for metadata) — revisit, don't preempt
- Consider `fuse.js` for client-side publication search beyond the filter UI
- Consider `@tanstack/react-virtual` if the publications list exceeds ~200 entries on a single page

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.2.x | react@19.2, react-dom@19.2 | React 19 is required; React 18 peer range removed in Next.js 16. |
| next-intl@4.9.x | next@^15.3 OR next@^16 | Works in both. Middleware signature stable across. |
| tailwindcss@4.2.x | postcss@^8.4 | Uses `@tailwindcss/postcss` plugin, not legacy `tailwindcss` PostCSS plugin. No `tailwind.config.js`; theme lives in CSS. |
| zod@4.3.x | TypeScript ≥5.1 | v4 API mostly compatible with v3; some edge method renames. If any referenced snippet is v3, port manually. |
| schema-dts@2.0.0 | TypeScript ≥4.1 | No runtime dep. Ambient types only. |
| embla-carousel-react@8.x | react@^19 | v8 added React 19 compatibility; earlier versions warn. |
| eslint@9 (flat config) | eslint-config-next@^16 | Next.js 16 ships flat-config preset. Next.js 15.5 deprecated `next lint`. |
| `next/image` default loader | NOT compatible with `output: 'export'` | Required: `images: { unoptimized: true }` OR custom loader. |
| next-intl middleware | NOT executed under `output: 'export'` | Expected — locale routing still works via `generateStaticParams` + directory structure. |

---

## Quality Gate Checklist

- [x] Versions verified against official 2026-04 sources (Next.js blog, GitHub releases, next-intl releases) — not training data
- [x] Rationale explains WHY, not just WHAT — every recommendation cites a constraint from PROJECT.md or a measured downside of the alternative
- [x] Confidence levels assigned:
  - HIGH: Next.js, React, TypeScript, Tailwind, next-intl, Zod, `next/image`, Google Maps iframe approach, schema-dts (verified via official sources)
  - MEDIUM: embla-carousel-react (validated in ecosystem, not Context7); Lighthouse CI / axe-playwright (standard but not verified in 2026 release)
  - LOW: `next-image-export-optimizer` (only a fallback suggestion; flag in PITFALLS)
- [x] Static-export compatibility flagged explicitly in the `next/image`, next-intl, and "Stack Patterns by Variant" sections
- [x] Next.js 16 quality-prop change called out (2026 breaking change relative to older docs)

---

## Sources

**Official / HIGH confidence:**
- [Next.js 16.2 release blog (2026-03-18)](https://nextjs.org/blog/next-16-2) — version, Turbopack stability, React 19.2
- [Next.js GitHub Releases](https://github.com/vercel/next.js/releases) — v16.2.4 (2026-04-15) confirmed current
- [Next.js Static Exports guide (v16.2.4, 2026-04-15)](https://nextjs.org/docs/app/guides/static-exports) — unsupported features list, image loader pattern
- [Next.js Image component API (v16.2.4, 2026-04-15)](https://nextjs.org/docs/app/api-reference/components/image) — `unoptimized`, `quality` requirement changes
- [next-intl GitHub Releases](https://github.com/amannn/next-intl/releases) — v4.9.1 (2026-04-10) confirmed current
- [next-intl Static Export issue #334 + azu/next-intl-example](https://github.com/azu/next-intl-example) — working pattern for `output: 'export'` with `[locale]` + `generateStaticParams`
- [schema-dts GitHub](https://github.com/google/schema-dts) — v2.0.0, Schema.org v30 coverage
- [Zod GitHub Releases](https://github.com/colinhacks/zod/releases) — v4.3.6 (2025-01), stable
- [web.dev: Best practices for embeds (facade pattern)](https://web.dev/articles/embed-best-practices) — Google Maps lazy loading & facade guidance
- [Chrome: Lazy load third-party resources with facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades) — LCP/TBT impact quantified

**Internal references (validated 2026-03 in landing-page project):**
- `/home/tomas/Projects/cosmo/references/patterns/i18n-next-intl.md` — complete next-intl setup pattern (App Router + `src/`)
- `/home/tomas/Projects/cosmo/references/patterns/seo-metadata.md` — `generateMetadata` + sitemap + robots + JSON-LD pattern
- `/home/tomas/Projects/cosmo/references/patterns/design-tokens-starter.md` — Tailwind v4 + OKLCH tokens + `next/font` pattern
- `/home/tomas/Projects/cosmo/references/patterns/layout-shell.md` — server/client header split with language toggle

**MEDIUM confidence (WebSearch-cross-referenced):**
- [Tailwind CSS GitHub Releases](https://github.com/tailwindlabs/tailwindcss/releases) — v4.2.2 (release date per GitHub was 2025-03; community search claims 2026-02 — GitHub authoritative). Flagged as version-date ambiguity; impact is minor (v4.x API stable).
- [@vis.gl/react-google-maps OpenJS page](https://openjsf.org/blog/visgl-1.0-react-google-maps) — version 1.0 reached stable; used here to justify NOT adopting it.

**LOW confidence (flag for phase-level revalidation):**
- Tailwind v4.2.2 exact release date (GitHub says 2025-03, one secondary source says 2026-02) — resolve during Phase 1 setup by running `npm view tailwindcss version`
- Exact font pairing for academic aesthetic — defer to Phase 1 `ui-ux-pro-max` design system run per `CLAUDE.md`

---

*Stack research for: Cosmology Group Website (UBA / FCEN)*
*Researched: 2026-04-17*
