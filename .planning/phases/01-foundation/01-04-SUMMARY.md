---
phase: 01-foundation
plan: 04
subsystem: foundation/app-shell
tags: [next-font, tailwind-v4, oklch, i18n, greek-subset, source-serif-4, source-sans-3]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Next.js 16 scaffold with TypeScript strict and src/ directory structure
  - phase: 01-foundation/01-02
    provides: Locked design system (MASTER.md) with warm-academic OKLCH palette and font pair selection
  - phase: 01-foundation/01-03
    provides: next-intl routing, proxy, message seeds, and check-translations CI guard
provides:
  - src/app/fonts.ts with next/font/google wrappers for Source Serif 4 (serif) + Source Sans 3 (sans) with Latin + Latin-Extended + Greek subsets
  - src/app/globals.css rewritten with @import "tailwindcss", @theme inline font variable mapping, full OKLCH token set (surfaces, ink, accent, type scale, spacing, shadows)
  - src/app/[locale]/layout.tsx — locale-aware root layout with html lang binding, font variables, NextIntlClientProvider, setRequestLocale, generateStaticParams
  - src/app/[locale]/page.tsx — Phase 1 placeholder with site name, institution, Greek-notation probe (Λ Ω H₀ σ₈ χ² μ ρ θ) in both serif and sans
  - src/app/layout.tsx and src/app/page.tsx (Plan 01-01 placeholders) deleted to eliminate route conflict
  - All Phase 1 success criteria (FOUND-01..04, I18N-05..07) confirmed closed by user boot verification
affects: [03-layout-shell, 04-core-pages, 05-seo, 06-polish]

# Tech tracking
tech-stack:
  added: [next/font/google (Source Serif 4, Source Sans 3)]
  patterns:
    - "@theme inline pattern: binds next/font CSS variables to Tailwind font utilities (font-serif, font-sans)"
    - "locale-layout order: await params → hasLocale → notFound → setRequestLocale → render"
    - "async-page translation hook pattern: async page calls setRequestLocale then delegates to sync HomeContent for useTranslations"
    - "Greek subset self-hosting: next/font automatically self-hosts all subsets including Greek; no runtime Google Fonts requests"

key-files:
  created:
    - src/app/fonts.ts
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
  modified:
    - src/app/globals.css

key-decisions:
  - "Source Serif 4 + Source Sans 3 ratified as default font pair — both ship Greek on Google Fonts; Crimson Pro and Atkinson Hyperlegible disqualified in Plan 01-02"
  - "@theme inline chosen to bind next/font variables to Tailwind utilities — without inline, Tailwind compiles the literal font name and bypasses next/font subsetting"
  - "locale-layout order locked: hasLocale → notFound() → setRequestLocale → render (RESEARCH.md Pattern 5 / Pitfall #6)"
  - "Greek probe retained in [locale]/page.tsx until Phase 3 replaces it with the real layout shell"
  - "Root src/app/layout.tsx and src/app/page.tsx deleted — route conflict with [locale]/ routes; proxy from 01-03 guarantees all traffic is locale-prefixed"

patterns-established:
  - "Font variable injection: apply fontSerif.variable and fontSans.variable on <html> element, not <body>"
  - "OKLCH token set: surfaces (2 tiers), ink (3 levels), accent (+ hover + ring), type scale (1.2 ratio), spacing, shadows (2 tiers max)"
  - "No border tokens: focus rings via box-shadow only (per CONTEXT.md whitespace-hierarchy principle)"

# Metrics
duration: ~17min (code execution) + user checkpoint verification
completed: 2026-04-17
---

# Phase 1 Plan 04: App Shell Summary

**Source Serif 4 + Source Sans 3 self-hosted via next/font with Greek subset, OKLCH design tokens wired into Tailwind v4 via @theme inline, and locale-aware [locale]/layout.tsx with html lang binding — all 7 Phase 1 boot checks passed**

## Performance

- **Duration:** ~17 min (Task 1: 18:17 → Task 2: 18:34) + user verification checkpoint
- **Started:** 2026-04-17T18:17:56-03:00
- **Completed:** 2026-04-17T21:35:00-03:00 (including checkpoint)
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 5 (2 created, 1 rewritten, 2 deleted)

## Accomplishments

- Source Serif 4 + Source Sans 3 registered via next/font/google with Latin + Latin-Extended + Greek subsets; FOUT/FOIT eliminated; zero runtime requests to fonts.googleapis.com or fonts.gstatic.com confirmed in DevTools
- OKLCH token set written to globals.css with @theme inline font variable mapping — hot-swap verified (changing --color-accent updates rendered colour on HMR)
- [locale]/layout.tsx wired with async params, hasLocale guard, notFound(), setRequestLocale, generateStaticParams — closes FOUND-04 + I18N-05
- Greek-notation probe (Λ Ω H₀ σ₈ χ² μ ρ θ) confirmed rendering in both Source Serif 4 and Source Sans 3 in DevTools Coverage (Greek subset woff2 files loaded)
- All 7 Phase 1 boot checks approved by user; all 5 Phase 1 ROADMAP.md exit criteria satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire fonts.ts + globals.css OKLCH tokens + delete root-layout placeholders** - `a9ac184` (feat)
2. **Task 2: Write [locale]/layout.tsx + [locale]/page.tsx with Greek probe** - `e98f629` (feat)
3. **Task 3: Human boot verification** - checkpoint (no commit — human-verify gate)

**Plan metadata:** `(docs commit follows this summary)`

## Files Created/Modified

- `src/app/fonts.ts` — next/font/google wrappers: Source_Serif_4 with axes ['opsz'] and Greek subset; Source_Sans_3 with weights [400,600,700] and Greek subset; both export as --font-serif / --font-sans CSS variables
- `src/app/globals.css` — rewritten: @import "tailwindcss", @theme inline font vars, @theme OKLCH token set (surfaces, ink 3-level, accent+hover+ring, type scale 1.2 ratio, spacing, 2-tier shadows), body + h1-h4 base styles; no border tokens
- `src/app/[locale]/layout.tsx` — locale root layout: async params, hasLocale guard, notFound(), setRequestLocale, font variables on <html lang={locale}>, NextIntlClientProvider (no explicit messages prop), generateStaticParams
- `src/app/[locale]/page.tsx` — Phase 1 placeholder: async page calls setRequestLocale, delegates to HomeContent (sync) for useTranslations('meta'); renders siteName, institution, Greek probe in both serif and sans
- `src/app/layout.tsx` — DELETED (was Plan 01-01 placeholder, conflicted with [locale]/ routing)
- `src/app/page.tsx` — DELETED (was Plan 01-01 placeholder, conflicted with [locale]/ routing)

## Decisions Made

- **Source Serif 4 + Source Sans 3 ratified:** Font pair locked in Plan 01-02 was confirmed as-is; OVERRIDES.md had no alternative selection recorded. axes: ['opsz'] added to Source Serif 4 for optical-size axis (crisper display weights at larger sizes per RESEARCH.md Pitfall #4).
- **@theme inline for font utilities:** This is the critical binding pattern — without `inline`, Tailwind resolves the font name literally and bypasses next/font's subsetting pipeline. Any future font change must maintain this pattern.
- **locale-layout order locked:** The exact order (await params → hasLocale → notFound → setRequestLocale → render) is required by next-intl for static rendering. Deviation from this order breaks static export.
- **Greek probe retained until Phase 3:** The probe rows in page.tsx will remain until the real layout shell (Phase 3) replaces page.tsx entirely. This gives visual confirmation that Greek subset remains wired across future changes.
- **Root layout/page deleted:** The Plan 01-01 placeholders at src/app/layout.tsx and src/app/page.tsx were deleted. The proxy from Plan 01-03 guarantees all traffic arrives with a locale prefix, so no route at the root level is needed.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Both auto tasks completed cleanly. The human-verify checkpoint (Task 3) confirmed all 7 checks passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 complete: all 6 ROADMAP.md requirements (FOUND-01..04, I18N-05..07) verified and closed
- `src/app/[locale]/layout.tsx` is the root shell for all future pages — Phase 3 (layout shell) builds on top of this with header, nav, footer
- `src/app/[locale]/page.tsx` is a placeholder — Phase 4 (core pages) replaces its content with the real home page
- `src/app/globals.css` OKLCH tokens are the sole source of truth for design tokens — Phase 3 components consume via Tailwind utilities (bg-surface, text-ink, font-serif, etc.)
- `pnpm check-translations` is CI-ready; no blockers for Phase 2 (Content Layer)

---
*Phase: 01-foundation*
*Completed: 2026-04-17*
