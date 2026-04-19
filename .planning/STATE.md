# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 Phase 9 — Sync Script

## Current Position

Phase: 9 of 11 (Sync Script) — IN PROGRESS
Plan: 09-02 complete (3 plans total in Phase 9; 09-03 next)
Status: In progress — 09-02 extraction layer complete; ready for 09-03 (write gate)
Last activity: 2026-04-19 — Completed 09-02-PLAN.md (extraction helpers, dedup, merge, wired main())

Progress: [█████████░░░░░░] 9/11 phases started (09-01 + 09-02 done; 09-03 remains)

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
- `MobileNav.tsx:38` `react-hooks/set-state-in-effect` ESLint error — `setOpen(false)` in `useEffect` on `[pathname]`. Pre-existing on main before Phase 8; caught by `pnpm lint` after React 19 / eslint-config-next upgrade. Fix on next MobileNav edit — low risk, closes a drawer on route change which is the intended UX.
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

### 09-02 Decisions (2026-04-19)

- `require.main === module` guard required — tsx CJS module executes `main()` on import without it; guard prevents test runs from triggering I/O
- TypeScript strict mode rejects `?? ||` mixing — year resolution uses `Number.isFinite(parsedPreprintYear)` guard instead of `|| currentYear` fallback
- `vitest.config.ts` include must cover `scripts/**/*.test.ts` — was src/ only; scripts/ tests were not discovered
- Live run confirmed: `tomas-ferreira-chase — InspireHEP: 4, arXiv: 3`; 14 other members have no IDs (DATA-09/10 partial)
- Determinism confirmed: two back-to-back runs produce identical output

### 09-01 Decisions (2026-04-19)

- `fast-xml-parser@5.7.1` isArray callback requires `string | MatcherView` union — `typeof jpath === "string"` guard needed before `Set.has()` in TypeScript strict mode
- `isVerbose` declared at module level (not threaded as parameter) — idiomatic for single-process CLI scripts
- Live API confirmed: InspireHEP returns 4 hits for `Tomas.F.Chase.1`; arXiv returns 3 entries for ORCID `0009-0001-0286-2136`
- `fetchInspireHEP`, `fetchArXiv`, `fetchWithRetry`, `runBatched`, `xmlParser`, `BAI_REGEX` exported for 09-02 extraction layer

### 08-01 Decisions (2026-04-19)

- `getPublicationsByAuthor` is caller-provides-variants — no `Person` dependency, no `deriveNameVariants` helper (deferred to Phase 11 / v1.2). Guarantees ACC-05 structurally: `src/content/accessors/publications.ts` has zero imports from `people.ts`.
- Normalization reuses `normalizeName` from `shared.ts` (NFD-decompose → strip combining marks → lowercase) — symmetry with `PersonSchema.display_name_normalized` means ASCII variants match accented author strings without extra transform.
- 4-char minimum variant length (post-normalization) silently filters initials ("F.", "J.") — returns `[]` when all variants are short.
- `lastNYears: 0` is valid (current-year only) — guard is `options?.lastNYears !== undefined`, not truthiness. Locked distinction from unset.
- Results pre-sorted: year desc → arXiv ID desc (`localeCompare`) → no-arXiv entries last within year bucket. Non-mutating (uses `[...publications]`).
- Vitest 3.2.4 is the project's first unit-test runner — colocated `.test.ts` files beside source, `pnpm test` runs once (CI-friendly), `@` alias in `vitest.config.ts` mirrors tsconfig paths.
- `src/content/index.ts` unchanged — existing `export * from "./accessors/publications"` wildcard auto-re-exports the new function (ACC-04 satisfied). In-test `toBe` identity check proves wildcard coverage at runtime.

### Blockers / Concerns

- DATA-09/10 partial: 13 members still need `inspirehep_id` + `orcid_id` (follow-up data commit before Phase 9 E2E test — not a code blocker)
- No arXiv name-based fallback — skip members without `inspirehep_id`, never use `au:name` search — Pitfall 3 (updated: `orcid_id` is the secondary query key, not `arxiv_id`)
- CI-08: Check if `main` has branch protection rules before Phase 10 — may need `github-actions[bot]` bypass

## Session Continuity

Last session: 2026-04-19
Stopped at: Completed 09-02-PLAN.md — extraction helpers + wired main() live-verified; ready for 09-03 (write gate)
Resume file: None
