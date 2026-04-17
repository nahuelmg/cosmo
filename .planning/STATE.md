# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 4 of 4 in current phase
Status: All Phase 1 plans complete — ready for phase verification
Last activity: 2026-04-17 — Phase 1 Foundation plans complete; awaiting phase verification

Progress: [████░░░░░░] ~20%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~14 min
- Total execution time: ~0.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~57 min | ~14 min |
| 2. Content Layer | 0/TBD | — | — |
| 3. Layout Shell | 0/TBD | — | — |
| 4. Core Pages | 0/TBD | — | — |
| 5. SEO & Discoverability | 0/TBD | — | — |
| 6. Polish (A11y & Performance) | 0/TBD | — | — |

**Recent Trend:**
- Last 5 plans: 01-01 (5 min), 01-02 (~30 min including checkpoint), 01-03 (4 min), 01-04 (~17 min code + checkpoint)
- Trend: Pure execution plans running 4–5 min; checkpoint plans 17–30 min; 01-02 outlier due to user decision checkpoint

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Vercel-only deployment (no dual-build) — avoids static-export CI overhead.
- Foundation: next-intl with Spanish default, English toggle — locks URL structure from Phase 1.
- Content: JSON/YAML content files with Zod validation over a CMS — academic maintainers edit infrequently.
- Home: Keep auto-fade hero carousel despite anti-pattern flag — ≥6s dwell + `prefers-reduced-motion` respected.
- Publications: Defer arXiv/ADS importer to v2 — placeholder data validates layout now.

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | lint=eslint src (not next lint) | next lint removed from Next.js 16 CLI |
| 01-01 | tsconfig excludes ui-ux-pro-max/skills/references/.planning/ | Default **/*.ts glob picked up non-project TS files |
| 01-01 | Node 20 via nvm required | System had Node 18; Next.js 16 requires >=20.9.0 |
| 01-02 | Warm-academic palette at hue 45° (muted terracotta accent) | CONTEXT.md: warm band 30°–80°; cool blues rejected |
| 01-02 | Source Serif 4 + Source Sans 3 font pair | Greek subset required; Crimson Pro + Atkinson Hyperlegible disqualified (no Greek on Google Fonts) |
| 01-02 | No-border policy: focus rings via box-shadow only | CONTEXT.md: hierarchy via typography and whitespace alone |
| 01-02 | Two-tier surface: primary oklch(0.995 0.003 85) + alt oklch(0.978 0.008 80) | CONTEXT.md: max two surface tiers |
| 01-02 | Type scale ratio 1.2, H1=2rem | CONTEXT.md: restrained display scale (28–32px) |
| 01-02 | Shadow ceiling at --shadow-md; --shadow-lg/xl removed | Nature long-form aesthetic; whitespace hierarchy principle |
| 01-03 | journal-club stays English in both locales | International domain lexicon; Spanish speakers recognise it |
| 01-03 | localeDetection: false — / always → /es | Argentine-first, canonical-friendly, no Accept-Language sniffing |
| 01-03 | dev-warn/prod-silent i18n error policy | I18N-06: dev visibility + production silence on missing keys |
| 01-04 | @theme inline for font utilities | Without inline, Tailwind resolves font name literally and bypasses next/font subsetting pipeline |
| 01-04 | locale-layout order locked: hasLocale → notFound → setRequestLocale → render | Required by next-intl for static rendering; deviation breaks SSG |
| 01-04 | Greek probe retained in page.tsx until Phase 3 | Visual confirmation Greek subset stays wired across future changes |
| 01-04 | Root layout.tsx + page.tsx deleted | Proxy from 01-03 guarantees locale-prefixed traffic; no root route needed |

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- Add nvm init to shell profile so pnpm works without sourcing manually each session.

### Blockers/Concerns

- **Node version environment:** pnpm and Next.js 16 commands require Node 20. Must source nvm before running: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`. Consider adding to .bashrc.

## Session Continuity

Last session: 2026-04-17T21:35:00Z
Stopped at: Phase 1 complete, verification pending
Resume file: None — run `/gsd:complete-phase 01` to run phase verification and close Phase 1.
