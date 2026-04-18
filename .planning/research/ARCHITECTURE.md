# Architecture Research

**Domain:** Academic research group website (bilingual, content-driven, statically generated)
**Researched:** 2026-04-17
**Confidence:** HIGH (Next.js 15 + next-intl patterns validated in prior project; static-export constraints confirmed in official Next.js 15 docs)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│                   (src/app/[locale]/ — RSC pages)                  │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌────────┐  ┌──────────┐  ┌──────────────┐  ┌───────┐  │
│  │ Home │  │ People │  │ Research │  │ Publications │  │ Rest… │  │
│  └──┬───┘  └───┬────┘  └────┬─────┘  └──────┬───────┘  └───┬───┘  │
│     │          │             │               │              │      │
│     │          │  generateStaticParams       │              │      │
│     │          ▼             │               │              │      │
│     │   /people/[slug] ──────┘               │              │      │
│     │                                        ▼              │      │
│     │                        PublicationsFilterClient  ◀────┘      │
│     │                        (nuqs for URL state)                  │
├─────┴─────────────────────────────────────────────────────────────┤
│                        LAYOUT SHELL                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  SiteHeader (RSC)   │  │  SiteFooter (RSC)                   │  │
│  │   └─ HeaderClient   │  │   └─ legal / affiliations strip     │  │
│  └─────────────────────┘  └─────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                        DATA / CONTENT LAYER                        │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ content/*.json│→│ zod schemas    │→│ typed accessors       │  │
│  │ (source truth)│ │ (parse at boot)│ │ (src/content/*.ts)    │  │
│  └──────────────┘  └─────────────────┘  └──────────┬───────────┘  │
│                                                    │              │
│  ┌─────────────────────┐  ┌───────────────────┐    │              │
│  │ site.config.ts      │  │ messages/{en,es}  │    │              │
│  │ (group-wide config) │  │ .json (UI strings)│    │              │
│  └─────────────────────┘  └───────────────────┘    │              │
├────────────────────────────────────────────────────┴──────────────┤
│                        I18N ROUTING LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ src/i18n/routing.ts   → locales, defaultLocale, prefix      │  │
│  │ src/i18n/request.ts   → per-request message loading         │  │
│  │ src/i18n/navigation.ts→ Link, usePathname, getPathname      │  │
│  │ src/middleware.ts     → locale detection (Vercel path only) │  │
│  └─────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                        METADATA / SEO LAYER                        │
│  generateMetadata (per page)  │  sitemap.ts  │  robots.ts  │       │
│  JSON-LD (Organization/Person — injected inline on pages)          │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `content/*.json` | Single source of truth for people, publications, research areas, outreach | Hand-edited JSON checked into git |
| `src/content/*.ts` | Typed accessors over raw JSON; Zod validation at import time | `people.ts` re-exports `people` after `peopleSchema.parse(raw)` |
| `src/config/site.ts` | Group-wide config (name, tagline, URL, affiliations, contact, socials) | Plain TS module; consumed by layouts, metadata, Schema.org |
| `src/i18n/*` | Locale routing, request config, i18n-aware navigation | next-intl primitives (see `references/patterns/i18n-next-intl.md`) |
| `messages/{en,es}.json` | UI strings (nav, CTAs, page metadata titles/descriptions, labels) | Flat JSON by namespace, hot-reloaded in dev |
| `src/app/[locale]/layout.tsx` | Locale layout: `<html lang>`, font, `NextIntlClientProvider`, header/footer | Validates locale, `setRequestLocale`, wraps `<main>` |
| `src/app/[locale]/{page}/page.tsx` | Server-rendered page reading from typed content + messages | RSC; emits JSON-LD inline; calls `generateMetadata` |
| `src/app/[locale]/people/[slug]/page.tsx` | Dynamic route for PIs/postdocs/PhDs; must declare `generateStaticParams` for static export | RSC; filters `people` by category before generating slugs |
| `PublicationsFilterClient` | Interactive filter (year, author, topic) over hydrated JSON | Client component, optionally nuqs for URL-state |
| `SiteHeader` / `SiteFooter` | Shell: nav, language toggle, affiliations strip | Server component wrapping a thin `HeaderClient` for interactivity |
| `sitemap.ts` / `robots.ts` | Auto-generate from content + static page list, bilingual alternates | MetadataRoute exports in `src/app/` |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout — metadataBase only
│   ├── not-found.tsx                # Root 404 (inline styles, no Tailwind)
│   ├── sitemap.ts                   # Generates bilingual entries from content
│   ├── robots.ts                    # Points at sitemap
│   └── [locale]/
│       ├── layout.tsx               # Font, header, footer, NextIntlClientProvider
│       ├── page.tsx                 # Home (hero carousel, highlights, partners)
│       ├── not-found.tsx            # Locale-aware 404
│       ├── people/
│       │   ├── page.tsx             # Sectioned roster (PIs, Postdocs, PhDs, Undergrads, Past)
│       │   └── [slug]/
│       │       └── page.tsx         # Person detail (PI/postdoc/phd only)
│       ├── research/page.tsx        # Research areas grid
│       ├── publications/
│       │   ├── page.tsx             # Server shell: loads publications, renders client filter
│       │   └── publications-filter.tsx  # Client component (nuqs)
│       ├── outreach/page.tsx        # Outreach grid
│       └── contact/page.tsx         # Address, map embed, email, socials
├── i18n/
│   ├── routing.ts                   # locales, defaultLocale, localePrefix
│   ├── request.ts                   # getRequestConfig → loads messages/{locale}.json
│   └── navigation.ts                # Link, usePathname, getPathname (i18n-aware)
├── middleware.ts                    # next-intl middleware (Vercel only)
├── config/
│   └── site.ts                      # Group name, tagline, affiliations, URL, contact
├── content/
│   ├── schemas.ts                   # Zod schemas: Person, Publication, ResearchArea, Outreach
│   ├── people.ts                    # Parses content/people.json, exports typed `people`
│   ├── publications.ts              # Parses content/publications.json
│   ├── research.ts                  # Parses content/research.json
│   └── outreach.ts                  # Parses content/outreach.json
├── components/
│   ├── layout/
│   │   ├── site-header.tsx          # RSC
│   │   ├── header-client.tsx        # 'use client' — menu, language toggle
│   │   └── site-footer.tsx          # RSC
│   ├── home/
│   │   ├── hero-carousel.tsx        # 'use client' — crossfade timer
│   │   ├── highlights-cards.tsx
│   │   └── partners-strip.tsx
│   ├── people/
│   │   ├── person-card.tsx
│   │   └── person-section.tsx       # Takes category + people array
│   ├── publications/
│   │   └── publication-row.tsx
│   ├── research/
│   │   └── research-area-card.tsx
│   ├── schema/                      # JSON-LD helpers
│   │   ├── organization-jsonld.tsx
│   │   └── person-jsonld.tsx
│   └── ui/                          # Shared primitives (button, link, etc.)
├── lib/
│   ├── metadata.ts                  # Shared generateMetadata helper (DRY across pages)
│   └── jsonld.ts                    # Safe stringifier (escapes </script>)
└── types/
    └── index.ts                     # BilingualText, shared types

content/                              # Sibling to src/ — edited by non-technical users
├── people.json
├── publications.json
├── research.json
└── outreach.json

messages/                             # Sibling to src/
├── en.json
└── es.json
```

### Structure Rationale

- **`content/` at repo root, not inside `src/`:** Signals to non-technical group members this is the thing they edit. Keeps JSON out of the TypeScript module graph visually.
- **`src/content/*.ts` wrappers over raw JSON:** Enforces Zod parse-on-import. If JSON is malformed, the **build fails** — no runtime surprises. Also centralizes any computed fields (e.g., sorting publications by year desc).
- **`src/config/site.ts` separated from `content/`:** Group-wide identity (name, tagline, URL) changes rarely and is referenced by layout + metadata + Schema.org simultaneously. Mixing it into `content/` would couple "branding change" with "roster edit" deploys.
- **`[locale]` segment wraps everything:** next-intl App Router convention. All pages live under `/[locale]/`. The root `/` is a redirect via middleware (Vercel) or a client redirect (static export).
- **`messages/` for UI strings, `content/*.json` for domain data:** Two different editing audiences and cadences. UI copy is developer-owned; content is group-owned.
- **Dynamic `/people/[slug]` is flat:** Only PIs/postdocs/PhDs get detail pages. Undergrads and past members are list-only on `/people`.
- **Per-section component folders (`components/people/`, `components/publications/`):** Feature cohesion beats file-type grouping. Most edits touch components + page together.

## Architectural Patterns

### Pattern 1: Content-as-Code with Zod Validation Boundary

**What:** All JSON content is parsed through a Zod schema at import time, in a TypeScript wrapper module. Components consume the typed output, never the raw JSON.

**When to use:** Always, when non-technical users edit content files. Zod is both the contract and the error boundary.

**Trade-offs:**
- Pro: Build fails loudly on malformed content — much better than runtime undefined errors in production.
- Pro: TypeScript types are derived (`z.infer<typeof peopleSchema>`), so schema and types never drift.
- Pro: You can add computed fields (sorted, filtered) in the wrapper.
- Con: Slightly more ceremony than importing JSON directly. Worth it.

**Example:**
```ts
// src/content/schemas.ts
import { z } from 'zod';

const bilingualText = z.object({ en: z.string(), es: z.string() });

export const personSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: bilingualText,
  category: z.enum(['pi', 'postdoc', 'phd', 'undergrad', 'past']),
  photo: z.string().optional(),
  short_bio: bilingualText,
  full_bio: bilingualText.optional(),
  research_interests: z.array(z.string()).default([]),
  contact: z.object({
    email: z.string().email().optional(),
    orcid: z.string().optional(),
  }).optional(),
  social_links: z.record(z.string(), z.string().url()).default({}),
});

export const peopleSchema = z.array(personSchema);
export type Person = z.infer<typeof personSchema>;

// src/content/people.ts
import raw from '../../content/people.json';
import { peopleSchema } from './schemas';

export const people = peopleSchema.parse(raw);
export const peopleByCategory = {
  pi: people.filter((p) => p.category === 'pi'),
  postdoc: people.filter((p) => p.category === 'postdoc'),
  phd: people.filter((p) => p.category === 'phd'),
  undergrad: people.filter((p) => p.category === 'undergrad'),
  past: people.filter((p) => p.category === 'past'),
};
```

This runs once per build (or once per dev-server start). Malformed JSON → build fails with a precise Zod error pointing at the bad field.

### Pattern 2: Server-Fetch-Data, Client-Interact

**What:** Server components own data loading and translation. Client components receive only plain serializable props and own interactivity. Never call `useTranslations` inside a deeply interactive component — translate server-side and pass strings down.

**When to use:** Every interactive feature. Header menu, publications filter, hero carousel.

**Trade-offs:**
- Pro: Smaller client bundle (no next-intl runtime in components that only toggle state).
- Pro: Clean prop surface — easy to test client components with plain fixtures.
- Con: A little prop-drilling at the server/client boundary. Acceptable.

**Example (header):**
```tsx
// site-header.tsx (RSC) — validated in references/patterns/layout-shell.md
export async function SiteHeader() {
  const t = await getTranslations('Navigation');
  const locale = await getLocale();
  return <HeaderClient
    navItems={mainNavItems.map(i => ({ ...i, label: t(i.key) }))}
    languageToggleLabel={t('languageToggle')}
    oppositeLocale={locale === 'en' ? 'es' : 'en'}
  />;
}
```

### Pattern 3: Dynamic Routes via `generateStaticParams` (Required for Static Export)

**What:** Every dynamic segment (`[slug]`) must declare `generateStaticParams` returning all combinations. With `[locale]` as an outer dynamic segment, child `generateStaticParams` is called once per locale.

**When to use:** `/[locale]/people/[slug]` — always. Without this, static export fails; on Vercel, the page becomes dynamic.

**Trade-offs:**
- Pro: All detail pages prerendered → instant navigation, great SEO.
- Pro: Works on Vercel and static hosts identically.
- Con: Adding a new person requires a rebuild. Fine for this domain (edits are infrequent, CI-driven).

**Example:**
```tsx
// src/app/[locale]/people/[slug]/page.tsx
import { routing } from '@/i18n/routing';
import { people } from '@/content/people';

export function generateStaticParams() {
  const slugs = people
    .filter((p) => ['pi', 'postdoc', 'phd'].includes(p.category))
    .map((p) => p.slug);

  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function PersonPage({ params }: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const person = people.find((p) => p.slug === slug);
  if (!person) notFound();
  // render...
}
```

### Pattern 4: Metadata/JSON-LD Driven by `site.config.ts`

**What:** A single `src/config/site.ts` module owns group name, tagline, URL, affiliations. Every `generateMetadata` and every Schema.org block reads from it.

**When to use:** Always. The project explicitly requires "one-line rename" for the placeholder group name.

**Trade-offs:**
- Pro: Renaming the group is one file edit.
- Pro: JSON-LD consistency — Organization name matches OG title matches visible page title.
- Con: None of consequence.

**Example:**
```ts
// src/config/site.ts
export const site = {
  name: 'Grupo de Cosmología UBA',        // placeholder, one-line swap later
  tagline: {
    en: 'Cosmology research at UBA / FCEN',
    es: 'Investigación en cosmología en UBA / FCEN',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  affiliations: [
    { name: 'UBA', url: 'https://www.uba.ar/' },
    { name: 'FCEN', url: 'https://exactas.uba.ar/' },
    { name: 'CONICET', url: 'https://www.conicet.gov.ar/' },
  ],
  contact: { email: 'contacto@placeholder.ar' /* filled later */ },
  socials: {}, // twitter, youtube, etc.
} as const;
```

Consumed by:
- `src/app/layout.tsx` — `metadataBase = new URL(site.url)`
- Every page's `generateMetadata` — title, description
- `OrganizationJsonLd` — `name`, `url`, `sameAs: affiliations.map(a => a.url)`
- `SiteHeader` / `SiteFooter` — brand mark, partner logos strip

### Pattern 5: Publications Filter — Client Hydration from Static JSON

**What:** Publications page is a server component that imports the full typed `publications` array and passes it to a client component for filtering. URL state (year / author / topic) via nuqs for shareable filter links.

**When to use:** Publications page. Not overkill because publications are the primary content artifact users bookmark/share.

**Trade-offs:**
- Pro: Full list is in the initial HTML (SEO-friendly; crawlers see everything).
- Pro: URL state means "all 2024 dark-matter papers" is a linkable thing.
- Pro: No network round-trip; filter is instant.
- Con: Bundle includes the full publications array. For 200-500 papers this is fine (tens of KB). At 5000+, consider pagination.
- Con: nuqs requires a `NuqsAdapter` provider in the client tree.

**Example (shape):**
```tsx
// src/app/[locale]/publications/page.tsx  (RSC)
import { publications } from '@/content/publications';
import { PublicationsFilter } from './publications-filter';

export default async function PublicationsPage() {
  return <PublicationsFilter publications={publications} />;
}

// src/app/[locale]/publications/publications-filter.tsx  ('use client')
'use client';
import { useQueryState, parseAsString, parseAsArrayOf } from 'nuqs';

export function PublicationsFilter({ publications }: Props) {
  const [year, setYear] = useQueryState('year', parseAsString);
  const [topics, setTopics] = useQueryState('topics',
    parseAsArrayOf(parseAsString).withDefault([]));
  // filter + render grouped-by-year list
}
```

nuqs is compatible with Next.js 15 App Router (requires >=14.2.0 per npm). For static export, nuqs reads/writes `window.history` on the client only — no SSR implications once the page is static HTML.

### Pattern 6: Bilingual Content via `BilingualText` in Data, `messages/` for UI

**What:** Two channels for translated strings:
1. **UI labels, nav, metadata titles** → `messages/{en,es}.json`, accessed via `getTranslations(namespace)`.
2. **Content fields with multiple bilingual properties per record** (person bios, research area descriptions) → `BilingualText = { en, es }` on the record itself, accessed via `record.field[locale]`.

**When to use:** Whenever content has structure. A person has `name` (not translated), `role.en/es`, `bio.en/es`. Forcing this into flat `messages/` JSON bloats the file and couples content edits to UI-string namespace.

**Trade-offs:**
- Pro: Content files stay domain-shaped.
- Pro: Non-technical users edit `{ en: '...', es: '...' }` pairs, which is obvious.
- Con: Two access patterns in the codebase. Document this in the team README.

## Data Flow

### Request Flow (Page Render, Static Build Time)

```
content/people.json (source of truth)
    ↓ import + Zod.parse (build time)
src/content/people.ts → exports `people: Person[]`
    ↓ direct import (server component)
src/app/[locale]/people/page.tsx
    ↓ renders RSC tree
Static HTML per locale (/en/people, /es/people)
```

### Request Flow (Publications Filter, Client Interaction)

```
content/publications.json
    ↓ Zod.parse at build
publications: Publication[]
    ↓ imported by server page
PublicationsPage RSC
    ↓ passes full array as prop
PublicationsFilter 'use client'
    ↓ hydrates in browser
User types in filter input
    ↓ nuqs updates ?year=2024&topics=dark-matter in URL
React re-renders filtered list
```

### Request Flow (i18n Routing)

```
User visits  /en/publications                 /publications (default es)
     ↓                                                 ↓
middleware matches [locale]           middleware adds es (or redirects to /es)
     ↓                                                 ↓
LocaleLayout(locale='en')             LocaleLayout(locale='es')
  ↓ setRequestLocale('en')              ↓ setRequestLocale('es')
  ↓ loads messages/en.json              ↓ loads messages/es.json
  ↓ <NextIntlClientProvider>            ↓ <NextIntlClientProvider>
PublicationsPage (RSC)
  ↓ getTranslations('Publications')
  ↓ filters publications by locale-independent fields
Renders HTML with en copy              Renders HTML with es copy
```

### Metadata / Schema.org Flow

```
site.config.ts (group name, URL, affiliations)
        ↓
    ┌───────────────────┬───────────────────┐
    ↓                   ↓                   ↓
generateMetadata()   OrganizationJsonLd  sitemap.ts
 (per page)          (home page)         (all pages x locales)
    ↓                   ↓                   ↓
<head> tags         inline <script>     /sitemap.xml
 - title            type=ld+json        - bilingual alternates
 - canonical
 - hreflang alts
 - OG / Twitter
```

### State Management

**No global client state store.** All interactive state is either:
- **URL state** (publications filter) — via `nuqs`.
- **Component-local state** — `useState` for menu toggles, carousel index.
- **Server state** — content is static, read once at build.

No Redux / Zustand / Jotai needed. An institutional site of this shape has no cross-component client state worth centralizing.

### Key Data Flows

1. **Content edit → deploy:** Non-technical user edits `content/people.json` on a branch → pushes → CI runs `next build` → Zod validation passes or fails loudly → Vercel preview → merge to main → production deploy. **No database migration, no CMS sync.**
2. **Language toggle:** User clicks "EN/ES" → `<Link href={pathname} locale={oppositeLocale}>` → next-intl rewrites to `/en/current-path` → same page re-renders with `messages/en.json`.
3. **Person detail link:** `/people` list → `<Link href={"/people/" + slug}>` → prebuilt static page loads instantly.
4. **Sitemap:** Build time reads `people.ts` + `publications.ts` (implicitly — publications don't have detail pages in v1) → emits entries with `hreflang` alternates for both locales.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k monthly visitors | Static export on Vercel free tier; no changes needed. Default setup handles this. |
| 1k–100k monthly visitors | Still static. Add Vercel Analytics (or Plausible) for traffic insight. CDN handles load transparently. |
| 100k+ monthly visitors | Still likely static. The bottleneck shifts to content ops (editing JSON at scale) — consider a CMS layer if publication count > ~2000 or edits > weekly. |

### Scaling Priorities

1. **First bottleneck: publications list size.** Once the JSON exceeds ~5000 rows, page bundle grows and client filter feels sluggish. Mitigation: paginate filter results, or split `publications.json` by decade and lazy-load.
2. **Second bottleneck: image asset size.** If self-hosting on a static host (no Next.js Image optimization), hero carousel and person photos become the weight. Mitigation: preprocess images (e.g., via a build script using `sharp`) to responsive sizes; or deploy to Vercel for default image optimization.
3. **Third bottleneck: build time.** With hundreds of `[slug]` pages x 2 locales, `next build` grows. At 10k+ total static pages consider ISR (which **requires dropping `output: 'export'`** and committing to Vercel/Node host).

## Anti-Patterns

### Anti-Pattern 1: Raw JSON Imports in Components

**What people do:** `import people from '../../content/people.json'` directly in a component.
**Why it's wrong:** No validation → typo in JSON crashes at runtime, not at build. No computed fields (sort, filter-by-category) → repeated across components. No central place to add caching or derived data.
**Do this instead:** Always go through `src/content/people.ts`. Zod-parse on import, expose named accessors.

### Anti-Pattern 2: Hardcoded Group Name in Multiple Places

**What people do:** Writes "Grupo de Cosmología UBA" in `layout.tsx`, in metadata, in `OrganizationJsonLd`, in the footer, in OG images.
**Why it's wrong:** Rebrand = grep across the codebase. Breaks the explicit project requirement of "one-line group-name swap."
**Do this instead:** `import { site } from '@/config/site'` everywhere. Only `site.ts` has the literal.

### Anti-Pattern 3: Middleware-Based Redirects on Static Export

**What people do:** Relies on next-intl middleware for locale redirect (`/` → `/es`) while also setting `output: 'export'`.
**Why it's wrong:** Middleware does not run in static export. The root `/` has no redirect; users see a 404 or the HTML shell with no content.
**Do this instead:** If targeting Vercel (default), middleware works fine — keep `localePrefix: 'as-needed'`. If targeting static export, switch to `localePrefix: 'always'` and put a tiny client-side redirect or a static HTML `<meta http-equiv="refresh">` at the root. Keep both configs behind a single env flag so you don't accidentally ship the wrong one. (See PITFALLS.md.)

### Anti-Pattern 4: `useTranslations` Deep in Interactive Components

**What people do:** Puts `useTranslations('Publications')` inside the filter's input label.
**Why it's wrong:** Pulls next-intl into the client bundle; couples the component to i18n internals; harder to test.
**Do this instead:** Translate labels in the server parent (`PublicationsPage`), pass strings as props to `PublicationsFilter`. Validated pattern — see `references/patterns/layout-shell.md`.

### Anti-Pattern 5: Putting UI Strings into `content/*.json`

**What people do:** Adds nav labels, button CTAs, footer copyright text into `content/site.json`.
**Why it's wrong:** Mixes audiences: academic editors don't care about "Learn more" button copy. Makes it harder to extract developer-facing strings for translators.
**Do this instead:** UI strings → `messages/{en,es}.json`. Structured content → `content/*.json`. Group-wide identity → `src/config/site.ts`.

### Anti-Pattern 6: Fetching Publications at Runtime

**What people do:** `const pubs = await fetch('/api/publications')` in a client component.
**Why it's wrong:** Publications are static. An API route adds latency, breaks static export, hurts SEO (content not in initial HTML).
**Do this instead:** Import at build time via typed accessor. Ship in initial HTML.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Maps (contact page) | Embedded iframe with `loading="lazy"` | No API key needed for basic `?q=...` embed. Keep it lazy — don't block initial paint. |
| Vercel Analytics (optional) | `@vercel/analytics` Script component | Works on Vercel; skip if deploying static to university host. |
| arXiv / ADS / ORCID (v2) | Out of scope for v1 | Placeholder JSON; deferred importer per PROJECT.md. |
| Fonts | Self-hosted via `next/font/local` | Explicit project requirement; avoids third-party FOIT. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages ↔ Content layer | Direct import of typed accessors (`import { people } from '@/content/people'`) | Accessors are the contract; schemas document the shape. |
| Pages ↔ i18n layer | `getTranslations` (server), `useTranslations` (client) | Never import raw `messages/en.json`. |
| Pages ↔ site config | Direct import of `@/config/site` | Static, no runtime indirection. |
| Server header ↔ client header | Props (plain serializable objects) | Validated pattern. Never pass functions or class instances across the boundary. |
| Metadata helpers ↔ pages | `lib/metadata.ts` returns a factory; pages call it with their `href` | Keeps all canonical/hreflang logic in one place (see `references/patterns/seo-metadata.md`). |

## Build Order & Parallelization

**Phase order that respects dependencies (narrowest → widest):**

```
Phase 1 — Foundation                     [must precede everything]
├─ Next.js 15 + TS strict + Tailwind v4 scaffold
├─ i18n setup (routing.ts, request.ts, navigation.ts, middleware.ts)
├─ Root + locale layouts (skeletons, no content)
├─ src/config/site.ts (placeholder values)
├─ Zod schemas in src/content/schemas.ts
├─ Empty messages/{en,es}.json with Navigation + Metadata namespaces
└─ Design tokens (ui-ux-pro-max → design-system/MASTER.md → globals.css)

Phase 2 — Content Layer                  [depends on schemas from Phase 1]
├─ content/people.json with placeholders (validates against schema)
├─ content/publications.json
├─ content/research.json
├─ content/outreach.json
├─ src/content/*.ts wrappers (Zod.parse + derived accessors)
└─ Verify build: `next build` succeeds with empty pages

Phase 3 — Layout Shell                   [can parallelize with Phase 2 tail]
├─ SiteHeader (server) + HeaderClient (client) — language toggle, mobile menu
├─ SiteFooter with affiliations strip
└─ Locale layout wires header/footer + NextIntlClientProvider

Phase 4 — Core Pages                     [requires Phase 2 content + Phase 3 shell]
Can run in parallel across pages:
├─ ▶ Home (hero carousel, highlights, partners strip)
├─ ▶ People list + /people/[slug] detail (same developer: shares PersonCard)
├─ ▶ Research areas grid
├─ ▶ Publications list + filter client (standalone, different component tree)
├─ ▶ Outreach grid
└─ ▶ Contact (map, address, socials)
Each page ships with its own generateMetadata + tests.

Phase 5 — SEO + Schema.org               [requires all pages to exist]
├─ sitemap.ts reading content accessors
├─ robots.ts
├─ OrganizationJsonLd on home
├─ PersonJsonLd on each /people/[slug]
└─ Open Graph images (static or generated)

Phase 6 — Polish & A11y                  [can partially parallelize with Phase 5]
├─ WCAG AA pass (focus rings, contrast, alt text, aria labels)
├─ Core Web Vitals pass (image sizes, font loading, carousel perf)
├─ Static export config toggle + smoke test (optional escape hatch)
└─ 404, not-found at both root and [locale] scopes
```

### Parallelization Opportunities

| Can Parallel | Must Sequence |
|--------------|---------------|
| Phase 4 pages (Home, People, Research, Publications, Outreach, Contact) — independent component trees | Phase 1 → 2 (schemas must exist before content JSON) |
| Phase 5 JSON-LD blocks per page | Phase 2 → 3 (layout reads config + content) |
| Phase 6 a11y audits per page | Phase 3 → 4 (pages render inside shell) |
| Zod schemas + design-tokens setup in Phase 1 (different domains) | Phase 4 → 5 (sitemap needs real page URLs) |

### i18n Routing Decisions That Ripple Everywhere

These decide once, affect the whole project:

| Decision | Options | Recommendation | Ripple |
|----------|---------|----------------|--------|
| `localePrefix` | `'as-needed'` / `'always'` / `'never'` | `'as-needed'` (Vercel) with fallback to `'always'` if static export activated | Affects every URL in sitemap, hreflang, Link `href`, share URLs |
| Default locale | `es` / `en` | `es` (Argentine institution, primary audience is Spanish) | `x-default` hreflang points at es URLs; OG `locale` defaults to `es_AR` |
| Locale detection | `localeDetection: true` / `false` | `true` on Vercel (middleware auto-redirects) / `false` if static export | Static export must use `'always'` + have `/` be a client redirect or static HTML meta-refresh |
| Navigation helper | `@/i18n/navigation` vs `next/link` | **Always** `@/i18n/navigation` — never mix | Every component. Linting rule recommended. |
| Dynamic route params | `{ locale, slug }` | Both must be in `generateStaticParams` output | `/people/[slug]` without locale in params → build warnings → SSR at runtime |

**Decide the deploy target early.** Vercel-default and static-export are architecturally different w.r.t. middleware. Per PROJECT.md, keep **both viable** — which means writing both configs (committed `next.config.ts` targets Vercel; a `next.config.static.ts` or env-flag variant for static). The static variant must use `localePrefix: 'always'` and cannot rely on middleware for root redirect.

## Sources

- [Next.js 15 Static Export docs — authoritative unsupported-features list](https://nextjs.org/docs/app/guides/static-exports) — HIGH confidence
- [next-intl Middleware & Static Export constraints](https://next-intl.dev/docs/routing/middleware) — HIGH confidence
- [next-intl routing setup (locale-based routing)](https://next-intl.dev/docs/routing/setup) — HIGH confidence
- [next-intl static export example repo (azu/next-intl-example)](https://github.com/azu/next-intl-example) — MEDIUM confidence (community example)
- [Next.js generateStaticParams reference](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — HIGH confidence
- [nuqs docs — URL state management](https://nuqs.dev) — MEDIUM confidence (requires >=14.2.0, Next.js 15 compatible)
- `references/patterns/i18n-next-intl.md` — HIGH confidence (validated in prior landing-page project, 2026-03)
- `references/patterns/seo-metadata.md` — HIGH confidence (validated in prior landing-page project, 2026-03)
- `references/patterns/layout-shell.md` — HIGH confidence (validated in prior landing-page project, 2026-03)
- [Zod validation for static site content (dev.to case study, 2026-02)](https://dev.to/kranthi_kumarmuppala_f22/how-i-built-700-developer-tools-as-a-static-site-with-nextjs-zod-and-claude-code-19e0) — LOW confidence single source, but the `z.infer` + parse-on-import pattern is standard Zod practice

---
*Architecture research for: academic research group website (Next.js 15 App Router + next-intl + JSON content)*
*Researched: 2026-04-17*

---

# v1.1 Architecture Extension: Build-Time Publication Sync

**Researched:** 2026-04-18
**Confidence:** HIGH (all findings derived from direct inspection of the shipped v1.0 codebase)

## System Overview: Two Environments, One JSON Handoff

The fundamental design principle for v1.1: the sync script and the Next.js build are completely isolated execution environments. They share one artifact — `content/publications.json`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SYNC ENVIRONMENT  (GitHub Actions — weekly cron, no browser)       │
│                                                                     │
│  scripts/sync-publications.ts                                       │
│    ├── fetch InspireHEP API  ──┐                                    │
│    ├── fetch arXiv API ────────┤── merge + deduplicate              │
│    └── validate with Zod   ───┘── write content/publications.json  │
│                                                                     │
│  .github/workflows/sync-publications.yml                            │
│    └── on success: git commit + push → Vercel auto-deploy           │
│    └── on failure: exit 1, no commit, last-good JSON preserved      │
└────────────────────────┬────────────────────────────────────────────┘
                         │  content/publications.json
                         │  (the handoff artifact)
┌────────────────────────▼────────────────────────────────────────────┐
│  BUILD ENVIRONMENT  (Next.js SSG — pnpm build)                      │
│                                                                     │
│  prebuild hook (pnpm check-content = scripts/validate-content.mjs)  │
│    └── PublicationsSchema.parse(rawPublications)                    │
│                                                                     │
│  src/content/accessors/publications.ts                              │
│    └── import rawPublications from "content/publications.json"      │
│    └── PublicationsSchema.parse() at module load — throws at build  │
│                                                                     │
│  src/app/[locale]/publications/page.tsx  (year-grouped list)        │
│  src/app/[locale]/people/[slug]/page.tsx (per-person filtered list) │
└─────────────────────────────────────────────────────────────────────┘
```

The sync script never imports Next.js internals. The Next.js build never calls external APIs. This separation is the architecture — everything else follows from it.

## Component Map: New vs Modified

### New Components (v1.1 additions)

| File | Type | Responsibility |
|------|------|----------------|
| `scripts/sync-publications.ts` | CLI script | Fetch InspireHEP + arXiv, merge, validate in-memory, write on success |
| `.github/workflows/sync-publications.yml` | CI workflow | Weekly cron: run sync, commit on success with `[skip ci]` |

### Modified Components (additive changes only — no structural rewrite)

| File | Change | Consumer Impact |
|------|--------|-----------------|
| `src/content/schemas/publications.schema.ts` | Add `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` | Existing JSON entries without `source` parse correctly via `.default()`. `strictObject` rejects unknown keys but `.default()` supplies missing ones. Zero migration of existing data. |
| `src/content/schemas/people.schema.ts` | Add `arxiv_id?: string` and `inspirehep_id?: string` as top-level optional fields | Both optional. `PeopleSchema` superRefine rules check `category`/`slug` — unaffected. `getLocalizedPerson` spreads `...p` then adds resolved bilingual fields; new optional passthrough fields require no change. |
| `src/content/accessors/publications.ts` | Add `getPublicationsByAuthor(nameVariants, { lastNYears? })` | Additive export. All existing accessors and callers untouched. |
| `src/content/index.ts` | Re-export `getPublicationsByAuthor` | One-line addition to the barrel. |
| `content/publications.json` | Written by sync script (adds `source` field per entry) | Consumed identically by the build — schema now expects `source`, supplies default for entries lacking it. |
| `src/app/[locale]/people/[slug]/page.tsx` | Call `getPublicationsByAuthor` with person's name variants | Page logic only. No new component needed. |

## File-Level Project Structure (delta from v1.0)

```
cosmo/
├── scripts/
│   ├── validate-content.mjs          # EXISTING — unchanged
│   ├── generate-schemas.mjs          # EXISTING — unchanged
│   └── sync-publications.ts          # NEW
│
├── src/content/
│   ├── schemas/
│   │   ├── shared.ts                 # EXISTING — unchanged
│   │   ├── publications.schema.ts    # MODIFIED — add source field with .default()
│   │   ├── people.schema.ts          # MODIFIED — add arxiv_id, inspirehep_id optionals
│   │   └── (other schemas)           # EXISTING — unchanged
│   ├── accessors/
│   │   ├── publications.ts           # MODIFIED — add getPublicationsByAuthor()
│   │   └── (other accessors)         # EXISTING — unchanged
│   └── index.ts                      # MODIFIED — re-export getPublicationsByAuthor
│
├── content/
│   └── publications.json             # WRITTEN BY sync script
│
└── .github/
    └── workflows/
        └── sync-publications.yml     # NEW
```

## Script Location: Why `scripts/sync-publications.ts`

Rejected alternatives:

- **`packages/sync/` workspace:** Adds `package.json`, `tsconfig.json`, workspace plumbing. Zero benefit — the script is not published, not independently versioned, not shared with other packages. The workspace.yaml confirms this project has no multi-package structure.
- **`content/sync/`:** That directory holds data files. Executable code there violates separation of concerns and breaks the mental model for non-technical editors.

Chosen: `scripts/sync-publications.ts` — consistent with `validate-content.mjs` and `generate-schemas.mjs`. Both are TypeScript-importing CLI scripts run via `tsx`. The pattern is established, tested, and understood by the project.

## Schema Reuse: Direct Relative Import (No Alias)

The sync script imports Zod schemas using **relative paths**, not the `@/` alias.

This is not a workaround — it is the documented pattern already used by both existing scripts:

```js
// scripts/validate-content.mjs (lines 23-27) — existing, working
import { PeopleSchema } from "../src/content/schemas/people.schema.ts";
import { PublicationsSchema } from "../src/content/schemas/publications.schema.ts";
```

The `@/*` alias in `tsconfig.json` is resolved by Next.js/webpack in bundler `moduleResolution` mode. Plain `tsx` running under Node.js does not resolve it. Using `@/content/schemas/...` in `sync-publications.ts` would fail with "Cannot find module."

The sync script must follow the same pattern:

```ts
// scripts/sync-publications.ts
import { PublicationsSchema } from "../src/content/schemas/publications.schema.ts";
import { PeopleSchema } from "../src/content/schemas/people.schema.ts";
```

`tsx` is already a dev dependency (`"tsx": "^4.21.0"`) and the established runner. No new tooling required.

## Schema Extension: `source` Field

```typescript
// Addition to PublicationSchema in publications.schema.ts
source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual"),
```

The `.default("manual")` is load-bearing. `PublicationSchema` uses `z.strictObject`, which rejects extra keys but does not require fields that have defaults. All 15 existing entries in `publications.json` lack `source` and will parse correctly — the default is applied by Zod during parse, before strictObject validation.

The sync script writes `source: "inspirehep"` or `source: "arxiv"` for entries it produces. Hand-curated entries remain `source: "manual"` (applied by default on parse; maintainers may also write it explicitly).

After modifying `publications.schema.ts`, re-run `pnpm generate-schemas` to update `content/publications.schema.json` (the JSON Schema file used by VSCode IntelliSense). This is a manual step — the schema generator is not automatic.

## Schema Extension: `arxiv_id` / `inspirehep_id` on Person

Placement: top-level optional fields on `PersonSchema`, not inside `contact`.

Rationale: `contact` holds user-facing communication endpoints (email, ORCID, office). `arxiv_id` and `inspirehep_id` are sync-script lookup keys, not contact information. Mixing them into `contact` would also require changing the `contact` block from `z.strictObject` to accommodate new keys, whereas top-level optionals are cleanly additive.

```typescript
// Addition to PersonSchema in people.schema.ts
arxiv_id: z.string().optional(),
inspirehep_id: z.string().optional(),
```

`getLocalizedPerson` in `people.ts` spreads `...p` and then resolves bilingual fields — the new optional fields pass through automatically. No change to `people.ts` required.

## Validation Pipeline: Strategy B (Validate In-Memory Before Writing)

```
sync-publications.ts:
  1. Fetch InspireHEP results (fail fast on error)
  2. Fetch arXiv results (fail fast on error)
  3. Merge into candidate Publication[] array
  4. Call PublicationsSchema.safeParse(candidate)
  5a. Parse fails  → log errors, process.exit(1), NO writeFileSync
  5b. Parse passes → fs.writeFileSync("content/publications.json", ...)
  6.  process.exit(0)
```

Rejected alternatives:

- **Strategy A (write then revert):** If the process is killed between write and revert, the repo is left with invalid content. Revert logic is brittle.
- **Strategy C (CI validates after write):** Still requires revert on failure, adds latency, and the separate validation step is already in place as a second gate.

The existing `pnpm check-content` (`scripts/validate-content.mjs`) remains the second line of defence — it runs as `prebuild` and as an explicit Action step before the commit. This means two validation passes, which is intentional: the sync script validates the candidate before writing, and the CI validates the written file before committing.

## GitHub Action: Full Step Sequence

```yaml
# .github/workflows/sync-publications.yml
on:
  schedule:
    - cron: '0 6 * * 1'   # Monday 06:00 UTC weekly
  workflow_dispatch:        # manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      # Step 1: sync script — validates in-memory, writes on success, exits 1 on failure
      - run: tsx scripts/sync-publications.ts
        env:
          INSPIREHEP_QUERY: "..."   # group affiliation query
          ARXIV_QUERY: "..."        # author/affiliation query

      # Step 2: second validation gate — belt + suspenders
      - run: pnpm validate-content

      # Step 3: commit only if publications.json changed
      - name: Commit sync results
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          if git diff --name-only | grep -q "content/publications.json"; then
            git add content/publications.json
            git commit -m "chore: sync publications [skip ci]"
            git push
          else
            echo "No changes to publications.json — skipping commit"
          fi
```

The `[skip ci]` tag on the commit message prevents the push from triggering a second sync run (avoiding an infinite loop if the main CI workflow triggers on push to main).

## Action Flow: Auto-Commit vs PR

**Recommendation: Auto-commit. No human-review PR.**

This is an academic group site with a small, stable publication list. The sync script validates data against the Zod schema before writing. The weekly update adds factual bibliographic records — it does not restructure content or touch hand-curated fields. The overhead of "open PR, wait for PI to merge" will cause the automation to be abandoned within months.

Conditions that would justify a PR workflow: large team with a content review process; sync makes structural changes; risk of corrupting hand-curated fields (mitigated by the merge strategy that preserves existing entries). None of these apply here.

## `getPublicationsByAuthor`: Placement and Signature

**Location: `src/content/accessors/publications.ts`**

Rationale:
- The function returns `Publication[]` — it belongs in the module of the returned type
- This is consistent with `getPublicationsByYear`, `getPublicationsByTopic` (same module, same pattern)
- Importing `getPersonBySlug` from `people.ts` inside `publications.ts` would risk a circular dependency. The caller (page component) builds the name variants and passes them in.
- A separate `src/content/helpers/publications-by-author.ts` is one function — not worth a new module boundary.

```typescript
// Addition to src/content/accessors/publications.ts

/**
 * Returns publications whose authors array contains a string that matches
 * any of the provided name variants (case-insensitive substring match).
 *
 * Caller builds nameVariants from Person.name and any known author format
 * variants (e.g. "Last, F." shortforms). The function does not import Person —
 * it receives plain strings to avoid circular dependency risk.
 *
 * @param nameVariants - Name strings to match against author entries
 * @param options.lastNYears - If provided, restricts to publications from
 *   (currentYear - lastNYears) onward inclusive
 */
export function getPublicationsByAuthor(
  nameVariants: string[],
  options: { lastNYears?: number } = {},
): Publication[] {
  const currentYear = new Date().getFullYear();
  const cutoff = options.lastNYears != null
    ? currentYear - options.lastNYears
    : null;

  return publications.filter((p) => {
    if (cutoff !== null && p.year < cutoff) return false;
    return nameVariants.some((variant) =>
      p.authors.some((author) =>
        author.toLowerCase().includes(variant.toLowerCase()),
      ),
    );
  });
}
```

**Locale note:** `Publication` has no bilingual fields — titles, authors, and journals are canonical strings. `getPublicationsByAuthor` returns `Publication[]` directly. The `/people/[slug]` page renders these without localization, consistent with how `/publications` renders them.

Caller pattern in `src/app/[locale]/people/[slug]/page.tsx`:

```typescript
const person = getPersonBySlug(slug);
if (!person) notFound();

// Build name variants from the person record
// InspireHEP API returns "Last, First" format; arXiv returns "First Last"
// Use person.name as the canonical variant; extend list if inspirehep_id lookup
// reveals additional author-string forms used in existing publications.
const nameVariants = [person.name];

const recentPubs = getPublicationsByAuthor(nameVariants, { lastNYears: 5 });
const allPubs = getPublicationsByAuthor(nameVariants);
```

## Data Flow: Sync Script to Static HTML

```
Weekly cron (GitHub Actions)
  │
  ▼
scripts/sync-publications.ts
  ├── GET https://inspirehep.net/api/literature?...
  ├── GET https://export.arxiv.org/search/...
  ├── merge, assign source field, generate stable id
  ├── PublicationsSchema.safeParse(candidate)  ← imports from ../src/content/schemas/
  └── fs.writeFileSync("content/publications.json", ...)
  │
  ▼
tsx scripts/validate-content.mjs           ← second gate in Action
  └── PublicationsSchema.parse(raw)
  │
  ▼
git commit content/publications.json → push to main [skip ci]
  │
  ▼
Vercel build triggered (webhook on push)
  │
  ▼
pnpm build
  └── prebuild: tsx scripts/validate-content.mjs  ← third gate at build time
  │
  ▼
Next.js SSG module graph resolves:
  └── src/content/accessors/publications.ts
        └── import rawPublications from "content/publications.json"
        └── const publications = PublicationsSchema.parse(rawPublications)
              ← throws at module load if invalid; surfaces in Vercel build log
  │
  ▼
45+ prerendered HTML routes including:
  └── /[locale]/publications  (year-grouped — getPublications())
  └── /[locale]/people/[slug] (filtered — getPublicationsByAuthor())
```

## Build Order: What Unblocks What

```
Phase A: Schema changes                         [must come first]
  ├── publications.schema.ts — add source field with .default("manual")
  ├── people.schema.ts       — add arxiv_id, inspirehep_id as optionals
  ├── pnpm generate-schemas  — regenerate content/*.schema.json for IntelliSense
  └── pnpm validate-content  — confirm existing data still passes

Phase B: Accessor extension                     [depends on Phase A]
  ├── publications.ts         — add getPublicationsByAuthor()
  └── src/content/index.ts   — re-export getPublicationsByAuthor

Phase C: Sync script                            [depends on Phase A]
  ├── scripts/sync-publications.ts
  └── Add "sync-publications" to package.json scripts for local testing

Phase D: GitHub Action                          [depends on Phase C being stable]
  └── .github/workflows/sync-publications.yml

Phase E: People page integration                [depends on Phase B]
  └── src/app/[locale]/people/[slug]/page.tsx
        — call getPublicationsByAuthor with name variants
```

Phases C and E can be developed in parallel once Phase A and B are committed. Phase D should wait until Phase C is validated locally (run `tsx scripts/sync-publications.ts` manually with dry-run output before wiring into CI).

## Failure Semantics

**Principle: fail fast, no partial commit.**

| Failure scenario | Script behaviour | Action behaviour | Site state |
|-----------------|-----------------|-----------------|------------|
| InspireHEP API timeout/5xx | Catch error, `process.exit(1)` | Step fails, no commit step reached | Last-good JSON preserved — no Vercel redeploy |
| arXiv API timeout/5xx | Same | Same | Same |
| InspireHEP OK, arXiv fails | **Fail fast** — do not commit partial data | Step fails | Last-good JSON preserved |
| Merged data fails Zod parse | `safeParse` returns error, no `writeFileSync`, `process.exit(1)` | Step fails | Last-good JSON preserved |
| `writeFileSync` succeeds, validate-content fails | Validate step exits 1 | No commit step reached | File written but not committed; next sync run overwrites |
| Commit + push succeeds, Vercel build fails | Vercel marks deployment failed | Last successful deployment stays live | Valid JSON in repo; broken Next.js code is the issue — unrelated to sync |

The "InspireHEP OK, arXiv fails" case deserves emphasis: committing partial data would silently remove arXiv-only preprints from the site without any visible error to the PI. The correct response is always to exit 1 if any fetch fails, regardless of how much data was successfully retrieved.

## Confirmed: No Build-Time Fetch

The Next.js SSG build path does not fetch at build time. Confirmed by inspection:

- `src/content/accessors/publications.ts` uses `import rawPublications from "../../../content/publications.json"` — a static JSON import resolved by `moduleResolution: bundler` at build time. No `fetch()`.
- No accessor or page component calls `fetch()` or any async data function.
- `next.config.ts` has no ISR `revalidate` configuration.
- All routes are fully static.

The sync script must NOT be added to the `prebuild` hook. That would make `pnpm build` and `pnpm dev` require network access, breaking offline development and making CI non-deterministic.

**Module-load parse performance with large payloads:** `PublicationsSchema.parse()` runs once per build. For a typical academic group (50-300 publications), Zod v4 parse time is in the microsecond range — not measurable. No risk.

## Anti-Patterns Specific to v1.1

### Using `@/` alias in the sync script

The `@/` path alias is resolved by Next.js/webpack in bundler mode. `tsx` under plain Node.js does not resolve it. Use `../src/content/schemas/publications.schema.ts` (relative path), exactly as `validate-content.mjs` and `generate-schemas.mjs` already do.

### Adding sync script to `prebuild` hook

Adding `tsx scripts/sync-publications.ts` to the `prebuild` npm script makes `pnpm build` require network access. Local development breaks offline. CI builds become non-deterministic. The committed JSON file is the source of truth for the build — do not bypass it.

### Committing partial sync results

If InspireHEP succeeds and arXiv fails, silently removing all arXiv-only preprints from the site is a correctness bug. All fetches must succeed before any write occurs. Accumulate all results in memory, validate the complete merged array, then write atomically.

### Cross-importing between accessor modules

`publications.ts` must not import from `people.ts` (and vice versa). The page component passes name variants to `getPublicationsByAuthor` as plain strings. This preserves module independence and avoids circular dependency risk.

### Forgetting to re-run `pnpm generate-schemas` after schema changes

`content/publications.schema.json` and `content/people.schema.json` are generated files committed to the repo. If the Zod schema changes but the JSON Schema file is not regenerated, VSCode IntelliSense will flag valid new fields (like `source`) as errors. Run `pnpm generate-schemas` as part of Phase A.

## Sources

- Direct inspection: `src/content/schemas/publications.schema.ts` (v1.0)
- Direct inspection: `src/content/schemas/people.schema.ts` (v1.0)
- Direct inspection: `src/content/accessors/publications.ts` (v1.0)
- Direct inspection: `src/content/accessors/people.ts` (v1.0)
- Direct inspection: `scripts/validate-content.mjs` — confirms tsx relative-import pattern and prebuild wiring
- Direct inspection: `scripts/generate-schemas.mjs` — confirms tsx relative-import pattern
- Direct inspection: `tsconfig.json` — confirms `@/*` alias scope and `moduleResolution: bundler`
- Direct inspection: `package.json` — confirms tsx dev dependency, prebuild hook, existing script names
- Direct inspection: `content/publications.json` — confirms existing structure (no `source` field in v1.0)

---
*v1.1 sync architecture extension*
*Researched: 2026-04-18*
