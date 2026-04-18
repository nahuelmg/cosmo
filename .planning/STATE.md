# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 Phase 7 — Schema Extension (atomic prerequisite)

## Current Position

Phase: 7 of 11 (Schema Extension)
Plan: —
Status: Ready to plan
Last activity: 2026-04-18 — v1.1 ROADMAP.md created; phases 7–11 defined

Progress: [██████░░░░░░░░░] 6/11 phases complete (v1.0 done; v1.1 starting)

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv, refreshed weekly at build time.

**Phase order:** 7 Schema → 8 Accessor → 9 Sync Script → 10 CI Wiring → 11 Display Layer

**Critical ordering rule:** Schema (7) must be atomic and green before anything else. Sync script (9) must validate locally before CI (10) is wired.

**Human dependency:** DATA-09 / DATA-10 — maintainer must populate `inspirehep_id` (BAI) and `arxiv_id` in `content/people.json` for all current members before Phase 9 can be tested end-to-end. Scheduled as Plan 07-02.

## Shipped — v1.0 MVP (2026-04-18)

31 plans complete across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied.
Full archive: `.planning/milestones/v1.0-ROADMAP.md`

## Open Items Carried Forward (v1.0)

- PERF-04/05 deferred to Vercel production re-measurement (LCP + CLS numerical targets)
- NAV-04 mobile drawer 375px live-deploy check (structural done)
- `MobileNav.tsx:87` `focus:outline-none` flag (low risk)
- `SiteFooter.tsx:1` unused `next/link` import (flip on next edit)

## Accumulated Context

### v1.1 Key Decisions (locked 2026-04-18)

- Schema extension must be atomic (Zod + JSON Schema regeneration in one commit) — Pitfalls 1 + 7
- No arXiv name-based fallback — skip members without `arxiv_id`, never use `au:name` search — Pitfall 3
- Concurrency-limited InspireHEP queue (max 5 parallel, 2s pause, exponential backoff on 429) — Pitfall 2
- Deterministic sort before JSON serialization + `git diff --quiet` skip-commit guard — Pitfall 5
- Intra-run dedup by arXiv ID (prevents Planck/Euclid papers appearing once per co-author) — Pitfall 6
- `scripts/sync-publications.ts` uses relative imports, NOT `@/` alias — tsx does not resolve webpack aliases

### Blockers / Concerns

- DATA-09/10: Human action required in Phase 7 (Plan 07-02) — sync script cannot be end-to-end tested without real BAI IDs
- CI-08: Check if `main` has branch protection rules before Phase 10 — may need `github-actions[bot]` bypass

## Session Continuity

Last session: 2026-04-18
Stopped at: ROADMAP.md written; ready for `/gsd:plan-phase 7`
Resume file: None
