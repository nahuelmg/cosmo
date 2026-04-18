# Stack Research — Cosmology Group Website (UBA / FCEN)

**Domain:** Bilingual institutional/academic research group website (content-editable, static-friendly)
**Researched:** 2026-04-17 (v1.0 base) / 2026-04-18 (v1.1 additions)
**Confidence:** HIGH (core stack verified against official 2026-04 docs; a few LOW-confidence flags noted inline)

---

## TL;DR

Use **Next.js 16.2.x + React 19 + TypeScript strict + Tailwind v4 + next-intl v4 + Zod v4 + schema-dts**, deployed to Vercel with a static-export escape hatch. Map via **lazy-loaded Google Maps iframe embed** (no React library, no API key). Content via **plain JSON + Zod validation at build time**. Images via **`next/image` on Vercel**; keep a `unoptimized: true` switch for static-export fallback. This matches the validated landing-page project stack with 2026 version bumps and academic-site-specific additions (`schema-dts`).

> **Version note — deviates from PROJECT.md's "Next.js 15":** Next.js **16.2.4** has been the current stable since 2026-04-15. The `web-dev-general` skill default ("Next.js 15") predates that release. Recommend updating PROJECT.md to "Next.js 16" — no significant API change, and Next.js 14 is EOL as of 2025-10.

---

## v1.1 Additions: Publication Sync Stack

These are the **only new additions** for v1.1. The full v1.0 base stack (below) is unchanged.

### Synopsis

v1.1 adds a sync script (`scripts/sync-publications.ts`) that queries InspireHEP and arXiv, transforms results to match the existing `PublicationSchema`, and writes `content/publications.json`. A GitHub Actions cron job runs this weekly and commits the result, triggering a Vercel rebuild.

**New deps (runtime of the script, not of the Next.js app):**
- `fast-xml-parser` (devDependency — used only in the sync script, never shipped to browsers)

**No new runtime deps** in the Next.js bundle. `tsx`, `zod`, and native `fetch` already exist.

---

### 1. HTTP Client: Native `fetch` — no additional library

**Decision:** Use Node 22's built-in `fetch` (WHATWG-compliant, stable since Node 18). Do not add axios, got, or undici.

**Rationale:**
- Node 22 ships a full WHATWG `fetch` + `AbortController`. `AbortSignal.timeout(ms)` (Node 17.3+) is a single-line per-request timeout — no library needed.
- `undici` is what Node's `fetch` wraps internally; using it directly adds complexity with no benefit for two simple REST calls per sync run.
- `axios` would require an additional install + type package (`axios` + `@types/axios` if not bundled) and adds ~55 KB to the install. For a build-only script that is never bundled into the Next.js app, this is pure overhead.
- The existing `validate-content.mjs` and `generate-schemas.mjs` scripts use zero HTTP — keeping the pattern consistent means native APIs only.

**Timeout pattern:**
```ts
const res = await fetch(url, {
  signal: AbortSignal.timeout(10_000), // 10 s per request
});
if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
```

**Retry pattern** (no library — three lines):
```ts
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) return res;
      if (res.status === 429) {
        // InspireHEP rate limit: wait 5 s before retry
        await new Promise(r => setTimeout(r, 5_000));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2_000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}
```

**Confidence:** HIGH — Node 22 `fetch` and `AbortSignal.timeout` are stable documented APIs (MDN, Node.js docs).

---

### 2. TS Script Runner: `tsx` (already installed)

**Decision:** Use the existing `tsx@^4.21.0` already in `devDependencies`. No new tooling needed.

**Rationale:**
- `tsx` is already used for `scripts/validate-content.mjs` (via `tsx/esm` ESM loader) and is listed as a `devDependency` in `package.json`. Adding the sync script costs zero additional installs.
- `tsx` wraps esbuild and works in Node 22. It supports `tsconfig.json` `paths` aliases (`@/*`), which means the sync script can import `src/content/schemas/publications.schema.ts` directly using `@/content/schemas/publications.schema`.
- `ts-node` is NOT an alternative here: the project uses `"module": "esnext"` + `"moduleResolution": "bundler"` in `tsconfig.json` — `ts-node` requires additional `--esm` + `tsconfig-paths` setup to handle these. `tsx` handles them transparently.
- Bun would require installing a separate runtime in CI and is not already present. Unnecessary for a weekly cron job.
- `esbuild-node` / `esbuild --bundle` would require a build step producing a plain `.js` file. Adds complexity with no benefit for a script that runs once per week.

**Invocation (local):**
```bash
pnpm tsx scripts/sync-publications.ts
```

**Invocation (CI — see GitHub Action below):**
```bash
pnpm exec tsx scripts/sync-publications.ts
```

**Important:** The sync script is a `.ts` file (not `.mjs`) so it can use `import type` and TypeScript path aliases. Declare it in `tsconfig.json` `include` (it is already included via `**/*.ts`). The `--import tsx/esm` loader trick used in `.mjs` files is not needed for `.ts` files invoked via `tsx` CLI directly.

**Confidence:** HIGH — `tsx` 4.21.0 is current (last published ~5 months ago per npm), verified in the existing project.

---

### 3. XML Parser: `fast-xml-parser` v5.7.x

**Decision:** Add `fast-xml-parser` as a `devDependency` to parse arXiv's Atom 1.0 XML response.

**Rationale:**
- arXiv's API returns Atom 1.0 XML — there is no JSON alternative endpoint.
- `fast-xml-parser` is zero-dependency, pure JS, ESM + CJS, 26 KB minified. The latest version is **5.7.1** (released 2026-04-17).
- `xml2js` is the other common choice but uses callbacks and has a bulkier API. `fast-xml-parser` has a synchronous `XMLParser.parse()` with a clean options object — better fit for a sync script.
- Node's built-in XML/HTML parser (`DOMParser`) is not available in Node.js (it's a browser API). `@xmldom/xmldom` provides it but adds significant complexity vs. `fast-xml-parser`'s direct-to-object approach.
- The arXiv Atom feed uses namespace prefixes (`arxiv:doi`, `arxiv:journal_ref`). `fast-xml-parser` handles these natively with `ignoreAttributes: false` and maps namespace-prefixed elements as plain object keys.

**Install:**
```bash
pnpm add -D fast-xml-parser
```

**Parser configuration for arXiv Atom:**
```ts
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Atom <entry> may be a single object (not array) when only 1 result
  isArray: (name) => name === "entry" || name === "author" || name === "link" || name === "category",
});

const feed = parser.parse(xmlText);
const entries: AtomEntry[] = feed?.feed?.entry ?? [];
```

**Key `isArray` note:** `fast-xml-parser` collapses single-element arrays to plain objects by default. The `isArray` callback forces array wrapping for `entry`, `author`, `link`, and `category` — critical when an arXiv author query returns exactly one paper or one author.

**Confidence:** HIGH — official GitHub repository, npm page, version confirmed 5.7.1 (2026-04-17).

---

### 4. InspireHEP REST API

**Base URL:** `https://inspirehep.net/api/`

**Literature endpoint:** `GET https://inspirehep.net/api/literature`

**Author query by INSPIRE BAI (recommended):**
```
?q=a {BAI}&size=25&page=1&fields=titles,authors,arxiv_eprints,dois,publication_info,abstracts
```
Where BAI looks like `E.Calzetta.1`. This is the most stable identifier — scoped to a specific author profile, immune to name collisions.

**Author query by INSPIRE record ID:**
```
?q=ids.value:INSPIRE-{numeric_id}&size=25&page=1
```

**Pagination:** Use `page` + `size` parameters. The response contains `links.next` with the full URL for the next page. `size` max is 1000; default is 10. For academic authors, 25–50 per page is safe (most have < 200 papers).

**Rate limits:** 15 requests per 5-second window per IP. HTTP 429 on breach. The sync script processes at most 2–3 authors (one page each for a typical academic group) — well within limits. Add the 5 s wait in the 429 handler.

**Response shape (verified with live API, 2026-04-18):**
```json
{
  "hits": {
    "total": 126,
    "hits": [
      {
        "metadata": {
          "titles": [{ "title": "Semiclassical effects and the onset of inflation" }],
          "abstracts": [{ "source": "arXiv", "value": "..." }],
          "dois": [{ "value": "10.1103/PhysRevD.47.3184" }],
          "arxiv_eprints": [{ "categories": ["gr-qc"], "value": "gr-qc/9209007" }],
          "publication_info": [{
            "journal_title": "Phys.Rev.D",
            "journal_volume": "47",
            "year": 1993,
            "page_start": "3184",
            "page_end": "3193"
          }],
          "authors": [{
            "full_name": "Calzetta, Esteban",
            "ids": [{ "schema": "INSPIRE BAI", "value": "E.Calzetta.1" }]
          }],
          "control_number": 34567
        },
        "links": {
          "self": "https://inspirehep.net/api/literature/34567",
          "next": "https://inspirehep.net/api/literature/?q=...&page=2"
        }
      }
    ]
  },
  "links": {
    "self": "...",
    "next": "https://inspirehep.net/api/literature/?q=...&page=2"
  }
}
```

**Key mapping notes for `PublicationSchema`:**

| InspireHEP field | Schema field | Notes |
|---|---|---| 
| `metadata.titles[0].title` | `title` | Take first entry |
| `metadata.abstracts[0].value` | `abstract` | Take first entry |
| `metadata.arxiv_eprints[0].value` | `arxiv` | Old IDs use `hep-ph/9912345` format — strip prefix, or store as-is if schema regex allows |
| `metadata.dois[0].value` | `doi` | Take first; bare `10.xxx/...` format matches schema regex |
| `metadata.publication_info[0].journal_title` | `journal` | May append volume/year inline |
| `metadata.publication_info[0].year` | `year` | Integer |
| `metadata.authors[].full_name` | `authors[]` | Array of strings |

**arXiv ID format caveat (MEDIUM confidence):** Old InspireHEP records use pre-2007 arXiv IDs like `gr-qc/9209007`, `hep-ph/0204259`. The current `PublicationSchema` regex `^\d{4}\.\d{4,5}(v\d+)?$` rejects these. The schema will need to be updated OR old-format IDs should be stored in a separate field or omitted. Flag this for schema design in the milestone plan.

**Sources:** Live API call to `https://inspirehep.net/api/literature?q=a%20Calzetta&size=1&fields=...` (2026-04-18, HIGH confidence); [inspirehep/rest-api-doc README](https://github.com/inspirehep/rest-api-doc/blob/master/README.md) (HIGH confidence).

---

### 5. arXiv API

**Base URL:** `http://export.arxiv.org/api/query` (HTTP only — no HTTPS; the server redirects are inconsistent; use HTTP as documented)

**Fetch by arXiv ID (recommended for per-person sync):**
```
GET http://export.arxiv.org/api/query?id_list=2501.12345,2603.15744&max_results=50
```

**Fetch by author name (fallback — less precise):**
```
GET http://export.arxiv.org/api/query?search_query=au:Calzetta_E&max_results=50&sortBy=submittedDate&sortOrder=descending
```

**Per-person `arxiv_id` (the locked decision):** The milestone locks in explicit `arxiv_id` fields per person in `people.json`. For the `id_list` approach, collect all IDs from the group's people and batch them: `id_list=id1,id2,id3,...&max_results=200`. This is more reliable than name-search and avoids false positives.

**Rate limits:** No hard limit documented. arXiv requests a 3-second delay between sequential calls. For a weekly cron with < 20 IDs, a single batch call avoids this entirely.

**Response format:** Atom 1.0 XML. Parsed with `fast-xml-parser` as described above.

**Entry shape:**
```xml
<entry>
  <id>http://arxiv.org/abs/2501.12345v2</id>
  <title>Paper Title Here</title>
  <summary>Abstract text...</summary>
  <published>2025-01-20T00:00:00Z</published>
  <updated>2025-01-22T00:00:00Z</updated>
  <author><name>Calzetta, Esteban</name></author>
  <author><name>Gomez, L.</name></author>
  <arxiv:doi>10.1103/PhysRevD.112.023501</arxiv:doi>
  <arxiv:journal_ref>Phys. Rev. D 112 (2025) 023501</arxiv:journal_ref>
  <link rel="alternate" href="http://arxiv.org/abs/2501.12345v2"/>
  <link title="pdf" href="http://arxiv.org/pdf/2501.12345v2"/>
  <arxiv:primary_category term="astro-ph.CO"/>
</entry>
```

**Key mapping notes for `PublicationSchema`:**

| arXiv field | Schema field | Transform |
|---|---|---|
| `entry.id` text | `arxiv` | Strip `http://arxiv.org/abs/` prefix, strip version suffix `v2` → `2501.12345` |
| `entry.title` | `title` | Trim whitespace (arXiv titles often have leading/trailing `\n`) |
| `entry.summary` | `abstract` | Same whitespace trim |
| `entry.author[].name` | `authors[]` | Array; arXiv format is "Last, First" — consistent with InspireHEP |
| `entry["arxiv:doi"]` | `doi` | If present — optional |
| `entry["arxiv:journal_ref"]` | `journal` | If present; else `"Preprint"` |
| `entry.published` year | `year` | `new Date(entry.published).getFullYear()` |

**Source:** [arXiv API User's Manual](https://info.arxiv.org/help/api/user-manual.html) (HIGH confidence — official arXiv documentation, fetched 2026-04-18).

---

### 6. Script Location and TypeScript Integration

**Location:** `scripts/sync-publications.ts`

Consistent with `scripts/validate-content.mjs` and `scripts/generate-schemas.mjs`. The `scripts/` directory is the established pattern for build-adjacent tooling in this project.

**NOT a workspace package.** This is a single-file script, not a package boundary. Workspace packages add `package.json` overhead and pnpm workspace configuration — YAGNI for one script.

**TypeScript path aliases:** The sync script imports the existing `PublicationSchema` directly:
```ts
// scripts/sync-publications.ts
import { PublicationSchema, PublicationsSchema } from "@/content/schemas/publications.schema";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
```

The `@/*` alias resolves to `./src/*` per `tsconfig.json`. `tsx` honours `tsconfig.json` `paths` — no extra config needed. This is the same pattern used by `validate-content.mjs` which imports from `../src/content/schemas/*.ts`.

**Fallback pattern (DATA-08 requirement — last-good JSON on failure):**
```ts
const PUBLICATIONS_PATH = join(process.cwd(), "content/publications.json");

// Write atomically: only overwrite if validation passes
const merged = deduplicateAndMerge(inspireResults, arxivResults);
const validated = PublicationsSchema.safeParse(merged);
if (!validated.success) {
  console.error("Sync produced invalid data — keeping last-good JSON");
  console.error(validated.error.issues);
  process.exit(1); // GitHub Action sees non-zero exit, does not commit
}
writeFileSync(PUBLICATIONS_PATH, JSON.stringify(validated.data, null, 2));
```

Non-zero exit prevents `stefanzweifel/git-auto-commit-action` from committing, which preserves the last-good `content/publications.json` in the repo.

---

### 7. GitHub Action

**File location:** `.github/workflows/sync-publications.yml`

**Actions used:**

| Action | Version | Purpose |
|---|---|---|
| `actions/checkout` | v4 | Checkout repo (v4 is current stable as of 2026-04) |
| `pnpm/action-setup` | v5 | Install pnpm (v5.0.0 released 2026-03-17) |
| `actions/setup-node` | v4 | Node 20 LTS with pnpm cache (v4 is current stable) |
| `stefanzweifel/git-auto-commit-action` | v5 | Commit changed `content/publications.json` back to `main` |

**Note on action versions:** `actions/setup-node` v6 was referenced in one search result as "released March 4, 2026" — treat this as MEDIUM confidence and pin to `v4` (confirmed stable) until v6 is verifiable from the GitHub releases page. `actions/checkout` v4 is widely confirmed current.

**Full working workflow:**

```yaml
name: Sync Publications

on:
  schedule:
    # Every Monday at 06:00 UTC
    - cron: "0 6 * * 1"
  # Allow manual trigger for testing
  workflow_dispatch:

permissions:
  contents: write   # Required for git-auto-commit-action to push

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v5
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run publication sync
        run: pnpm exec tsx scripts/sync-publications.ts

      - name: Commit updated publications.json
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(content): sync publications from InspireHEP + arXiv"
          file_pattern: content/publications.json
          commit_user_name: "github-actions[bot]"
          commit_user_email: "41898282+github-actions[bot]@users.noreply.github.com"
```

**Why `--frozen-lockfile`:** Ensures CI uses exactly the lockfile versions. Fails loudly if `pnpm-lock.yaml` is out of sync — expected behaviour for a reproducible CI job.

**Why `pnpm/action-setup@v5` before `setup-node`:** The `pnpm/action-setup` action must run before `setup-node` so that `setup-node`'s `cache: "pnpm"` can find the pnpm binary and read `pnpm-lock.yaml` for cache key generation.

**Node version:** Pinned to `"20"` (LTS) rather than `"22"` to match the project's `engines.node: "20.x"` in `package.json`. Both support native `fetch` and `AbortSignal.timeout`. Do not upgrade Node in the action without also updating `engines.node`.

**`git-auto-commit-action` behaviour on no changes:** If `content/publications.json` is identical to the last run (no new papers), the action detects no dirty files and skips the commit. No spurious commits. No Vercel rebuild triggered. Correct behaviour.

**`file_pattern: content/publications.json`:** Scopes the commit to only the publications file. Prevents accidental commits of intermediate files if the script generates temp files.

**Vercel rebuild trigger:** Vercel watches the `main` branch. When `git-auto-commit-action` pushes a commit, Vercel automatically triggers a new build. No webhook configuration needed — this is the default Vercel + GitHub integration behaviour.

**Cron schedule notes:**
- `"0 6 * * 1"` = every Monday 06:00 UTC (Monday 03:00 Argentina time / 02:00 Buenos Aires winter)
- GitHub Actions cron has a known delay of up to 15 minutes during peak times — acceptable for a weekly publication sync
- InspireHEP and arXiv both update continuously; Monday morning is a reasonable cadence for an academic group site

---

### 8. Installation Summary (v1.1 only)

```bash
# One new devDependency
pnpm add -D fast-xml-parser

# No new runtime deps — native fetch, tsx, and zod are already present
```

Create the workflow directory:
```bash
mkdir -p .github/workflows
```

---

### 9. Alternatives Rejected for v1.1

| Recommended | Alternative | Why Rejected |
|---|---|---|
| Native `fetch` | `axios` | Extra install + `@types/axios`, ~55 KB, zero benefit for 2 API calls in a build script that never touches the browser |
| Native `fetch` | `got` | Same reasoning; also ESM-only which would require additional tsconfig gymnastics |
| Native `fetch` | `undici` | Node's `fetch` already uses `undici` internally; double-wrapping adds nothing |
| `tsx` (existing) | `ts-node` | Incompatible with `"moduleResolution": "bundler"` without a separate tsconfig; tsx already installed |
| `tsx` (existing) | Bun | Requires installing a second JS runtime in CI; not in the project's established toolchain |
| `fast-xml-parser` | `xml2js` | Callback-based API, older design; `fast-xml-parser` is synchronous and zero-dependency |
| `fast-xml-parser` | Native `DOMParser` | Not available in Node.js — browser API only |
| `fast-xml-parser` | `@xmldom/xmldom` | Provides `DOMParser` in Node but requires DOM traversal; more verbose than `fast-xml-parser`'s direct-to-object mapping |
| `stefanzweifel/git-auto-commit-action` | `git push` via raw shell | The action handles detached-HEAD guards, author config, dirty-check, and idempotency correctly; raw `git push` in CI is error-prone |
| `stefanzweifel/git-auto-commit-action` | `peter-evans/create-pull-request` | PR-per-sync adds reviewer overhead for a low-risk weekly data update; direct commit to `main` + Vercel rebuild is the stated decision |

---

## v1.0 Base Stack (Unchanged)

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

# v1.1 addition (sync script only — never shipped to browser)
pnpm add -D fast-xml-parser
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
| **`axios`** (in sync script) | No benefit over native fetch in Node 22; extra install for a build-only script. | Node 22 `fetch` + `AbortSignal.timeout`. |
| **`got`** (in sync script) | ESM-only; requires tsconfig adjustments; no benefit over native fetch. | Node 22 `fetch`. |
| **`node-fetch`** | Polyfill only needed for Node < 18; Node 22 has native fetch. Historical artifact. | Node 22 `fetch`. |
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
- Drop middleware (it doesn't execute at static-host edge anyway; next-intl routing still works via `generateStaticParams` + directory structure)
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
| fast-xml-parser@5.7.x | Node 20 / Node 22 | Pure JS, no native bindings. ESM + CJS. Zero deps. |
| tsx@4.21.x | Node 20 / Node 22, tsconfig `"moduleResolution": "bundler"` | Handles paths aliases; no separate tsconfig-paths plugin needed. |

---

## Quality Gate Checklist

- [x] Versions verified against official 2026-04 sources (Next.js blog, GitHub releases, next-intl releases, npm, live API) — not training data
- [x] Rationale explains WHY, not just WHAT — every recommendation cites a constraint from PROJECT.md or a measured downside of the alternative
- [x] Confidence levels assigned:
  - HIGH: Next.js, React, TypeScript, Tailwind, next-intl, Zod, `next/image`, Google Maps iframe approach, schema-dts, tsx, InspireHEP API shape (live verified), arXiv API (official docs fetched), native fetch/AbortSignal (MDN + Node.js docs)
  - MEDIUM: `pnpm/action-setup@v5` release date (claimed 2026-03-17 from WebFetch), `actions/setup-node` v6 existence (WebSearch only, pinned to v4), `stefanzweifel/git-auto-commit-action@v5` (v7.1.0 latest confirmed but v5 widely used in examples — use `v5` for safety)
  - LOW: `next-image-export-optimizer` (only a fallback suggestion; flag in PITFALLS)
- [x] Static-export compatibility flagged explicitly in the `next/image`, next-intl, and "Stack Patterns by Variant" sections
- [x] v1.1 arXiv ID regex incompatibility with pre-2007 IDs flagged (schema work needed in milestone plan)
- [x] GitHub Action YAML is complete and runnable (not a skeleton)

---

## Sources

**Official / HIGH confidence (v1.1 additions):**
- [arXiv API User's Manual](https://info.arxiv.org/help/api/user-manual.html) — base URL, parameters, Atom XML response shape, rate limits (fetched 2026-04-18)
- [inspirehep/rest-api-doc README](https://github.com/inspirehep/rest-api-doc/blob/master/README.md) — literature endpoint, pagination, rate limits (fetched 2026-04-18)
- Live API call: `https://inspirehep.net/api/literature?q=a%20Calzetta&size=1&fields=...` — response shape confirmed (2026-04-18)
- [fast-xml-parser GitHub](https://github.com/NaturalIntelligence/fast-xml-parser) — version 5.7.1 (2026-04-17), zero-dependency, ESM + CJS
- [fast-xml-parser docs v4 — XMLparseOptions](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md) — `ignoreAttributes`, `isArray`, `attributeNamePrefix`
- [pnpm/action-setup README](https://github.com/pnpm/action-setup) — v5.0.0 current, inputs
- [stefanzweifel/git-auto-commit-action action.yml](https://github.com/stefanzweifel/git-auto-commit-action/blob/master/action.yml) — v7.1.0 latest, all inputs, defaults
- [GitHub Docs — GITHUB_TOKEN permissions](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token) — `contents: write` requirement
- [MDN — AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) — Node 17.3+ stable
- [tsx.is](https://tsx.is/) — tsconfig paths support, CJS/ESM seamless mode

**Official / HIGH confidence (v1.0 base — unchanged):**
- [Next.js 16.2 release blog (2026-03-18)](https://nextjs.org/blog/next-16-2) — version, Turbopack stability, React 19.2
- [Next.js GitHub Releases](https://github.com/vercel/next.js/releases) — v16.2.4 (2026-04-15) confirmed current
- [Next.js Static Exports guide (v16.2.4, 2026-04-15)](https://nextjs.org/docs/app/guides/static-exports) — unsupported features list, image loader pattern
- [Next.js Image component API (v16.2.4, 2026-04-15)](https://nextjs.org/docs/app/api-reference/components/image) — `unoptimized`, `quality` requirement changes
- [next-intl GitHub Releases](https://github.com/amannn/next-intl/releases) — v4.9.1 (2026-04-10) confirmed current
- [next-intl Static Export issue #334 + azu/next-intl-example](https://github.com/azu/next-intl-example) — working pattern for `output: 'export'` with `[locale]` + `generateStaticParams`
- [schema-dts GitHub](https://github.com/google/schema-dts) — v2.0.0, Schema.org v30 coverage
- [Zod GitHub Releases](https://github.com/colinhacks/zod/releases) — v4.3.6 (2025-01), stable
- [web.dev: Best practices for embeds (facade pattern)](https://web.dev/articles/embed-best-practices) — Google Maps lazy loading & facade guidance

**Internal references (validated 2026-03 in landing-page project):**
- `/home/tomas/Projects/cosmo/references/patterns/i18n-next-intl.md` — complete next-intl setup pattern (App Router + `src/`)
- `/home/tomas/Projects/cosmo/references/patterns/seo-metadata.md` — `generateMetadata` + sitemap + robots + JSON-LD pattern
- `/home/tomas/Projects/cosmo/references/patterns/design-tokens-starter.md` — Tailwind v4 + OKLCH tokens + `next/font` pattern
- `/home/tomas/Projects/cosmo/references/patterns/layout-shell.md` — server/client header split with language toggle

**MEDIUM confidence:**
- [Tailwind CSS GitHub Releases](https://github.com/tailwindlabs/tailwindcss/releases) — v4.2.2 (release date per GitHub was 2025-03; community search claims 2026-02 — GitHub authoritative). Flagged as version-date ambiguity; impact is minor (v4.x API stable).
- [@vis.gl/react-google-maps OpenJS page](https://openjsf.org/blog/visgl-1.0-react-google-maps) — version 1.0 reached stable; used here to justify NOT adopting it.
- `actions/setup-node` v6 existence (WebSearch result; pinned to v4 in YAML as confirmed stable)

**LOW confidence (flag for phase-level revalidation):**
- Tailwind v4.2.2 exact release date — resolve during Phase 1 setup by running `npm view tailwindcss version`
- Exact font pairing for academic aesthetic — defer to Phase 1 `ui-ux-pro-max` design system run per `CLAUDE.md`
- `stefanzweifel/git-auto-commit-action` latest stable tag — check `https://github.com/stefanzweifel/git-auto-commit-action/releases` during workflow authoring and pin to the current major (v5 in YAML above is conservative; v7.1.0 appears to be latest)

---

*Stack research for: Cosmology Group Website (UBA / FCEN) — v1.0 base + v1.1 publication sync additions*
*Researched: 2026-04-17 (v1.0) / 2026-04-18 (v1.1)*
