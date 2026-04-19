# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 Phase 8 — Accessor Layer

## Current Position

Phase: 7 of 11 (Schema Extension) — COMPLETE
Plan: 07-02 complete (all plans in Phase 7 done)
Status: Phase 7 complete — ready for Phase 8 (Accessor Layer)
Last activity: 2026-04-19 — Completed 07-02-PLAN.md (BAI regex fix + orcid_id swap + tomas IDs)

Progress: [███████░░░░░░░░] 7/11 phases complete (v1.1 in progress; Phase 8 next)

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv, refreshed weekly at build time.

**Phase order:** 7 Schema → 8 Accessor → 9 Sync Script → 10 CI Wiring → 11 Display Layer

**Critical ordering rule:** Schema (7) must be atomic and green before anything else. Sync script (9) must validate locally before CI (10) is wired.

**Human dependency:** DATA-09 / DATA-10 (partial) — `tomas-ferreira-chase` populated; 13 members still need `inspirehep_id` + `orcid_id` before Phase 9 can be tested end-to-end. Follow-up data commit before Phase 9 E2E test.

## Shipped — v1.0 MVP (2026-04-18)

31 plans complete across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied.
Full archive: `.planning/milestones/v1.0-ROADMAP.md`

## Open Items Carried Forward (v1.0)

- PERF-04/05 deferred to Vercel production re-measurement (LCP + CLS numerical targets)
- NAV-04 mobile drawer 375px live-deploy check (structural done)
- `MobileNav.tsx:87` `focus:outline-none` flag (low risk)
- `SiteFooter.tsx:1` unused `next/link` import (flip on next edit)
- Hero "Grupo de Cosmología" title loses contrast on JWST starfield backgrounds — needs stronger text-shadow or dedicated gradient scrim (reported 2026-04-19)

## Accumulated Context

### v1.1 Key Decisions (locked 2026-04-18)

- Schema extension must be atomic (Zod + JSON Schema regeneration in one commit) — Pitfalls 1 + 7
- No arXiv name-based fallback — skip members without `arxiv_id`, never use `au:name` search — Pitfall 3
- Concurrency-limited InspireHEP queue (max 5 parallel, 2s pause, exponential backoff on 429) — Pitfall 2
- Deterministic sort before JSON serialization + `git diff --quiet` skip-commit guard — Pitfall 5
- Intra-run dedup by arXiv ID (prevents Planck/Euclid papers appearing once per co-author) — Pitfall 6
- `scripts/sync-publications.ts` uses relative imports, NOT `@/` alias — tsx does not resolve webpack aliases

### 07-01 Decisions (2026-04-19)

- `display_name_normalized` is REQUIRED (not optional) on PersonSchema — populated for all 15 current members in 07-02
- `publications_selected` deprecation is JSDoc-only — Zod shape unchanged; v1.2 removes it
- JSON Schemas regenerated in back-to-back commits (feat + chore) within phase — satisfies Pitfall 1 atomicity requirement

### 07-02 Decisions (2026-04-19)

- BAI regex widened to `/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/` — old regex rejected `S.J.Landau.1` and `Tomas.F.Chase.1`; latent bug from 07-01
- `arxiv_id` field on PersonSchema REPLACED with `orcid_id` (reuses `orcidId` shared helper) — ORCID is portable and supported by both arXiv + InspireHEP as author-query key; arXiv author-page slugs unavailable for most group members. `PublicationSchema.arxiv` (paper IDs) unaffected.
- Google Scholar `scholar_id` deferred to Phase 11 / v1.2 — no public API, useful as profile link only
- DATA-09/10 partial: 1 member populated this cycle; remaining 13 are follow-up data commit

### Blockers / Concerns

- DATA-09/10 partial: 13 members still need `inspirehep_id` + `orcid_id` (follow-up data commit before Phase 9 E2E test — not a code blocker)
- No arXiv name-based fallback — skip members without `inspirehep_id`, never use `au:name` search — Pitfall 3 (updated: `orcid_id` is the secondary query key, not `arxiv_id`)
- CI-08: Check if `main` has branch protection rules before Phase 10 — may need `github-actions[bot]` bypass

## Session Continuity

Last session: 2026-04-19
Stopped at: Completed 07-02-PLAN.md — Phase 7 complete; validate-content green; PersonSchema locked; ready for Phase 8
Resume file: None
