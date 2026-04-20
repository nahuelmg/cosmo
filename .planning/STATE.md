# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20 after v1.3 roadmap creation)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.3 — ORCID Sync & Cross-Source Dedup. Phase 16: Schema & Sync Infrastructure.

## Current Position

Phase: 16 (planning)
Plan: —
Status: Ready for `/gsd:plan-phase 16`
Last activity: 2026-04-20 — v1.3 roadmap created (Phases 16–19). 28 requirements mapped across 4 phases.

Progress: [░░░░░░░░░░] 0% (v1.3)

## Shipped Milestones

- **v1.0 MVP** (2026-04-18) — 31 plans across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- **v1.1 arXiv + InspireHEP Publication Sync** (2026-04-19) — 13 plans across 6 phases (7–12). 321 real publications auto-synced from InspireHEP + arXiv; weekly GitHub Actions cron; 45/48 requirements complete + 2 softened + 2 partial. Archive: `.planning/milestones/v1.1-ROADMAP.md`
- **v1.2 Aesthetic Polish** (2026-04-20) — 13 plans across 3 phases (13–15). Typography + spacing + media + interactive + documentation polish; 26/26 requirements complete; 11/11 cross-phase wiring + 5/5 E2E flows verified; CI drift gate installed. Archive: `.planning/milestones/v1.2-ROADMAP.md`

## Open Items Carried Forward (v1.3+)

**v1.2 post-milestone doc drift:**
- Commit `1cf9cf8` (after Phase 15 seal): MASTER.md Component Specs "Nav Link" + OVERRIDES.md v1.2 row 11 still describe `text-sm + py-1.5` — override from `text-lg + max-w-6xl` not recorded
- Commit `b3f697c` (after Phase 15 seal): verify MASTER.md HeroCarousel recipe still matches tagline-removed state
- Desktop NavLink explicitly has no `focus-visible:ring-*` — inherits UA default; revisit on live site

**v1.1 code cleanup (deferred):**
- Remove `publications_selected` Zod field, orphaned accessor exports, dead `people.selectedPublications` i18n key
- Update REQUIREMENTS.md PR-flow description (pushes direct-to-main per Phase 10 decision)

## Session Continuity

Last session: 2026-04-20 — v1.3 roadmap created via `gsd-roadmapper`. Phases 16–19 defined; 28 v1.3 requirements mapped; ROADMAP.md + STATE.md + REQUIREMENTS.md written.
Stopped at: Roadmap complete, awaiting user approval then commit.
Resume file: None
