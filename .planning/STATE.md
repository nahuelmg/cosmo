# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20 after v1.3 roadmap creation)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.3 — ORCID Sync & Cross-Source Dedup. Phase 16 complete; Phase 17 (ORCID Fetcher) is next.

## Current Position

Phase: 17 of 4 (ORCID Fetcher)
Plan: 1 of 3 complete
Status: In progress
Last activity: 2026-04-20 — Completed 17-01-PLAN.md (fixtures + 503 retry)

Progress: [██░░░░░░░░] 25% (v1.3 — 1/4 phases, 1/3 plans in phase 17 complete)

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

## Accumulated Decisions (v1.3)

| Plan  | Decision | Rationale |
|-------|----------|-----------|
| 16-01 | orcid and deduped counts are REQUIRED fields in PublicationsMetaSchema | Defensive optionals would mask sync script bugs; the script always writes these values |
| 16-01 | Schema change + content/publications.json patch bundled in one commit | Avoids validate-content regression window between schema update and data patch |
| 16-03 | mergePublications refactored to single-arg signature | 3-arg shape would require pre-concat anyway for DOI dedup; single-arg removes vestigial parameters |
| 16-03 | DOI dedup runs before final sort | Sort scrambles source-priority order; dedup must preserve first-seen-wins before ordering is lost |
| 16-03 | No empty-ORCID warning in Phase 16 stub | Stub always returns []; Phase 17 handles real no-results warnings contextually |
| 17-01 | 503 retry added to shared fetchWithRetry wrapper (not per-service config) | ORCID returns 503 on burst-exceed; arXiv/InspireHEP also benefit from brief 503 retry on downtime |
| 17-01 | Fixtures copied verbatim with cp (not Read/Write tools) | Preserves byte-exact encoding including UTF-8 accented chars in contributor names |

## Session Continuity

Last session: 2026-04-20 — Phase 17 plan 01 executed. Fixtures copied, 503 retry landed, 76→78 tests green.
Stopped at: Completed 17-01-PLAN.md; 17-02 (extraction) and 17-03 (enrichment) are next.
Resume file: None
