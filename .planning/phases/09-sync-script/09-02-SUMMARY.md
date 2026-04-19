---
phase: 09-sync-script
plan: "02"
subsystem: infra
tags: [tsx, InspireHEP, arXiv, extraction, dedup, normalization, vitest, NFC, BibTeX]

# Dependency graph
requires:
  - phase: 09-01
    provides: fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, xmlParser, BAI_REGEX, InspireHit/ArXivEntry types
  - phase: 07-schema
    provides: PublicationSchema/Publication type with source enum
  - phase: 08-accessor
    provides: Vitest infra, sort order contract (getPublicationsByAuthor)
provides:
  - scripts/sync-publications.ts — full extraction + dedup + merge + wired main()
  - stripBibTeX(title) — BibTeX markup strip (exported)
  - inspireHitToPublication(hit) — InspireHit → Publication with NFC + year fallback chain
  - arxivEntryToPublication(entry) — ArXivEntry → Publication with atom2 CSV author split
  - dedupByArxivId(entries) — intra-source first-seen-wins dedup keyed on arxiv ?? id
  - readManualEntries(cwd?) — v1.0 bare array + v1.1 wrapped shape handling
  - mergePublications(manual, inspire, arxiv) — concat + deterministic sort
  - syncMember() — per-member fetch worker with stdout progress + stderr warnings
  - wired main() producing merged Publication[] in memory, no disk write
  - scripts/sync-publications.test.ts — 21 Vitest tests covering all extraction helpers
affects:
  - 09-03 (write gate — consumes merged + allWarnings from main(), adds PublicationsFileSchema + writeFileSync)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - require.main === module guard prevents main() execution on test import (tsx CJS mode)
    - year resolution: pi?.year ?? parsedPreprintYear (with Number.isFinite guard) ?? currentYear
    - NFC at extraction time (storage) vs NFD+strip at query time (matching) — distinct concerns
    - vitest.config.ts include widened to ["src/**/*.test.ts", "scripts/**/*.test.ts"]

key-files:
  created:
    - scripts/sync-publications.test.ts (21 Vitest tests)
  modified:
    - scripts/sync-publications.ts (extraction helpers + syncMember + wired main)
    - vitest.config.ts (widened include to cover scripts/)

key-decisions:
  - "require.main === module guard added — prevents main() from firing when Vitest imports the module"
  - "Year expression ?/?? || mixing replaced with Number.isFinite(parsedPreprintYear) guard for TypeScript strict mode"
  - "vitest.config.ts include widened to scripts/**/*.test.ts — was src/ only, blocked test discovery"
  - "Full run reports 1 syncable member (only tomas-ferreira-chase has IDs) — 14 others filtered silently; matches STATE.md DATA-09/10 status"

patterns-established:
  - "Extraction helpers are top-level exported functions — testable in isolation with no network I/O"
  - "per-member progress: stdout per member after batch completes; warnings drain to stderr inline"
  - "intra-source dedup applied before mergePublications; merge does not dedup — matches CONTEXT.md locked decision"

# Metrics
duration: 4min
completed: 2026-04-19
---

# Phase 09 Plan 02: Sync Script Extraction Layer Summary

**Pure extraction functions + per-member orchestration in main(): InspireHEP hits and arXiv atom2 entries become NFC-normalized, BibTeX-clean Publication objects, deduped intra-source, merged with 13 v1.0 manual entries, and sorted deterministically (year desc → arXiv ID desc → no-arXiv last)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-19T17:00:07Z
- **Completed:** 2026-04-19T17:03:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Six exported pure functions (`stripBibTeX`, `inspireHitToPublication`, `arxivEntryToPublication`, `dedupByArxivId`, `readManualEntries`, `mergePublications`) — all typechecked against `Publication` type
- 21 Vitest tests covering all plan-specified cases (BibTeX strip, arXiv ID parsing, year fallback chain, dedup, sort order) — all green
- `main()` fully wired with per-member `syncMember()` worker, `runBatched` concurrency, stdout progress, stderr warnings, cross-member dedup, and final extraction summary
- Live run confirmed: `tomas-ferreira-chase — InspireHEP: 4, arXiv: 3`, `Extracted 20 publications (manual=13, inspirehep=4, arxiv=3)`
- `content/publications.json` untouched (no write gate — that's 09-03)
- Determinism spot-checked: two back-to-back runs produce identical output

## Task Commits

1. **Task 1: extraction + dedup helpers** — `41829d0` (feat)
2. **Task 2: wire main()** — `3691743` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `scripts/sync-publications.ts` — extraction helpers + syncMember + wired main() (+200 lines over 09-01 scaffold)
- `scripts/sync-publications.test.ts` — 21 Vitest tests for pure extraction functions
- `vitest.config.ts` — include widened to `scripts/**/*.test.ts`

## Sample Per-Member Progress Line

From live `--member tomas-ferreira-chase` run:
```
Syncing 1 member(s)...
tomas-ferreira-chase — InspireHEP: 4, arXiv: 3
Extracted 20 publications (manual=13, inspirehep=4, arxiv=3)
```

## Determinism Evidence

Two back-to-back runs of `pnpm sync-publications --member tomas-ferreira-chase`:
```
run1: Extracted 20 publications (manual=13, inspirehep=4, arxiv=3)
run2: Extracted 20 publications (manual=13, inspirehep=4, arxiv=3)
diff: (empty — identical)
```

## Exported Function Signatures

```typescript
export function stripBibTeX(title: string): string
export function inspireHitToPublication(hit: InspireHit): Publication
export function arxivEntryToPublication(entry: ArXivEntry): Publication
export function dedupByArxivId(entries: Publication[]): Publication[]
export function readManualEntries(cwd?: string): Publication[]
export function mergePublications(
  manualEntries: Publication[],
  inspireEntries: Publication[],
  arxivEntries: Publication[],
): Publication[]
```

## What main() Hands Off to 09-03

Variables in scope at the bottom of `main()` after extraction completes:
- `merged: Publication[]` — deduplicated, NFC-normalized, deterministically sorted
- `allWarnings: string[]` — flat warning strings (stderr-echoed during run)
- `manualEntries: Publication[]` — for counts.manual computation
- `allInspire: Publication[]` and `allArxiv: Publication[]` — for counts.inspirehep/arxiv
- `runInspire: boolean`, `runArxiv: boolean` — for `_meta.sources` array
- `flags["dry-run"]: boolean` — write gate flag

09-03 replaces the `// Extracted N publications` summary line with:
1. `PublicationsFileSchema` added to `publications.schema.ts`
2. `PublicationsFileSchema.safeParse({ _meta, publications: merged })` — fatal if invalid
3. `writeFileSync` with `JSON.stringify(..., null, 2) + "\n"` — atomic write
4. Accessor + validate-content.mjs updates for wrapped file shape

## Decisions Made

1. **`require.main === module` guard added:** Without it, `tsx` executes `main()` when Vitest imports the module, printing `[scaffold]...` noise and triggering real file reads during tests. The CJS guard prevents this cleanly.

2. **Year expression `?? ||` replaced with `Number.isFinite` guard:** TypeScript strict mode rejects mixing `??` and `||` without explicit parentheses. Extracted `parsedPreprintYear` as a local var and guarded with `Number.isFinite()` — semantically identical to the plan's `|| new Date().getFullYear()` fallback.

3. **`vitest.config.ts` include widened:** The config only covered `src/**/*.test.ts`; `scripts/` tests were not discovered. Extended to `["src/**/*.test.ts", "scripts/**/*.test.ts"]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest config excluded scripts/ test files**

- **Found during:** Task 1 (first test run)
- **Issue:** `vitest.config.ts` had `include: ["src/**/*.test.ts"]` — running `pnpm vitest run scripts/sync-publications.test.ts` exited with "No test files found"
- **Fix:** Widened include to `["src/**/*.test.ts", "scripts/**/*.test.ts"]`
- **Files modified:** `vitest.config.ts`
- **Verification:** `pnpm test` now runs both `scripts/sync-publications.test.ts` (21 tests) and `src/content/accessors/publications.test.ts` (20 tests)
- **Committed in:** `41829d0` (Task 1 commit)

**2. [Rule 1 - Bug] `require.main === module` guard missing**

- **Found during:** Task 1 (test output showed `[scaffold] would sync 15 member(s)...` noise during import)
- **Issue:** The CJS module executes `main()` unconditionally at module load — file reads and I/O fire during Vitest import
- **Fix:** Wrapped `main().catch(...)` in `if (require.main === module) { ... }`
- **Files modified:** `scripts/sync-publications.ts`
- **Verification:** `pnpm test` runs silently with no scaffold output
- **Committed in:** `41829d0` (Task 1 commit)

**3. [Rule 1 - Bug] TypeScript strict mode rejected `?? ||` mixing**

- **Found during:** Task 1 (tsc --noEmit: TS5076 error)
- **Issue:** Plan specified `pi?.year ?? (parseFloat(...)) || new Date().getFullYear()` — TypeScript strict mode requires explicit parentheses when mixing `??` and `||`
- **Fix:** Extracted `parsedPreprintYear` variable, guarded with `Number.isFinite()` check
- **Files modified:** `scripts/sync-publications.ts`
- **Verification:** `pnpm tsc --noEmit` exits 0
- **Committed in:** `41829d0` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking + 2 bugs)
**Impact on plan:** All mandatory for tests to run and TypeScript to compile. No scope creep.

## Issues Encountered

None beyond the three auto-fixed deviations above.

## Next Phase Readiness

**Ready for 09-03 (write gate).** The script produces a clean `merged: Publication[]` in memory with all extraction, dedup, and sort concerns resolved.

**09-03 must:**
1. Add `PublicationsFileSchema` + `PublicationsMetaSchema` to `publications.schema.ts`
2. Replace the trailing summary line in `main()` with schema validation + `writeFileSync`
3. Update `src/content/accessors/publications.ts` to unwrap `{ _meta, publications }` shape
4. Update `scripts/validate-content.mjs` to use `PublicationsFileSchema` for `publications.json`
5. Handle `--member` redirect to `scripts/tmp/sync-<slug>.json`
6. Handle `--dry-run` (skip write, print what would be written)

**Blockers:** None for 09-03 code. DATA-09/10 (13 members still need IDs) remains a data blocker for full E2E — not a code blocker.

---
*Phase: 09-sync-script*
*Completed: 2026-04-19*
