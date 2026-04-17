# Phase 1: Foundation - Research

**Researched:** 2026-04-17
**Domain:** Next.js 16 + next-intl 4 + Tailwind v4 + next/font bootstrap for bilingual academic site
**Confidence:** HIGH

## Summary

Phase 1 stands up a bilingual Next.js 16 App Router scaffold with next-intl 4.9+ segment-translated routing, a locked OKLCH design system materialised as Tailwind v4 `@theme` tokens, and a self-hosted serif+sans type pair that ships Latin + Latin-Extended + Greek subsets on both families. The stack is fully current — Next.js 16 is stable, next-intl 4.9 supports the `defineRouting` + `pathnames` API, Tailwind v4 uses CSS-first `@theme` config (no `tailwind.config.js`), and `next/font/google` auto-self-hosts at build time.

Two findings are load-bearing and non-obvious:

1. **Next.js 16 renamed `middleware.ts` → `proxy.ts`**. The `middleware` file convention is officially deprecated in Next.js 16.0.0; the export is now `export default function proxy(...)` and the file lives at `src/proxy.ts`. next-intl's `createMiddleware(routing)` helper is unchanged — only the file name and function export rename. A codemod exists: `npx @next/codemod@canary middleware-to-proxy .`.
2. **Font selection must be validated against the Greek-subset requirement**. The ui-ux-pro-max tool's default suggestions (e.g. Crimson Pro, Atkinson Hyperlegible) often lack Greek — disqualifying them for this project. The primary recommendation is **Source Serif 4 (display) + Source Sans 3 (body)** — both Adobe-designed, SIL OFL, variable fonts, ship Latin + Latin-Extended + Cyrillic + Greek + Vietnamese on Google Fonts. Secondary: EB Garamond + Inter.

**Primary recommendation:** Scaffold with `npx create-next-app@16 cosmo --typescript --tailwind --app --src-dir --import-alias "@/*"`, add next-intl 4.9, create `src/proxy.ts` (not `middleware.ts`), pin Source Serif 4 + Source Sans 3 via `next/font/google` with subsets `['latin', 'latin-ext', 'greek']`, and wire OKLCH tokens through Tailwind v4's `@theme` + `@theme inline` directives in `globals.css`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | App Router, RSC, Turbopack stable | Current stable; React 19.2 baseline |
| react / react-dom | 19.2.x | UI runtime | Pinned by Next 16 |
| typescript | 5.7.x | Strict typing | Project convention (strict mode) |
| tailwindcss | 4.2.x | Utility CSS + design tokens | CSS-first `@theme` config; OKLCH native |
| @tailwindcss/postcss | 4.2.x | PostCSS plugin | Sole integration path in v4 |
| next-intl | 4.9.1+ | i18n routing + messages | `defineRouting` + `pathnames` map supports segment translation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @lingual/i18n-check | 1.x | Translation-key parity check | `pnpm check-translations` in CI |
| eslint-config-next | 16.x | Lint config | Ships with create-next-app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl | next-i18next | next-i18next predates App Router; next-intl is the RSC-native choice |
| @lingual/i18n-check | hand-rolled node script | Official next-intl recommendation; handles nested keys, ICU syntax, reports cleanly |
| Source Serif 4 + Source Sans 3 | EB Garamond + Inter | EB Garamond is more Garamond-classical; Source Serif is more Nature-adjacent (cleaner, institutional) |
| Tailwind `@theme` OKLCH | raw CSS vars | `@theme` auto-generates utility classes (`bg-surface`, `text-ink`) — free ergonomics |

**Installation:**

```bash
pnpm add next@16 react@19 react-dom@19
pnpm add next-intl@^4.9
pnpm add -D typescript@5 @types/node @types/react @types/react-dom
pnpm add -D tailwindcss@4 @tailwindcss/postcss
pnpm add -D eslint eslint-config-next@16
pnpm add -D @lingual/i18n-check
```

## Architecture Patterns

### Recommended Project Structure

```
cosmo/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx       # sets html lang, fonts, IntlProvider
│   │   │   └── page.tsx         # empty-ish Phase 1 landing
│   │   ├── fonts.ts              # next/font/google wrappers
│   │   └── globals.css           # Tailwind v4 + @theme tokens
│   ├── i18n/
│   │   ├── routing.ts            # defineRouting with pathnames map
│   │   ├── navigation.ts         # createNavigation (Link, usePathname, useRouter)
│   │   └── request.ts            # getRequestConfig — loads messages
│   ├── components/               # Phase 3+ populates
│   ├── lib/                      # Phase 3+ populates
│   └── proxy.ts                  # next-intl middleware (Next 16: proxy, not middleware)
├── messages/
│   ├── es.json
│   └── en.json
├── content/                      # Phase 2+ populates
├── design-system/
│   └── cosmology-group-uba/
│       └── MASTER.md             # ui-ux-pro-max output (source of truth)
├── public/
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

Rationale: `src/` keeps the app code out of the repo root; `messages/` and `content/` at root are conventional next-intl + Content-as-Code placement; `design-system/` at root is the ui-ux-pro-max default.

### Pattern 1: Segment-translated routing with `defineRouting` + `pathnames`

**What:** Declare every route using its canonical English key and map each locale's URL segment inline.
**When to use:** Whenever your URLs need to read natively in each locale (they do — per CONTEXT.md).

```ts
// src/i18n/routing.ts
// Source: https://next-intl.dev/docs/routing
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  localeDetection: false, // no Accept-Language sniffing — predictable canonical
  pathnames: {
    '/': '/',
    '/people':            {es: '/personas',        en: '/people'},
    '/people/[slug]':     {es: '/personas/[slug]', en: '/people/[slug]'},
    '/research':          {es: '/investigacion',   en: '/research'},
    '/publications':      {es: '/publicaciones',   en: '/publications'},
    '/journal-club':      {es: '/journal-club',    en: '/journal-club'},
    '/outreach':          {es: '/divulgacion',     en: '/outreach'},
    '/contact':           {es: '/contacto',        en: '/contact'}
  }
});
```

### Pattern 2: Proxy file (Next.js 16) hosting next-intl middleware

**What:** Next.js 16 renamed `middleware.ts` → `proxy.ts`. Function export renamed `middleware` → `proxy`. next-intl's `createMiddleware` helper still works unchanged.

```ts
// src/proxy.ts   (NOT src/middleware.ts in Next 16)
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match everything except API, static assets, and files with extensions
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

### Pattern 3: Typed navigation helpers

**What:** `createNavigation` returns locale-aware `Link`, `usePathname`, `useRouter`, `redirect`, and `getPathname` that respect the `pathnames` map. **Language toggle MUST use these — never string-replace `/es` with `/en`** (would 404 on `/es/personas`).

```ts
// src/i18n/navigation.ts
import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
```

### Pattern 4: Server config with error-quiet production

```ts
// src/i18n/request.ts
// Source: https://next-intl.dev/docs/usage/configuration
import {getRequestConfig} from 'next-intl/server';
import {hasLocale, IntlErrorCode} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation: ${error.message}`);
        }
      } else {
        console.error(error);
      }
    },
    getMessageFallback({namespace, key, error}) {
      const path = [namespace, key].filter(Boolean).join('.');
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        return process.env.NODE_ENV === 'development' ? `${path} [missing]` : path;
      }
      return path;
    }
  };
});
```

### Pattern 5: Static-render-friendly locale layout

```tsx
// src/app/[locale]/layout.tsx
import {setRequestLocale} from 'next-intl/server';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {fontSerif, fontSans} from '@/app/fonts';
import '@/app/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // enables static rendering for children

  return (
    <html lang={locale} className={`${fontSerif.variable} ${fontSans.variable}`}>
      <body className="bg-surface text-ink antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Anti-Patterns to Avoid

- **String-replacing `/es` → `/en` in the toggle** — breaks segment-translated routes. Use `createNavigation` helpers.
- **`middleware.ts` in Next 16** — deprecated. Use `proxy.ts`.
- **`tailwind.config.js` in v4** — obsolete. Use `@theme` in CSS.
- **Calling `next/font` inside `[locale]/layout.tsx`** — re-initialises on every render. Centralise in `src/app/fonts.ts` and import.
- **Setting `html lang` to a hardcoded string** — must be `{locale}` or you break a11y/SEO.
- **Omitting `setRequestLocale(locale)`** — forces dynamic rendering for every locale page (kills ISR/static export).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Translation-key parity checker | Custom Node script walking nested JSON | `@lingual/i18n-check` | Officially recommended by next-intl; handles ICU, plurals, nested, reports cleanly |
| Locale-aware Link component | Wrapper around `next/link` that prefixes locale | `createNavigation(routing).Link` | Handles `pathnames` map automatically |
| Language-toggle URL builder | Regex replace `/es/` with `/en/` | `useRouter().replace(pathname, {locale})` | Segment translation breaks regex approach |
| Font hosting + WOFF2 subsetting | Download fonts, subset with pyftsubset, commit | `next/font/google` | Auto-subsetting, auto-self-host at build, zero runtime requests |
| Design tokens JSON-to-CSS pipeline | Node script converting tokens.json → CSS | Tailwind v4 `@theme` directive | Native CSS tokens; auto-generates utilities |
| Middleware matcher from scratch | Enumerate every path | Negative regex `'/((?!api|trpc|_next|_vercel|.*\\..*).*)'` | Battle-tested; excludes all static and API traffic |
| Locale detection | Accept-Language parser | `localeDetection: false` + root redirect | Per CONTEXT.md: predictable Argentine-first canonical |

**Key insight:** next-intl has solved every i18n primitive you're tempted to write. Tailwind v4 has solved token ergonomics. next/font has solved font delivery. The Phase 1 discipline is *assembling* these, not recreating them.

## Common Pitfalls

### Pitfall 1: `middleware.ts` file in Next.js 16

**What goes wrong:** Ship `src/middleware.ts` with `export default function middleware(...)`. In Next.js 16, this convention is deprecated — the build logs a warning and behaviour may degrade in 16.x minors.
**Why it happens:** Training data, Stack Overflow, and older tutorials use `middleware.ts`.
**How to avoid:** File is `src/proxy.ts`; export is `export default function proxy(...)` (or `export default createMiddleware(routing)` for next-intl). Run codemod on any legacy code: `npx @next/codemod@canary middleware-to-proxy .`.
**Warning signs:** Build warns "middleware convention deprecated"; i18n routing doesn't redirect `/` → `/es`.

### Pitfall 2: Segment translations break the language toggle

**What goes wrong:** Toggle does `href.replace('/es', '/en')`. On `/es/personas/alice`, it produces `/en/personas/alice` — 404, because EN uses `/en/people/alice`.
**Why it happens:** Developers forget `pathnames` means the *segment* differs, not just the prefix.
**How to avoid:** Always use `createNavigation(routing).useRouter().replace(pathname, {locale: 'en'})`. The `pathname` returned by the helper is the canonical form (`/people/[slug]`), not the localised one. next-intl resolves the correct localised URL when it navigates.
**Warning signs:** 404 on language toggle for any translated-segment route.

### Pitfall 3: FOUT/FOIT on first paint

**What goes wrong:** Fonts flash with system fallback, text reflows on swap → layout shift → CLS regression.
**Why it happens:** `display: swap` without matched metrics, or linking Google Fonts via `<link>` instead of `next/font`.
**How to avoid:**
- Use `next/font/google` (auto-self-hosts, no external request).
- Keep `display: 'swap'` (recommended default, prevents invisible-text FOIT).
- For variable fonts, pin the `axes` you use (e.g. `axes: ['opsz']` for Source Serif 4's optical-size axis).
- Verify in DevTools Network: zero requests to `fonts.googleapis.com` in production build; Coverage tab shows Greek subset loaded on pages with Greek glyphs.

**Warning signs:** CLS > 0.05 on Lighthouse; network tab hits fonts.gstatic.com at runtime.

### Pitfall 4: Missing Greek subset at build time

**What goes wrong:** Choose a font like Crimson Pro or Atkinson Hyperlegible that doesn't ship Greek. Greek glyphs (Λ, Ω, H₀, σ₈) render in the browser's fallback → visual style mismatch mid-sentence.
**Why it happens:** Most "academic serif" shortlists omit Greek checks. ui-ux-pro-max's default recommendations may not cover Greek.
**How to avoid:** Verify on Google Fonts' "Type Tester" language dropdown, or inspect `/home/tomas/Projects/cosmo/skills/design/ui-ux-pro-max/data/google-fonts.csv` for `greek` in the `subsets` column before committing. Shortlist (all verified Greek + Latin-Extended + OFL + variable):
1. **Source Serif 4** (display) + **Source Sans 3** (body) — *primary recommendation*
2. **EB Garamond** + **Inter**
3. **Noto Serif** + **Noto Sans** (universal but less character)

**Warning signs:** Greek letters render in Times New Roman fallback on one device but not another.

### Pitfall 5: Tailwind v4 token reference to `next/font` CSS variables

**What goes wrong:** Write `--font-serif: 'Source Serif 4'` in `@theme`, but the actual font variable comes from `next/font` and is injected as `--font-serif: '__Source_Serif_4_xxxxx'`. Tailwind's `font-serif` utility compiles to the literal string, not the dynamic variable.
**Why it happens:** Confusion between `@theme` (static, compiled) and `@theme inline` (runtime reference).
**How to avoid:** Use `@theme inline` for anything that references a runtime CSS variable:

```css
@theme inline {
  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
}
```

This tells Tailwind: "compile `font-serif` utility to `font-family: var(--font-serif)`" — the `next/font`-injected variable resolves at runtime.

**Warning signs:** Fonts work on `<body>` but `font-serif` utility class falls back to system serif.

### Pitfall 6: `notFound()` before `setRequestLocale`

**What goes wrong:** Static generation fails for locale pages because next-intl can't resolve locale during pre-render.
**Why it happens:** Order matters — `setRequestLocale(locale)` must come after the `hasLocale` check but before any translation reads.
**How to avoid:** Follow the canonical order: `const {locale} = await params` → `if (!hasLocale(...)) notFound()` → `setRequestLocale(locale)` → render.
**Warning signs:** `next build` logs "Dynamic server usage" on locale pages that should be static.

### Pitfall 7: Translation-key drift between `es.json` and `en.json`

**What goes wrong:** Add a key to Spanish, forget English. In production, falls back to the key name visible to users.
**Why it happens:** No CI guard.
**How to avoid:** Wire `@lingual/i18n-check` into CI:

```bash
# package.json
"scripts": {
  "check-translations": "i18n-check --source es --locales messages --format next-intl"
}
```

Run `pnpm check-translations` in the build pipeline and locally in pre-push.

**Warning signs:** Users see `nav.about.heading` rendered as literal text.

### Pitfall 8: Hydration mismatch on `<html lang>`

**What goes wrong:** Server renders `lang="es"`, client reconciles to `lang="en"` → React hydration error → full remount.
**Why it happens:** Locale derived from cookie or client-only state instead of URL params.
**How to avoid:** Derive locale from `params.locale` in the server layout only. Never read from document cookies for initial lang. `localeDetection: false` (already in routing) guarantees this.
**Warning signs:** Console: "Hydration failed — server rendered different HTML".

## Code Examples

### Project bootstrap

```bash
# Source: https://nextjs.org/docs/app/getting-started/installation
pnpm create next-app@16 cosmo \
  --typescript --tailwind --app --src-dir \
  --import-alias "@/*" --no-eslint
cd cosmo
pnpm add next-intl@^4.9
pnpm add -D @lingual/i18n-check
```

### `src/app/fonts.ts` — Source Serif 4 + Source Sans 3 variable fonts

```ts
// Source: https://nextjs.org/docs/app/api-reference/components/font
import {Source_Serif_4, Source_Sans_3} from 'next/font/google';

export const fontSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext', 'greek'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz']        // optical-size axis for display/body switching
});

export const fontSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'greek'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '600', '700']  // minimal weight set per CONTEXT.md
});
```

### `src/app/globals.css` — Tailwind v4 + OKLCH warm-academic tokens

```css
@import "tailwindcss";

/* Map next/font CSS variables to Tailwind font utilities */
@theme inline {
  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
}

/* Design tokens — all traceable to design-system/cosmology-group-uba/MASTER.md */
@theme {
  /* Surfaces: warm-academic, ONE alt surface, NO borders */
  --color-surface:       oklch(0.995 0.003 85);
  --color-surface-alt:   oklch(0.978 0.008 80);

  /* Ink — warm near-black, never pure #000 */
  --color-ink:           oklch(0.22 0.015 60);
  --color-ink-muted:     oklch(0.48 0.012 60);
  --color-ink-subtle:    oklch(0.62 0.010 60);

  /* Accent — muted terracotta (placeholder; pick from ui-ux-pro-max output) */
  --color-accent:        oklch(0.52 0.12 45);
  --color-accent-hover:  oklch(0.44 0.13 45);
  --color-accent-ring:   oklch(0.52 0.12 45 / 0.45);

  /* Type scale — restrained 1.2 ratio, dense body */
  --text-xs:    0.8125rem;
  --text-sm:    0.9375rem;
  --text-base:  1rem;
  --text-base--line-height: 1.5;
  --text-lg:    1.125rem;
  --text-xl:    1.375rem;
  --text-2xl:   1.625rem;
  --text-3xl:   1.875rem;
  --text-4xl:   2rem;

  --font-weight-normal:   400;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --spacing: 0.25rem;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: "kern", "liga", "calt", "tnum";
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

### `postcss.config.mjs`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

### `next.config.ts`

```ts
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default withNextIntl(nextConfig);
```

### `tsconfig.json` — strict + next-intl augmentation

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./src/*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Add `src/global.d.ts`:

```ts
import type messages from '../messages/es.json';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages;
    Locale: 'es' | 'en';
  }
}
```

### `messages/es.json` + `messages/en.json` — minimal Phase-1 seed

```json
// messages/es.json
{
  "meta": {
    "siteName": "Grupo de Cosmología",
    "institution": "FCEN · UBA"
  },
  "nav": {
    "home": "Inicio",
    "people": "Personas",
    "research": "Investigación",
    "publications": "Publicaciones",
    "journalClub": "Journal Club",
    "outreach": "Divulgación",
    "contact": "Contacto"
  }
}
```

```json
// messages/en.json
{
  "meta": {
    "siteName": "Cosmology Group",
    "institution": "FCEN · UBA"
  },
  "nav": {
    "home": "Home",
    "people": "People",
    "research": "Research",
    "publications": "Publications",
    "journalClub": "Journal Club",
    "outreach": "Outreach",
    "contact": "Contact"
  }
}
```

### `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "check-translations": "i18n-check --source es --locales messages --format next-intl"
  }
}
```

### ui-ux-pro-max invocation

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py \
  "academic institutional scholarly research warm minimal serif typography whitespace" \
  --design-system --persist \
  -p "Cosmology Group UBA"
```

Output lands at `design-system/cosmology-group-uba/MASTER.md`. Expected structure:
- **Color Palette** — 5 role-based swatches with CSS variables
- **Typography** — heading font + body font + mood label + Google Fonts URL + CSS import
- **Spacing Variables** — xs, sm, md, lg, xl, 2xl, 3xl
- **Shadow Depths** — shadow-sm through shadow-xl (use sparingly given "no borders" constraint)
- **Component Specs** — buttons, cards, inputs, modals
- **Style Guidelines** — dos and don'ts
- **Anti-Patterns** — things to avoid
- **Pre-Delivery Checklist**

**Post-generation override gate:** If MASTER.md suggests a font without Greek subset, override to **Source Serif 4 + Source Sans 3** and document the override in MASTER.md.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16.0.0 (Oct 2025) | Rename file + export; codemod available |
| `tailwind.config.js` | `@theme` in CSS | Tailwind v4.0 (2025) | CSS-first tokens; no JS config needed |
| `next-i18next` | `next-intl` v4 | next-intl v3+ (2024) | RSC-native; supports App Router |
| Pages Router i18n | App Router + next-intl `defineRouting` | Next 13+ App Router | Segment translation requires `pathnames` map |
| Manual font self-hosting | `next/font/google` with subsets | Next 13.2+ | Auto-subset, auto-self-host at build |
| Hand-rolled translation checker | `@lingual/i18n-check` | 2024 | Officially recommended; handles ICU, nested |
| HSL / RGB tokens | OKLCH | Broad support 2024 | Perceptually uniform |
| Static `--primary-500` scales | Role-based tokens | Tailwind v4 convention | Semantic over numeric |

**Deprecated/outdated:**
- `middleware.ts` convention (use `proxy.ts` in Next 16+)
- `tailwind.config.js` for new v4 projects
- Manual `<link>` to Google Fonts
- `useLocale` from `next-intl/client` (now just from `next-intl`)

## Open Questions

1. **ui-ux-pro-max output may not respect CONTEXT.md's "no borders" constraint.** Planner should add a "review MASTER.md against CONTEXT.md; override gradients, coloured dividers, border tokens; document overrides" task.

2. **Accent hue validation.** If tool outputs a cool blue/green, override to `oklch(0.52 0.12 45)` (muted terracotta). Enforce warm band (hue 30°–80°).

3. **Weight count for variable fonts.** For Source Serif 4 (variable), omit `weight`. For Source Sans 3, pin explicit weights (`['400','600','700']`) for predictable build.

4. **Phase 1 message-file scope.** Ship **chrome strings only** (nav, site name, institution, footer legal). Page-body copy waits for Phase 2.

5. **`proxy.ts` location.** With `--src-dir`, use `src/proxy.ts` (confirmed by Next.js 16 file-conventions docs).

## Sources

### Primary (HIGH confidence)

- Next.js 16 proxy docs — https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Next.js 16 App Router docs — https://nextjs.org/docs/app
- next/font reference — https://nextjs.org/docs/app/api-reference/components/font
- next-intl v4 docs — https://next-intl.dev/docs/routing
- next-intl App Router integration — https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
- next-intl configuration — https://next-intl.dev/docs/usage/configuration
- next-intl workflows/messages — https://next-intl.dev/docs/workflows/messages
- Tailwind v4 installation — https://tailwindcss.com/docs/installation/using-postcss
- Tailwind v4 `@theme` — https://tailwindcss.com/docs/theme
- ui-ux-pro-max skill — `/home/tomas/Projects/cosmo/skills/design/ui-ux-pro-max/`
- ui-ux-pro-max font data — `/home/tomas/Projects/cosmo/skills/design/ui-ux-pro-max/data/google-fonts.csv`
- CONTEXT.md — `.planning/phases/01-foundation/01-CONTEXT.md`
- Prior research — `.planning/research/{STACK,ARCHITECTURE,PITFALLS,SUMMARY}.md`

### Secondary (MEDIUM confidence)

- Source Serif 4 + Source Sans 3 pairing endorsement cross-referenced with Google Fonts type-tester
- EB Garamond + Inter as backup pairing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture patterns: HIGH
- Font selection: HIGH (Greek-subset verified against google-fonts.csv)
- Pitfalls: HIGH
- ui-ux-pro-max integration: MEDIUM (tool output may need overrides)

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 for Next.js/next-intl; 2026-06-01 for Tailwind v4 + font data
