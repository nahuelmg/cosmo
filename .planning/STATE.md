# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 Phase 12 — polish, data backfill (9/14 members), and maintainer docs (DOC-01 + DOC-02). Audit passed `tech_debt`; cleanup phase complete pending milestone audit.

## Current Position

Phase: 12 of 12 (Polish & Docs) — gap closure phase COMPLETE
Plan: 3/3 (12-01 trivia DONE, 12-02 data backfill + sync purge DONE, 12-03 maintainer docs DONE)
Status: v1.1 Phases 7–12 ready for /gsd:audit-milestone re-run — lint-green, JSDoc accurate, 9/13 sync-scoped members backfilled, publications.json holds 321 real entries (0 placeholders), content/SYNC.md covers DOC-01+DOC-02 (ID-lookup + operational troubleshooting), REQUIREMENTS.md traceability clean (DOC-01/02 = Complete, Coverage line = phases 7–12)
Last activity: 2026-04-19 — Plan 12-03 executed (SYNC.md +132 lines: paste-ready diana-lopez-nacir snippet + Operational Troubleshooting h2; REQUIREMENTS.md DOC-01/02 flipped Pending→Complete); 45 static routes, 2 atomic commits (`518b4d7`, `71546de`)

Progress: [███████████████] 27/29 plans complete (Phase 12: 3/3 DONE); v1.1 ready for /gsd:audit-milestone → /gsd:complete-milestone

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv, refreshed weekly at build time.

**Phase order:** 7 Schema → 8 Accessor → 9 Sync Script → 10 CI Wiring → 11 Display Layer

**Critical ordering rule:** Schema (7) must be atomic and green before anything else. Sync script (9) must validate locally before CI (10) is wired.

**Human dependency:** DATA-09 / DATA-10 (partial, extended in 12-02) — 9 of 13 sync-scoped members populated with `inspirehep_id` + `orcid_id`. Remaining: juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia. 2 undergrads (javier-pineau, tomas-cicarella) are intentionally out of sync scope per Phase 9 category filter.

## Shipped — v1.0 MVP (2026-04-18)

31 plans complete across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied.
Full archive: `.planning/milestones/v1.0-ROADMAP.md`

## Open Items Carried Forward (v1.0)

- PERF-04/05 deferred to Vercel production re-measurement (LCP + CLS numerical targets)
- NAV-04 mobile drawer 375px live-deploy check (structural done)
- `MobileNav.tsx:87` `focus:outline-none` flag (low risk)
- ~~`MobileNav.tsx:38` `react-hooks/set-state-in-effect` ESLint error~~ — CLOSED in 12-01 (`70337f8`). Refactored from `useEffect([pathname]) → setOpen(false)` to click-handler-only topology (NavLink.onNavigate + onClickCapture on LocaleToggle wrapper + Radix onOpenChange).
- ~~`SiteFooter.tsx:1` unused `next/link` import~~ — CLOSED in 12-01 (`4bf708d`). Replaced `<Link>` for external social URLs with plain `<a target="_blank">`; dropped the import.
- Hero "Grupo de Cosmología" title loses contrast on JWST starfield backgrounds — needs stronger text-shadow or dedicated gradient scrim (reported 2026-04-19)
- `pnpm build` has an implicit side-effect on `content/publications.json` (rewrites with a fresh sync + timestamp). Observed in 12-01 Task 3 verify; reverted before commit. Worth confirming whether the sync pipeline should run under an explicit flag rather than as a build side-effect.

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

### 12-03 Decisions (2026-04-19)

- Paste-ready snippet uses diana-lopez-nacir (real 12-02 backfill) — pulls actual `inspirehep_id: "D.Lopez.Nacir.1"` + `orcid_id: "0000-0003-4398-1147"` + email. Long prose fields (`short_bio`, `full_bio`, `research_interests`) elided to `"..."` / `[ { "es": "...", "en": "..." } ]` to keep snippet ~22 lines. Dropped `contact.orcid` and `contact.office` from example (redundant / optional); retained `contact.email` + empty `publications_selected` + empty `social_links`.
- Example placed as `### Example full entry` subsection UNDER the existing `## Field Summary` (not under "Finding Your ORCID") — keeps the two ID-lookup how-tos tight and self-contained; paste-ready JSON naturally belongs with the field-shape table.
- `## Operational Troubleshooting` is a single h2 with four h3 subsections (manual `workflow_dispatch` / reading step summary / when cron fails / local `--dry-run`) rather than four h2s — compact VS Code outline, groups operational content as one unit, matches operator mental model.
- Cross-reference pattern locked: each cron-failure mode is tagged with its originating REQUIREMENTS ID (`SYNC-02`, `SYNC-03`, `SYNC-06`, `CI-04`, `SYNC-14`, `CI-05`, `CI-06`, `CI-07`). Operator hits an error → greps REQUIREMENTS.md → finds decision context. First time SYNC.md cross-references REQUIREMENTS.md by ID; pattern for future v1.2 operational docs.
- REQUIREMENTS.md spec bullets rewritten on flip (NOT preserved archaeologically) — original DOC-01 bullet mentioned `arxiv_id` which was reconceived as `orcid_id` in Phase 7-02; updated bullet notes the reconception inline. Coverage line: `phases 7–11` → `phases 7–12` + Phase 12 closure note (en-dash preserved).

### 12-02 Decisions (2026-04-19)

- Denominator correction: plan / ROADMAP said 9/14 coverage; empirical count is 9 of 13 sync-scoped (pi/postdoc/phd) + 2 undergrads = 15 total. Used 9/13 in REQUIREMENTS.md per plan's empirical fallback directive.
- Matias Leizerovich email renamed (matias.leizerovitch -> matias.leizerovich @df.uba.ar) alongside slug/name/display_name_normalized/short_bio to satisfy the plan's verify gate `grep -c leizerovitch content/people.json = 0`. Institutional emails track surname spelling.
- At-source purge pattern: `readManualEntries()` in scripts/sync-publications.ts is a pass-through merge, so clearing the 13 v1.0 fictional entries required a node one-liner filter BEFORE the live sync, not a script change. Locked as the idiomatic pattern for clearing template seed data.
- Test-data coupling: 2 accessor tests asserted on v1.0 placeholder surnames (Di Sarcina + source==="manual"). Migrated to real group surname (Landau) + valid-enum assertion. Pattern locked: author-name tests should anchor on real group surnames so data refreshes don't break the suite.
- 321 publications total (317 InspireHEP + 4 arXiv, cross-source dedup keeps InspireHEP on arXiv overlap per 09-03). 3 arXiv-ORCID-not-registered warnings (Calzetta, Landau, Badia) are acceptable; InspireHEP covers 206 of the 317 entries for those three combined.
- Latent gap flagged: `cecilia-scannapieco` display_name_normalized is `cecilia scanapiecco` (typo); real InspireHEP author string is "Scannapieco". Surname-match lookup will NOT link her profile to her 47 papers under current accessor logic. Out of 12-02 scope; fix before /gsd:complete-milestone.
- Observed 12-01 parallel-executor artifact: they reverted content/publications.json and publications.test.ts twice during my Task 2, believing the sync output was a pnpm build side-effect (their STATE.md note makes this claim; it's incorrect — prebuild only runs validate-content.mjs which has no writes). Re-ran Task 2 after 12-01 finished. No data loss (Task 1 commit d3b528a was never at risk, already in HEAD).

### 12-01 Decisions (2026-04-19)

- Plan's preferred `useRef`-guarded `useEffect` pattern for MobileNav auto-close does NOT satisfy `react-hooks/set-state-in-effect` — the rule fires on any `setState` inside `useEffect`, guarded or not. Render-time compare-and-setState trips the sibling `react-hooks/refs` rule ("Cannot access refs during render"). Fell back to plan's explicit alternative: remove the effect entirely, close drawer in click handlers. Only programmatic-nav source inside the drawer is LocaleToggle (grep `router.push|router.replace` across `src/` — single hit). Wrapped in `onClickCapture` so `setOpen(false)` runs before `startTransition` schedules `router.replace`.
- `onClickCapture` not `onClick` — capture-phase listener is essential; bubble-phase would race the navigation commit and leave the drawer visually open on top of the freshly-rendered route.
- SiteFooter external URLs use plain `<a target="_blank" rel="noopener noreferrer">`, NOT `@/i18n/navigation` — the next-intl wrapper prepends locale segments to internal paths, which is wrong for off-site URLs. STATE.md's earlier "flip to @/i18n/navigation" carryover was superseded by the semantic analysis in 12-01.
- JSDoc-only edit to `publications_selected` — Zod shape untouched, no `pnpm generate-schemas` rerun needed. JSON Schemas in `content/*.schema.json` are regenerated from Zod shapes, not from JSDoc comments.

### 11-03 Decisions (2026-04-19)

- `publications_selected` render path stripped entirely from page.tsx and PersonDetail.tsx — `getPublicationById` import removed; `SelectedPub` interface removed; legacy ~42-line render block removed
- PEOP-14 count subtitle intentionally absent — heading is `publications.title` alone; SC5 softened per 11-CONTEXT.md locked decision. Verifier must not treat absence of count as a gap.
- Empty-state hide: `{memberPubs.length > 0 && <section>}` — section absent from DOM when empty; intentional during DATA-09/10 rollout (~13/14 members lack IDs)
- `people.selectedPublications` i18n key preserved — v1.2 cleanup alongside Zod `publications_selected` field removal (RESEARCH Pitfall 5)
- PEOP-17 `generateStaticParams` category filter unchanged — pi/postdoc/phd only, confirmed by grep and build route list
- `buildMemberSurnameSet(getPeople())` passes all people unfiltered (past + current) — CONTEXT locked decision for group historical continuity

### Blockers / Concerns

- DATA-09/10 partial (post-12-02): 4 sync-scoped members still need `inspirehep_id` + `orcid_id` — juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia. Not a code blocker; profiles will show Publications section automatically when IDs are added.
- `cecilia-scannapieco` typo: display_name_normalized is `cecilia scanapiecco` but real InspireHEP entries list her as "Scannapieco" — surname-match will NOT link her 47 papers to her profile page until fixed. Low-risk one-line fix; flagged for 12-03 or a separate fix commit before /gsd:complete-milestone.
- v1.2 cleanup scheduled: Zod `publications_selected` field removal + `people.selectedPublications` i18n key deletion
- `_meta.synced_at` on disk only advances on real publications change — safe for PUBS-09 "Actualizado el" consumption on /publications page

## Session Continuity

Last session: 2026-04-19T21:22Z
Stopped at: Plan 12-03 complete — 2 atomic commits (`518b4d7` SYNC.md +132 lines (paste-ready diana-lopez-nacir snippet + Operational Troubleshooting h2), `71546de` REQUIREMENTS.md DOC-01/02 Pending→Complete + Coverage phases 7–12). Build green 45 routes. Phase 12 gap closure complete (3/3). Next: optionally fix cecilia-scannapieco `display_name_normalized` typo (flagged in 12-02 decisions), then `/gsd:audit-milestone` re-run, then `/gsd:complete-milestone`.
Resume file: None
