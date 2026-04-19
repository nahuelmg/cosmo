---
phase: 08-accessor
plan: 01
subsystem: testing
tags: [vitest, accessor, typescript, nfd-normalize, unit-tests]

# Dependency graph
requires:
  - phase: 07-schema-extension
    provides: normalizeName helper + PublicationSchema.source default("manual") + PersonSchema.display_name_normalized
provides:
  - getPublicationsByAuthor accessor (nameVariants, options?.lastNYears) → Publication[]
  - Vitest 3.x unit-test infrastructure (first in the project)
  - vitest.config.ts with @ alias + node env + src/**/*.test.ts include
  - pnpm test + pnpm test:watch scripts
  - 20-case colocated test file proving every locked behavior
affects: [09-sync-script, 11-display-layer]

# Tech tracking
tech-stack:
  added:
    - vitest@^3.2.4
  patterns:
    - "Colocated .test.ts files beside source (src/**/*.test.ts pattern)"
    - "@ alias in vitest.config.ts mirrors tsconfig paths — barrel imports resolve inside Vitest"
    - "Node test environment (no jsdom) — pure-function tests only"
    - "Test file asserts ACC-05 structurally via fs.readFileSync + regex"
    - "Caller-provides-variants accessor pattern — no Person dep, zero circular-dep surface"

key-files:
  created:
    - vitest.config.ts
    - src/content/accessors/publications.test.ts
    - .planning/phases/08-accessor/08-01-SUMMARY.md
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/content/accessors/publications.ts

key-decisions:
  - "NFD-strip (not NFC) — normalizeName from shared.ts owns the transform; accessor reuses it for both variants and author strings"
  - "4-char minimum variant length post-normalization — silently drops initials like F., J."
  - "lastNYears: 0 is valid (current-year only) — guard is `options?.lastNYears !== undefined`, not truthiness"
  - "Sort: year desc → arXiv ID desc (localeCompare, modern YYMM.NNNNN lex-order matches chronology) → no-arXiv entries last"
  - "Non-mutating: uses [...publications] before .sort()"
  - "Caller passes nameVariants explicitly — no deriveNameVariants helper, no Person import (ACC-05)"
  - "Barrel re-export via existing `export * from ./accessors/publications` — src/content/index.ts unchanged (ACC-04 satisfied by wildcard)"

patterns-established:
  - "Vitest as project test runner — pnpm test runs once and exits (CI-friendly); pnpm test:watch for interactive"
  - "Colocated tests: src/path/foo.ts + src/path/foo.test.ts"
  - "ACC-05-style structural test pattern: read source file, assert regex does not match — prevents future circular-dep regressions"
  - "Barrel-identity test: `import X from './file'` vs `import X from '@/barrel'` should `toBe` equal — catches broken wildcard re-exports"

# Metrics
duration: 4min
completed: 2026-04-19
---

# Phase 8 Plan 1: getPublicationsByAuthor + Vitest Infrastructure Summary

**Author-matched publications accessor (NFD-fold substring + optional lastNYears window) with project's first unit-test runner (Vitest 3.x) and 20 colocated test cases covering every locked behavior**

## Performance

- **Duration:** 4 min (246 s)
- **Started:** 2026-04-19T02:15:25Z
- **Completed:** 2026-04-19T02:19:31Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `getPublicationsByAuthor(nameVariants, options?)` exported from `src/content/accessors/publications.ts` — reuses `normalizeName` (NFD-strip + lowercase), filters variants <4 chars, supports `lastNYears: 0` edge case, pre-sorts year desc → arXiv desc → no-arXiv last, never mutates the module-level array.
- Vitest 3.2.4 installed + `vitest.config.ts` with `@` → `src` alias + `pnpm test` / `pnpm test:watch` scripts.
- 20 colocated Vitest cases in `src/content/accessors/publications.test.ts`, all green on first run — covers barrel identity (ACC-04), 4-char guard, any-author match, NFD-strip fold + case-insensitivity, year-window semantics (including `0` vs unset), no-matches, pre-sorted output, non-mutation, Phase 7 `source` default, and ACC-05 structural grep.
- `src/content/index.ts` unchanged — the existing `export * from "./accessors/publications"` wildcard automatically re-exports the new function; the test file's `import { getPublicationsByAuthor as fromBarrel } from "@/content"` + `toBe` assertion proves this at runtime.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest + config + pnpm test script** — `f49fab8` (chore)
2. **Task 2: Implement `getPublicationsByAuthor`** — `7c2a92c` (feat)
3. **Task 3: 20 colocated Vitest unit tests** — `f3e2f7f` (test)

**Plan metadata commit:** (this SUMMARY.md + STATE.md)

## Files Created/Modified

- `vitest.config.ts` (new) — Node env, `@` alias → `src/`, include `src/**/*.test.ts`.
- `src/content/accessors/publications.test.ts` (new) — 20-case colocated test file.
- `src/content/accessors/publications.ts` (+1 import, +67 lines) — added `normalizeName` import + `getPublicationsByAuthor` function after existing accessors.
- `package.json` — added `test` and `test:watch` scripts, `vitest` devDependency.
- `pnpm-lock.yaml` — +36 transitive deps for Vitest 3.2.4.
- `.planning/phases/08-accessor/08-01-SUMMARY.md` (this file).

## Decisions Made

None — followed plan as specified. All decisions were locked in `08-CONTEXT.md` / `08-RESEARCH.md` and transcribed faithfully:

- **NFD-strip, not NFC** (Research correction from Context) — reuses existing `normalizeName` in `shared.ts`, guaranteeing symmetry with `PersonSchema.display_name_normalized`.
- **4-char guard** applied post-normalization so `"Él"` (2 chars after NFD-strip → `"el"`) is dropped.
- **`!== undefined` guard** on `lastNYears` so `0` is a valid "current year only" filter.
- **`localeCompare` for arXiv IDs** — modern `YYMM.NNNNN` format has lexicographic order matching chronological order (verified in research).
- **Caller-provides-variants** — no `deriveNameVariants` helper (deferred to Phase 11 / v1.2), no Person import, zero circular-dep surface.
- **Barrel re-export via wildcard** — `src/content/index.ts` already has `export * from "./accessors/publications"` so no edit needed (ACC-04 satisfied).

## Deviations from Plan

None — plan executed exactly as written. The 20 tests passed on first `pnpm test` run; no accessor or test fixtures needed adjustment.

The plan-checker pre-flagged a potential `await import` syntax issue in the "does not reorder other accessor outputs" test case (arrow function needing `async` keyword). This was fixed proactively during test-file authoring — the `it()` callback is declared `async`. No debugging round was needed.

## Issues Encountered

- **Pre-existing lint error on `main`** (`src/components/layout/MobileNav.tsx:38` — `react-hooks/set-state-in-effect`). This is a carryover, unrelated to Phase 8 work; running `pnpm exec eslint src/content/accessors/publications.{ts,test.ts}` on just the files I touched is clean. Recorded as known-issue in Open Items (to be fixed on next MobileNav edit); not a Phase 8 blocker.

## Verification Gate Results

| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | 20/20 passing, exit 0 |
| Content validation | `pnpm validate-content` | passes (5 files, all entries parsed) |
| Build | `pnpm build` | exit 0, 45/45 static pages generated |
| ACC-05 grep | `grep -nE 'from\s+["\x27][^"\x27]*people' src/content/accessors/publications.ts` | no match (exit 1) |
| ACC-04 barrel | In-test `expect(fromBarrel).toBe(getPublicationsByAuthor)` | passes |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 9 (Sync Script):** Can write into the `Publication` shape the accessor consumes; accessor contract is pinned here and tests will catch regressions. Still gated on DATA-09/10 follow-up data commit (13 members need `inspirehep_id` + `orcid_id` before E2E testing).
- **Phase 11 (`/people/[slug]` page):** Can now call `getPublicationsByAuthor([person.display_name, person.display_name_normalized], { lastNYears: 10 })` against a tested contract with proven year-window, NFD-fold, and 4-char-guard semantics. The same accessor (without `lastNYears`) serves full-archive author highlighting on `/publications`.
- **Deferred / NOT touched:** `deriveNameVariants` helper (variant construction lives in the page component or a future util), `source` filtering (no caller needs it yet), per-person exclude lists, collaboration-paper (>100-author) trimming — all Phase 11 or v1.2.

---
*Phase: 08-accessor*
*Completed: 2026-04-19*
