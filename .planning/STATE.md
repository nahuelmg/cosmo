# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 1 of TBD in current phase
Status: In progress
Last activity: 2026-04-17 — Completed 01-01-PLAN.md (Next.js 16 scaffold)

Progress: [█░░░░░░░░░] ~5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 5 min
- Total execution time: 0.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1/TBD | 5 min | 5 min |
| 2. Content Layer | 0/TBD | — | — |
| 3. Layout Shell | 0/TBD | — | — |
| 4. Core Pages | 0/TBD | — | — |
| 5. SEO & Discoverability | 0/TBD | — | — |
| 6. Polish (A11y & Performance) | 0/TBD | — | — |

**Recent Trend:**
- Last 5 plans: 01-01 (5 min)
- Trend: baseline established

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- Add nvm init to shell profile so pnpm works without sourcing manually each session.

### Blockers/Concerns

- **Node version environment:** pnpm and Next.js 16 commands require Node 20. Must source nvm before running: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`. Consider adding to .bashrc.

## Session Continuity

Last session: 2026-04-17T20:39:54Z
Stopped at: Completed 01-01-PLAN.md
Resume file: None — run `/gsd:execute-phase 01` to continue with next plan.
