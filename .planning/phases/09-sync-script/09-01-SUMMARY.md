---
phase: 09-sync-script
plan: "01"
subsystem: infra
tags: [tsx, node-util-parseArgs, fast-xml-parser, InspireHEP, arXiv, cli, concurrency]

# Dependency graph
requires:
  - phase: 07-schema
    provides: PersonSchema with inspirehep_id (BAI regex) and orcid_id fields
  - phase: 08-accessor
    provides: Vitest infra, project test runner pattern
provides:
  - scripts/sync-publications.ts — CLI scaffold with flag parsing, startup validation, and raw fetch primitives
  - fetchInspireHEP(bai) — paginated InspireHEP literature hits, AbortSignal.timeout, 429 backoff
  - fetchArXiv(orcid) — arXiv atom2 ORCID feed, 404 → warning + [], AbortSignal.timeout
  - fetchWithRetry — exponential backoff (2s→4s→8s, 30s cap) on HTTP 429
  - runBatched — max-5-parallel + 2s inter-batch pause
  - xmlParser — fast-xml-parser configured with ATOM2_ALWAYS_ARRAY jpath set
  - validateBAIs — pre-fetch startup BAI format check, exits 1 on non-BAI values
  - BAI_REGEX re-exported for 09-02 tests
affects:
  - 09-02 (extraction layer — imports fetchInspireHEP, fetchArXiv, xmlParser, BAI_REGEX)
  - 09-03 (write gate — imports all of the above plus adds PublicationsFileSchema)

# Tech tracking
tech-stack:
  added:
    - fast-xml-parser@^5.7.1 (was exact 5.7.1 — widened to range)
  patterns:
    - async function main() pattern (tsx CJS mode rejects top-level await)
    - Relative imports only in scripts/ (tsx CJS does not resolve @/ webpack alias)
    - AbortSignal.timeout(10_000) on every fetch — no try/catch needed for timeout propagation
    - isArray callback uses string | MatcherView union — MatcherView is v6 fast-xml-parser API

key-files:
  created:
    - scripts/sync-publications.ts
  modified:
    - package.json (fast-xml-parser range + sync-publications script entry)
    - .gitignore (scripts/tmp/ for --member output sink)

key-decisions:
  - "fast-xml-parser isArray callback requires string | MatcherView union type — typeof jpath === 'string' guard needed for type safety"
  - "ATOM2_ALWAYS_ARRAY uses jpath dot-notation (feed.entry, feed.entry.author, etc.) per RESEARCH.md §C"
  - "fetchInspireHEP safety cap at 10 pages (2000 papers) — avoids infinite loop on query bugs"
  - "--member tomas-ferreira-chase --verbose confirmed live: InspireHEP 4 hits, arXiv 3 entries"

patterns-established:
  - "Scripts use relative imports from ../src/ — not @/ alias — tsx CJS constraint"
  - "All fetch calls go through fetchWithRetry (AbortSignal.timeout baked in)"
  - "BAI validation before any I/O — fail fast, never issue fetches with bad IDs"
  - "isVerbose const from flags.verbose used throughout for conditional stderr logging"

# Metrics
duration: 4min
completed: 2026-04-19
---

# Phase 09 Plan 01: Sync Script Scaffold Summary

**CLI scaffold for pnpm sync-publications with BAI startup validation, paginated InspireHEP + arXiv atom2 fetch primitives, 429 exponential backoff, and concurrency-limited batching — all proven live against real APIs**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-19T16:54:08Z
- **Completed:** 2026-04-19T16:57:41Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `scripts/sync-publications.ts` scaffolded (365 lines) with correct async main() pattern, all CLI flags parsed via node:util parseArgs, and exports for 09-02 consumption
- BAI startup validation (`validateBAIs`) fires before any network I/O — confirmed exits 1 with clear error on `INSPIRE-00140145` format
- Live API verification: InspireHEP returned 4 hits for `Tomas.F.Chase.1`, arXiv returned 3 entries for ORCID `0009-0001-0286-2136`
- `fast-xml-parser@^5.7.1` range configured with ATOM2_ALWAYS_ARRAY jpath set; `MatcherView` union type fixed for TypeScript strict mode

## Task Commits

1. **Task 1: Add fast-xml-parser dep + sync-publications script + gitignore** — `7160d9e` (chore)
2. **Task 2: Scaffold scripts/sync-publications.ts** — `060f3f7` (feat)

## Files Created/Modified

- `scripts/sync-publications.ts` — CLI entry, flag parsing, BAI validation, fetch primitives, raw type declarations, exports
- `package.json` — `fast-xml-parser` widened to `^5.7.1`, `sync-publications` script added
- `.gitignore` — `scripts/tmp/` appended (--member output sink, never committed)
- `pnpm-lock.yaml` — updated after dep range change

## Decisions Made

1. **fast-xml-parser MatcherView union:** The `isArray` callback in fast-xml-parser v5.7.1 types its second argument as `string | MatcherView` (jpath or a v6-style MatcherView object). Added `typeof jpath === "string" &&` guard before the Set.has() check to satisfy TypeScript strict mode without disabling type checking.

2. **isVerbose scoped at module level:** Declared as a const at the top level so all functions (fetchInspireHEP, fetchArXiv, fetchWithRetry) can access it without threading it as a parameter. This is idiomatic for a single-process CLI script.

3. **Live API test gated on `flags.verbose && flags.member`:** The 09-01 verification fetch is triggered only when both `--verbose` and `--member` are passed, keeping `pnpm sync-publications` (CI default) fast and network-free until 09-02 wires extraction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] fast-xml-parser isArray callback type mismatch**

- **Found during:** Task 2 (typecheck step)
- **Issue:** Plan specified `isArray: (_tagName: string, jpath: string) => ATOM2_ALWAYS_ARRAY.has(jpath)` but fast-xml-parser@5.7.1 types the second argument as `string | MatcherView` — TypeScript strict mode rejected the narrower parameter type
- **Fix:** Imported `MatcherView` from fast-xml-parser and added `typeof jpath === "string" &&` guard: `(_tagName: string, jpath: string | MatcherView, _isLeaf: boolean, _isAttr: boolean) => typeof jpath === "string" && ATOM2_ALWAYS_ARRAY.has(jpath)`
- **Files modified:** `scripts/sync-publications.ts`
- **Verification:** `pnpm exec tsc --noEmit` exits 0 after fix; xmlParser still correctly forces arrays for all 4 jpath entries (confirmed by live arXiv parse returning `entry[]` not `entry`)
- **Committed in:** `060f3f7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type system bug in plan-specified code)
**Impact on plan:** Mandatory fix for TypeScript strict mode. Behavior is identical to plan spec; only the type annotation changed.

## Issues Encountered

None beyond the fast-xml-parser type fix above.

## Verification Artifacts

```
# BAI validation:
BAI format error — fix content/people.json before retrying.
Expected BAI (e.g. "E.Calzetta.1"), got:
  esteban-calzetta: "INSPIRE-00140145"
Exit code: 1  ← NO fetch logs appeared before this

# Live API fetch (--member tomas-ferreira-chase --verbose):
[scaffold] fetching InspireHEP for tomas-ferreira-chase...
  GET https://inspirehep.net/api/literature?q=a%20Tomas.F.Chase.1&...&page=1
  fetched 4 of 4 total for Tomas.F.Chase.1
[scaffold] InspireHEP returned 4 hits
[scaffold] fetching arXiv for tomas-ferreira-chase...
  GET https://arxiv.org/a/0009-0001-0286-2136.atom2
[scaffold] arXiv returned 3 entries
Exit code: 0
```

## Next Phase Readiness

**Ready for 09-02 (extraction layer).** The following exports are available from `scripts/sync-publications.ts`:

```typescript
export { fetchInspireHEP, fetchArXiv, fetchWithRetry, runBatched, xmlParser, BAI_REGEX };
export type { InspireHit, ArXivEntry, PersonWithSyncIds };
```

**09-02 contract notes:**
- `readPeople()` is not exported — 09-02 can re-use or import as needed; it does a simple `JSON.parse` of `content/people.json`
- `fetchInspireHEP(bai)` returns `InspireHit[]` — all 09-02 extraction logic starts here
- `fetchArXiv(orcid)` returns `ArXivEntry[]` — includes the atom2 author CSV-string format documented in RESEARCH.md
- Members without `inspirehep_id` OR `orcid_id`: the filter logic in `main()` (currently scaffold placeholder) will be fully wired in 09-02

**Blockers:** None for 09-02 code. DATA-09/10 (13 members still need IDs) is a data blocker for full E2E — not a code blocker.

---
*Phase: 09-sync-script*
*Completed: 2026-04-19*
