---
phase: 01-foundation
verified: 2026-04-17T21:50:00Z
status: passed
score: "28/28"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** The project boots end-to-end as a bilingual Next.js app with a locked design system and i18n routing, so every subsequent phase builds on stable foundations.
**Verified:** 2026-04-17T21:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pnpm dev` boots; `/` redirects to `/es`; `/es` and `/en` render with correct `lang` attributes | ✓ VERIFIED | `curl -sI localhost:3000/` → `307 + Location: /es`; `lang="es"` and `lang="en"` confirmed in live HTML |
| 2 | Design system MASTER.md exists with warm-academic OKLCH palette, serif+sans+Greek typography | ✓ VERIFIED | `design-system/cosmology-group-uba/MASTER.md` at 226 lines; accent `oklch(0.52 0.12 45)` hue=45° (within 30–80° band); Source Serif 4 + Source Sans 3 with Greek subsets documented |
| 3 | `globals.css` defines OKLCH design tokens wired into Tailwind v4 via `@theme inline`; no `--border-*` tokens | ✓ VERIFIED | `@theme inline` present; all tokens use `oklch()`; grep for `--border-` returns nothing |
| 4 | Self-hosted fonts load with Latin + Latin-Extended + Greek subsets; no external font requests | ✓ VERIFIED | `fonts.ts` exports both fonts with `subsets: ['latin', 'latin-ext', 'greek']`; `@theme inline` binding confirmed; FOUT/FOIT eliminated per user checkpoint in 01-04-SUMMARY.md |
| 5 | `pnpm check-translations` fails CI when a key is missing; dev logs warning, prod returns key without crashing | ✓ VERIFIED | Under Node 20: exits 1 with table of missing keys when a key deleted from `en.json`; exits 0 when keys match; `request.ts` implements `MISSING_MESSAGE` handler with dev-warn / prod-key-path fallback |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | `"next": "^16"`, `"next-intl": "^4.9.1"`, `"@lingual/i18n-check": "^0.9.3"` | ✓ VERIFIED | `"^16.2.4"`, `"^4.9.1"`, `"^0.9.3"` |
| `tsconfig.json` | `"strict": true` | ✓ VERIFIED | Present |
| `postcss.config.mjs` | declares `@tailwindcss/postcss` | ✓ VERIFIED | Present |
| `src/app/globals.css` | `@import "tailwindcss"`, `@theme inline`, full OKLCH tokens, no `--border-*` | ✓ VERIFIED | All confirmed; 10 OKLCH tokens present |
| `design-system/cosmology-group-uba/MASTER.md` | ≥ 80 lines, warm OKLCH palette, serif+sans+Greek | ✓ VERIFIED | 226 lines; all palette/typography requirements met |
| `design-system/cosmology-group-uba/OVERRIDES.md` | ≥ 15 lines, cites CONTEXT.md on every override row | ✓ VERIFIED | 131 lines; 15 CONTEXT.md citations counted |
| `src/proxy.ts` | Exists (not `src/middleware.ts`) | ✓ VERIFIED | `proxy.ts` present; `middleware.ts` absent |
| `src/i18n/routing.ts` | `locales: ["es","en"]`, `defaultLocale: "es"`, `localePrefix: "always"`, `localeDetection: false`, 7 routes + `/people/[slug]` | ✓ VERIFIED | All values confirmed (double-quote syntax); 8 pathnames entries covering all required routes |
| `src/i18n/navigation.ts` | Exports `Link/redirect/usePathname/useRouter/getPathname` via `createNavigation(routing)` | ✓ VERIFIED | Single named export with all 5 members destructured |
| `src/i18n/request.ts` | `getRequestConfig` with `IntlErrorCode.MISSING_MESSAGE` handling | ✓ VERIFIED | Dev-warn + prod-key-path fallback both implemented |
| `next.config.ts` | Wraps with `createNextIntlPlugin('./src/i18n/request.ts')` | ✓ VERIFIED | Present |
| `messages/es.json` + `messages/en.json` | Identical nested key sets | ✓ VERIFIED | Deep `jq` path diff returns empty (perfect parity); 4 top-level namespaces: `footer`, `locale`, `meta`, `nav` |
| `src/global.d.ts` | Augments next-intl `AppConfig` | ✓ VERIFIED | `AppConfig` augmentation present |
| `src/app/fonts.ts` | Exports `fontSerif` + `fontSans` with `subsets: ['latin', 'latin-ext', 'greek']` | ✓ VERIFIED | Source Serif 4 with `axes: ['opsz']`; Source Sans 3 with weights `[400, 600, 700]`; both subsets confirmed |
| `src/app/[locale]/layout.tsx` | `generateStaticParams`, `hasLocale` guard, `setRequestLocale`, `lang={locale}`, font variable injection, `NextIntlClientProvider` | ✓ VERIFIED | All 6 elements present; order locked per next-intl pattern |
| `src/app/[locale]/page.tsx` | Greek probe (Λ Ω H₀ σ₈ χ²) | ✓ VERIFIED | Full probe `Λ Ω H₀ σ₈ χ² μ ρ θ` in both serif and sans variants |
| `src/app/layout.tsx` | DELETED (Plan 01-01 placeholder) | ✓ VERIFIED | File does not exist |
| `src/app/page.tsx` | DELETED (Plan 01-01 placeholder) | ✓ VERIFIED | File does not exist |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `[locale]/layout.tsx` | `fonts.ts` | `import { fontSerif, fontSans }` | ✓ WIRED | Variables injected on `<html>` element |
| `[locale]/layout.tsx` | `globals.css` | `import '@/app/globals.css'` | ✓ WIRED | Single import point for all OKLCH tokens |
| `[locale]/layout.tsx` | `next-intl` | `NextIntlClientProvider`, `setRequestLocale`, `hasLocale` | ✓ WIRED | Full locale pipeline: guard → static lock → client bridge |
| `request.ts` | `routing.ts` | `import { routing }` + fallback to `routing.defaultLocale` | ✓ WIRED | Missing-locale falls back to `"es"` |
| `navigation.ts` | `routing.ts` | `createNavigation(routing)` | ✓ WIRED | All 5 navigation exports derive from routing config |
| `next.config.ts` | `request.ts` | `createNextIntlPlugin('./src/i18n/request.ts')` | ✓ WIRED | Plugin path explicitly targets request config |
| `globals.css` `@theme inline` | `fonts.ts` CSS variables | `--font-serif` / `--font-sans` binding | ✓ WIRED | Tailwind `font-serif` / `font-sans` utilities resolve via next/font subsetting pipeline |
| OKLCH tokens | Tailwind utilities | `@theme { --color-* }` | ✓ WIRED | `bg-surface`, `text-ink`, etc. confirmed in layout body class |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| FOUND-01 (Next.js 16 scaffold) | ✓ SATISFIED | `"^16.2.4"`, `pnpm build` produces optimized output, `pnpm typecheck` clean |
| FOUND-02 (Design system locked) | ✓ SATISFIED | MASTER.md (226 lines) + OVERRIDES.md (131 lines, 15 CONTEXT.md citations) |
| FOUND-03 (OKLCH tokens in Tailwind v4) | ✓ SATISFIED | `@theme inline` + `@theme` token blocks; no `--border-*` tokens |
| FOUND-04 (Self-hosted fonts, Greek subset) | ✓ SATISFIED | next/font self-hosting; `['latin', 'latin-ext', 'greek']` on both families; user visually confirmed in DevTools |
| I18N-05 (Locale routing, `html lang`) | ✓ SATISFIED | 307 redirect `/` → `/es`; `lang="es"` / `lang="en"` confirmed live |
| I18N-06 (Dev-warn, prod-silent for missing keys) | ✓ SATISFIED | `request.ts` onError + getMessageFallback pattern wired |
| I18N-07 (CI key-parity guard) | ✓ SATISFIED | `pnpm check-translations` exits 1 on missing key, 0 on parity (Node 20 required — nvm is the correct runtime for this project) |

---

## Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `src/app/[locale]/page.tsx` | `Phase 1 placeholder — replaced in Phase 3` comment | ℹ️ Info | Intentional — Plan 01-04 explicitly retains Greek probe until Phase 3 replaces the home page |

No blocker or warning anti-patterns found.

---

## Human Verification Required

### 1. FOUT/FOIT Visual Confirmation

**Test:** Open `http://localhost:3000/es` in a browser with throttled network; observe font render on first load and subsequent loads.
**Expected:** No flash of unstyled text; fonts appear immediately from self-hosted woff2 files.
**Why human:** Cannot verify font rendering timing programmatically.
**Status:** Already confirmed by user in Plan 01-04 Task 3 checkpoint (01-04-SUMMARY.md line 72: "FOUT/FOIT eliminated; zero runtime requests to fonts.googleapis.com or fonts.gstatic.com confirmed in DevTools").

### 2. Greek Subset Visual Rendering

**Test:** Open `http://localhost:3000/es` in a browser; inspect the Greek probe line (Λ Ω H₀ σ₈ χ² μ ρ θ) in DevTools Coverage to confirm Greek woff2 files are loaded.
**Expected:** Greek glyphs render in Source Serif 4 (serif line) and Source Sans 3 (sans line), not in a system fallback.
**Why human:** Visual glyph rendering and DevTools Coverage cannot be verified by file inspection.
**Status:** Already confirmed by user in Plan 01-04 Task 3 checkpoint (01-04-SUMMARY.md line 75: "Greek-notation probe confirmed rendering in both fonts in DevTools Coverage").

---

## Notes on Node Version

`pnpm check-translations` requires Node ≥ 20 (the `@lingual/i18n-check` dependency `@formatjs/cli-lib` is ESM and requires Node 20+ for CJS interop via the package's require path). The project's development runtime is Node 20 via nvm (`nvm use default` → v20.20.2). Running the command under system Node 18 (`/usr/bin/node`) produces an `ERR_REQUIRE_ESM` error. The fix is to always run `pnpm` commands from a shell with nvm active, or to add `engines: { node: ">=20" }` to `package.json` as a documentation guard. This is an environment configuration note, not a code gap — the tool functions correctly under the correct runtime.

---

## Build Verification

```
pnpm typecheck   → clean (0 errors)
pnpm build       → ✓ Generating static pages (5/5); /es and /en as SSG routes
pnpm check-translations (Node 20) → "No missing keys found!" exit 0
Live boot:
  GET /          → 307 Location: /es
  GET /es        → 200, lang="es", "Grupo de Cosmología" ×4
  GET /en        → 200, lang="en", "Cosmology Group" ×4
```

---

_Verified: 2026-04-17T21:50:00Z_
_Verifier: Claude (gsd-verifier)_
