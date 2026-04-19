# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 Phase 11 — Display Layer

## Current Position

Phase: 11 of 11 (Display Layer) — COMPLETE
Plan: 11-03 complete (profile publications section — final Wave 2 plan); all 3 plans done
Status: Phase 11 COMPLETE — all plans shipped; pnpm build 45/45 routes, check-translations 0 drift, 65/65 tests passing
Last activity: 2026-04-19 — Completed 11-03-PLAN.md (profile publications section + legacy selectedPubs removal)

Progress: [██████████████] Phase 11 complete — v1.1 Display Layer milestone DONE

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv, refreshed weekly at build time.

**Phase order:** 7 Schema → 8 Accessor → 9 Sync Script → 10 CI Wiring → 11 Display Layer

**Critical ordering rule:** Schema (7) must be atomic and green before anything else. Sync script (9) must validate locally before CI (10) is wired.

**Human dependency:** DATA-09 / DATA-10 (partial) — `tomas-ferreira-chase` populated; 13 members still need `inspirehep_id` + `orcid_id` for full-group E2E. Phase 9 E2E with 1 member is complete; full-group pagination stress test deferred to data follow-up.

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

### 09-03 Decisions (2026-04-19)

- Cross-source arXiv ID dedup applied after `mergePublications` — InspireHEP + arXiv ORCID feed both return entries with the same arXiv ID; merged array fails `superRefine` without global dedup. Fix: `dedupByArxivId(preMerged)` where InspireHEP wins (merge order: manual → inspire → arxiv)
- `generate-schemas.mjs` updated to emit `PublicationsFileSchema` — `publications.schema.json` now describes wrapped `{ _meta, publications }` shape
- Accessor defensive bridge (safeParse → fallback) committed in Task 1 and removed in Task 3 within the same plan — avoids task-ordering hazard without a separate bridge-removal plan
- `readAllExistingEntries()` exported separately from `readManualEntries()` — handles all three file shapes for accurate added/removed/unchanged diff counts

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

### 10-01 Decisions (2026-04-19)

- Node 20 (not 22 per REQUIREMENTS.md CI-03) + `pnpm validate-content` (not `check-content`) — pinned to code-of-record (`.nvmrc`, `engines.node`, `package.json scripts`); REQ table updated with reconciled wording
- `pnpm/action-setup@v4` (not v5) + `actions/checkout@v4` + `actions/setup-node@v4` — widest-adopted stable tags; major-pinned so Dependabot bumps patch releases
- `"Preprint"` journal fallback at `scripts/sync-publications.ts:346` — fixes Phase 9 latent bug where `publication_info[0]` exists with all-null fields produced `journal: ""` and failed `PublicationSchema.min(1)`; matches arXiv path's fallback for Phase 11 UI consistency
- **Diff-guard pivot:** plain `git diff --quiet content/publications.json` proved insufficient because `scripts/sync-publications.ts:625` writes `_meta.synced_at: new Date().toISOString()` unconditionally, producing a byte-different file on every run. Fix: `jq -cS '.publications'` comparison against `HEAD:content/publications.json`; on payload-unchanged, `git checkout HEAD -- content/publications.json` discards the synced_at-only rewrite before the commit-decision step. Semantic win: `synced_at` now advances only on real content change, which aligns with PUBS-09 meaning for Phase 11.
- Concurrency `group: sync-publications, cancel-in-progress: false` — manual dispatch never aborts a running cron
- Commit scope is `content/publications.json` only (never `git add .`) — any incidental drift is a bug we want to surface, not auto-reconcile
- First-run validation produced 3 historical bot commits (`ebdd41e`, `4674f6a`, `b25386c`) on origin/main BEFORE the diff-guard fix landed — kept as historical evidence (non-destructive rebase over them, not force-pushed)
- `main` currently has no branch protection — direct push works; if protection is later added, `github-actions[bot]` must go in the bypass allowlist

### 11-02 Decisions (2026-04-19)

- `Set<string>` not passed across RSC boundary — JSON serialization does not support Set; pass `string[]` from page, rebuild `new Set()` in client shell via `useMemo`
- next-intl strict key types prevent dynamic `t(variableKey)` — typed label calls materialized inside component body as `{ key, label }[]` array
- No `generateStaticParams` needed in publications page — inherited from `[locale]/layout.tsx`
- Filter state is in-memory only (`useState`) — no URL params; reload resets to `Todos`

### 11-01 Decisions (2026-04-19)

- Surname-based author matching confirmed: last word of `display_name_normalized` (not full string) — "tomas ferreira chase" does NOT substring-match "chase, tomas ferreira"; "chase" does. Unit tested empirically.
- `buildMemberSurnameSet` consumes all people unfiltered (CONTEXT locked) — past members included. Verified by test with `status: past`-equivalent entry.
- Et al. member-visible invariant: member at position 7 (index 6) in a 7-author list produces `[A, B, C, …, Chase, Tomas]` output with `etAl: true`. Locked in Vitest.
- `preprint` detection via `pub.journal === "Preprint"` (semantic signal, consistent with sync script fallback). RESEARCH Section 3 confirmed.
- Manual source pill rendered as `<span>` (non-link) — `getSourcePillHref` returns `null` for `source === "manual"`, driving the href ternary to the span branch.
- Source pill OKLCH tones: InspireHEP `bg-[oklch(0.95_0.04_235)]`, arXiv `bg-[oklch(0.95_0.05_30)]`, Manual uses `bg-surface-alt`. Chroma ≤ 0.05 for backgrounds (subdued, no saturated brand colors).
- `people.selectedPublications` key left in `messages/*.json` — v1.2 cleanup (RESEARCH Pitfall 5; one-directional key enforcement allows extra keys without failure).
- `makePub` test helper: spread override after base object (not inline literal) to avoid TS2783 duplicate-key error. Minor fix within Task 2 scope.
- PublicationsYearGroup + PersonDetail call sites still use old PublicationEntry prop shape — 2 expected TypeScript errors (isolated, intentional; fixed in 11-02 + 11-03).

### 11-03 Decisions (2026-04-19)

- `publications_selected` render path stripped entirely from page.tsx and PersonDetail.tsx — `getPublicationById` import removed; `SelectedPub` interface removed; legacy ~42-line render block removed
- PEOP-14 count subtitle intentionally absent — heading is `publications.title` alone; SC5 softened per 11-CONTEXT.md locked decision. Verifier must not treat absence of count as a gap.
- Empty-state hide: `{memberPubs.length > 0 && <section>}` — section absent from DOM when empty; intentional during DATA-09/10 rollout (~13/14 members lack IDs)
- `people.selectedPublications` i18n key preserved — v1.2 cleanup alongside Zod `publications_selected` field removal (RESEARCH Pitfall 5)
- PEOP-17 `generateStaticParams` category filter unchanged — pi/postdoc/phd only, confirmed by grep and build route list
- `buildMemberSurnameSet(getPeople())` passes all people unfiltered (past + current) — CONTEXT locked decision for group historical continuity

### Blockers / Concerns

- DATA-09/10 partial: 13 members still need `inspirehep_id` + `orcid_id` (follow-up data commit — not a code blocker; Phase 11 Display Layer is complete; profiles will show Publications section automatically when IDs are added)
- v1.2 cleanup scheduled: Zod `publications_selected` field removal + `people.selectedPublications` i18n key deletion
- `_meta.synced_at` on disk only advances on real publications change — safe for PUBS-09 "Actualizado el" consumption on /publications page

## Session Continuity

Last session: 2026-04-19T19:17Z
Stopped at: Completed 11-03-PLAN.md — profile publications section (getPublicationsByAuthor + deriveNameVariants + shared PublicationEntry), legacy selectedPubs removed (~66 lines), pnpm build 45/45, check-translations 0 drift, 65 tests passing. Phase 11 COMPLETE.
Resume file: None
