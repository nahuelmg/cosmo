# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 6 (Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-04-17 — Roadmap created (6 phases, 75/75 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 0/TBD | — | — |
| 2. Content Layer | 0/TBD | — | — |
| 3. Layout Shell | 0/TBD | — | — |
| 4. Core Pages | 0/TBD | — | — |
| 5. SEO & Discoverability | 0/TBD | — | — |
| 6. Polish (A11y & Performance) | 0/TBD | — | — |

**Recent Trend:**
- Last 5 plans: (none yet)
- Trend: —

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

None yet.

## Session Continuity

Last session: 2026-04-17
Stopped at: Roadmap and STATE.md created; ready to plan Phase 1.
Resume file: None — run `/gsd:plan-phase 1` to begin.
