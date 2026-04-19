---
phase: 08-accessor
verified_at: 2026-04-19T02:23:17Z
status: passed
score: 10/10 must-haves verified
re_verification: null
---

# Phase 8: Accessor Layer Verification Report

**Phase Goal:** `getPublicationsByAuthor` exists in the content barrel and correctly filters publications by name variant and year window — the page component that will call it can be written against a stable, tested interface.

**Verified:** 2026-04-19T02:23:17Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Callers can `import { getPublicationsByAuthor } from "@/content"` and the import type-checks under strict TypeScript | PASS | `src/content/index.ts:20` wildcard re-exports `./accessors/publications`; `pnpm typecheck` exits 0 |
| 2 | `getPublicationsByAuthor(["García","garcia"], { lastNYears: 10 })` returns only publications whose year is within last 10 calendar years AND whose `authors` array contains NFD-strip + lowercase substring match | PASS | `publications.ts:118-136` maps variants + authors through `normalizeName` (NFD-strip); year check at line 131. Confirmed by tests "filters to last N years inclusive" and "matches ASCII variant against diacritic-bearing author name" (both green) |
| 3 | Variants shorter than 4 characters (post-normalization) are silently filtered; empty input returns `[]` | PASS | `publications.ts:120` filters `v.length >= 4`; `publications.ts:122` returns `[]` on empty. Verified by 3 tests in "4-char variant guard" block (all green) |
| 4 | `lastNYears: 0` returns only publications where `year === new Date().getFullYear()` (zero is valid filter, distinguishable from unset via `options?.lastNYears !== undefined`) | PASS | `publications.ts:126` uses `options?.lastNYears !== undefined` (NOT truthiness). Verified by 2 tests: "lastNYears: 0 returns only current-year papers" and "lastNYears: 0 is NOT treated as unset" (both green) |
| 5 | When no `lastNYears` is passed, no year filter is applied — all matching publications are returned | PASS | `publications.ts:128` falls back to `-Infinity` when option unset. Verified by "applies no filter when options is omitted" and "applies no filter when options is {} (no lastNYears key)" (both green) |
| 6 | Results are pre-sorted: year desc → arXiv ID desc → no-arXiv entries last within year bucket | PASS | `publications.ts:138-144` sort comparator: `b.year - a.year`, then `b.arxiv.localeCompare(a.arxiv)`, then `-1/1` for missing arxiv. Verified by 3 tests in "pre-sorted output" (all green) |
| 7 | The imported `publications` array is never mutated — repeated calls leave module-level list in original order | PASS | `publications.ts:130` uses `[...publications].filter(...).sort(...)`. Verified by 2 tests in "non-mutation of module state" (both green) |
| 8 | The accessor file contains zero imports from `people.ts` (ACC-05 structural guard) | PASS | Grep `from\s+["'][^"']*people` on `src/content/accessors/publications.ts` returns no matches. Verified by in-test structural check (regex `/from\s+["'][^"']*people/` against file contents, green) |
| 9 | `getPublicationsByAuthor(["Someone"], {})` against v1.0 `content/publications.json` does not return `[]` solely due to missing `source` field — Phase 7 `.default("manual")` holds | PASS | Test "Phase 7 source default holds for v1.0 data" asserts non-empty result for `rodriguez` and every result's `source === "manual"` (green) |
| 10 | `pnpm test` runs the new test file and all cases pass | PASS | `pnpm test` output: `Test Files 1 passed (1) / Tests 20 passed (20)`, exit 0 |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content/accessors/publications.ts` | `export function getPublicationsByAuthor` + existing accessors | PASS | File exists, 146 lines. Contains new function at line 114 + existing 6 accessors. Imports `normalizeName` from `../schemas/shared` (line 22) |
| `src/content/accessors/publications.test.ts` | Vitest tests covering all locked behaviors | PASS | File exists, 207 lines, 20 test cases in 10 describe blocks — all green |
| `vitest.config.ts` | Node env + `src/**/*.test.ts` include + `@` alias | PASS | File exists at repo root with `environment: "node"`, `include: ["src/**/*.test.ts"]`, and `@` → `./src` alias |
| `package.json` | `test` npm script + `vitest` devDependency | PASS | `"test": "vitest run"`, `"test:watch": "vitest"`, `"vitest": "^3.2.4"` present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/content/accessors/publications.ts` | `src/content/schemas/shared.ts` | `import { normalizeName } from "../schemas/shared"` | WIRED | Line 22 imports; lines 119, 133 consume (variant map + author map) |
| `src/content/index.ts` | `src/content/accessors/publications.ts` | `export * from "./accessors/publications"` | WIRED | `src/content/index.ts:20` wildcard — new symbol auto-re-exported. Runtime identity confirmed by test "is re-exported from @/content barrel (ACC-04)" (`fromBarrel === getPublicationsByAuthor`, green) |
| `src/content/accessors/publications.test.ts` | `src/content/accessors/publications.ts` | `import { getPublicationsByAuthor } from "./publications"` + `import { getPublicationsByAuthor as fromBarrel } from "@/content"` | WIRED | Lines 4 and 7 of test file; both resolve under Vitest via `@` alias in `vitest.config.ts` |

### Requirements Coverage

| Requirement | Status | Supporting Evidence |
|-------------|--------|---------------------|
| ACC-01 (`getPublicationsByAuthor` accessor exists with correct signature) | SATISFIED | `publications.ts:114-117` signature matches spec: `(nameVariants: string[], options?: { lastNYears?: number }): Publication[]` |
| ACC-02 (case-insensitive, NFD-normalized author matching) | SATISFIED | `normalizeName` applied to both variants and authors (lines 119, 133); `normalizeName` does NFD-decompose → strip combining marks → lowercase (shared.ts:183-185) |
| ACC-03 (year window filtering via `lastNYears`) | SATISFIED | `publications.ts:125-128` with `!== undefined` guard; tests cover lastNYears: 10 / 0 / unset / {} cases |
| ACC-04 (re-exported via `@/content` barrel) | SATISFIED | `src/content/index.ts:20` wildcard export. Runtime identity test proves `fromBarrel === getPublicationsByAuthor` |
| ACC-05 (zero imports from people.ts — structural circular dep guard) | SATISFIED | Grep on accessor file returns no match; in-test structural check regex also green |

### Success Criteria (from ROADMAP)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `import { getPublicationsByAuthor } from "@/content"` compiles in strict TypeScript | PASS | `pnpm typecheck` exits 0 |
| 2 | `getPublicationsByAuthor(["García","garcia"], { lastNYears: 10 })` returns only entries where any author field contains case-insensitive NFD-normalized match AND year within last 10 calendar years | PASS | Implementation + tests "filters to last N years inclusive" and "matches ASCII variant against diacritic-bearing author name" cover both axes |
| 3 | The accessor file has zero imports from `src/content/people.ts` — circular dep structurally impossible | PASS | Grep + structural test both green |
| 4 | `getPublicationsByAuthor(["Someone"], {})` against full v1.0 publication list returns results (not empty due to missing `.default("manual")` source field) | PASS | Test "Phase 7 source default holds for v1.0 data" asserts every result has `source === "manual"` with known-present surname (green) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none in Phase 8 artifacts) | — | — | — | — |

No TODO/FIXME, no placeholder content, no empty-return stubs, no console-only handlers, no hardcoded values in any Phase 8 file.

Pre-existing lint error in `src/components/layout/MobileNav.tsx:38` (setState in effect) is from Phase 3, unrelated to Phase 8 and outside this phase's scope.

### Gate Results (from PLAN §verification)

| Gate | Command | Result |
|------|---------|--------|
| Typecheck | `pnpm typecheck` | PASS (exit 0, no TS errors) |
| Test | `pnpm test` | PASS (20/20 tests green, exit 0) |
| Lint | `pnpm lint` | Phase-8 files CLEAN; pre-existing error in MobileNav.tsx unrelated |
| Content validation | `pnpm validate-content` | PASS (5 files, all entries parsed, all photos exist) |
| ACC-05 grep | `grep -nE "from\\s+['\"][^'\"]*people" src/content/accessors/publications.ts` | PASS (no output) |
| Build | `pnpm build` | PASS (Next.js static prerender succeeds for all routes) |
| Commit log | `git log --oneline -3` for phase | PASS — three atomic commits: `chore(08-01)`, `feat(08-01)`, `test(08-01)` |

### Human Verification Required

None. All locked behaviors are verifiable by unit tests against the real `content/publications.json`, grep-based structural checks, and the TS/build/lint/content-validation gates — all of which pass.

### Gaps Summary

No gaps. Every must-have truth is satisfied by observable evidence in the codebase, and every ROADMAP success criterion has been mapped to passing automated checks.

## Overall Status Recommendation

**PASSED.** Phase 8 achieves its goal: `getPublicationsByAuthor` is a stable, tested, barrel-exported function that filters by NFD-normalized name variants and an optional year window, with structural guards against circular imports (ACC-05) and downstream-schema regressions (Phase 7 `source` default). Phase 11's `/people/[slug]` page can consume this interface safely.

---

*Verified: 2026-04-19T02:23:17Z*
*Verifier: Claude (gsd-verifier)*
