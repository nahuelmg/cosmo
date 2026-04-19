---
phase: 10-ci-wiring
verified: 2026-04-19T15:25:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 10: CI Wiring Verification Report

**Phase Goal:** A GitHub Actions workflow runs the sync script on a weekly Monday cron and on manual `workflow_dispatch`, commits `content/publications.json` only when the content changes, and surfaces per-run delta in the step summary — with no spurious Vercel rebuilds on identical data.

**Verified:** 2026-04-19T15:25:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `workflow_dispatch` run completes end-to-end (push or "No changes" summary) | VERIFIED | Human-observational (maintainer confirmed live 2026-04-19); corroborated by git log: `ebdd41e`, `4674f6a`, `b25386c` are real bot-authored publication-sync commits on main |
| 2 | Step summary shows per-run delta, no-op message, and `Synced at <ISO>` footer | VERIFIED | `.github/workflows/sync-publications.yml` lines 75-98 implement all three branches (change / no-change / failure) with `Synced at ${SYNCED_AT}` footer on both non-failure branches |
| 3 | Two back-to-back runs on identical data produce zero commits | VERIFIED | Human-observational (maintainer confirmed); payload-aware diff guard at lines 47-57 canonicalizes `.publications` via `jq -cS` and checks out HEAD-version of file when payload unchanged |
| 4 | Vercel deploys only on real content change | VERIFIED | Human-observational (maintainer confirmed); follows structurally from Truth 3 — no commit means no Vercel trigger |
| 5 | `inspireHitToPublication` returns `journal: "Preprint"` for all-null `publication_info[0]` | VERIFIED | `scripts/sync-publications.ts:351` fallback `|| "Preprint"`; test at `scripts/sync-publications.test.ts:147-151` passes (22/22 tests green) |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected Content | Status | Details |
|----------|-----------------|--------|---------|
| `.github/workflows/sync-publications.yml` | `cron: '0 6 * * 1'`, `workflow_dispatch`, `permissions: contents: write` | VERIFIED | Line 5 (cron), line 6 (workflow_dispatch), lines 12-13 (permissions). 98 lines, substantive, no stubs. |
| `scripts/sync-publications.ts` | `|| "Preprint"` fallback | VERIFIED | Line 351 (`: "") || "Preprint";`) — correct placement closing the ternary's else branch and OR-defaulting the join result. 706 lines. |
| `scripts/sync-publications.test.ts` | `toBe("Preprint")` | VERIFIED | Line 150 inside the "publication_info[0] exists but all fields are null" test case. Test executes and passes. |

All three artifacts: EXISTS + SUBSTANTIVE + WIRED.

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| workflow | sync script | `pnpm sync-publications` | WIRED | Line 40 executes `pnpm sync-publications` with stdout/stderr capture for step-summary consumption |
| workflow | content validator | `pnpm validate-content` | WIRED | Line 45 runs validate-content as independent second-gate after sync |
| workflow | diff guard | jq on `.publications` vs HEAD | WIRED | Lines 50-51 canonicalize both working-copy and HEAD `.publications` via `jq -cS`; line 53 checks out HEAD file when payload unchanged (discards `_meta.synced_at`-only drift); outputs `changed=true/false` at lines 54-56 |
| workflow | step summary | `$GITHUB_STEP_SUMMARY` | WIRED | Lines 81, 84-91, 93-95, 97 append to `$GITHUB_STEP_SUMMARY` across all three branches (change / no-change / failure) |
| workflow → pnpm script map | `package.json` | scripts.sync-publications + scripts.validate-content | WIRED | Both declared in `package.json` (lines 15, 17) and resolve to existing files |

**Note on diff-guard deviation:** Plan originally specified `git diff --quiet content/publications.json`. Implementation pivoted to jq-based payload-only comparison (commit `4f39ad5`) to handle the `_meta.synced_at` drift bug caught during the human-verify checkpoint. This is strictly a semantic improvement — `synced_at` now advances only on real content change, aligning with PUBS-09's "Actualizado el" meaning. Deviation fully documented in `10-01-SUMMARY.md` "Surprises / Lessons" and "Decisions Made" sections.

### Requirements Coverage

| REQ-ID | Status | Notes |
|--------|--------|-------|
| CI-01 (cron + workflow_dispatch) | SATISFIED | Lines 4-6 |
| CI-02 (contents: write) | SATISFIED | Lines 12-13 |
| CI-03 (pnpm + Node + frozen-lockfile + sync) | SATISFIED WITH DOCUMENTED DRIFT | Uses `pnpm/action-setup@v4` (not v5) and Node 20 (not 22) — drift documented in SUMMARY; code-of-record is `.nvmrc` + `engines.node`. |
| CI-04 (validate-content) | SATISFIED WITH DOCUMENTED DRIFT | Uses `pnpm validate-content` (not `check-content`) — `check-content` has never existed in `package.json`; drift documented in SUMMARY. |
| CI-05 (skip commit on no-op) | SATISFIED (IMPROVED) | Implementation pivoted from `git diff --quiet` to jq payload comparison — strict semantic improvement; deviation documented. |
| CI-06 (`[skip ci]` commit marker) | SATISFIED | Line 69 commit message `chore(publications): sync weekly feed [skip ci]` |
| CI-07 (step summary delta / no-change / failure) | SATISFIED | Lines 75-98 three-branch summary |
| CI-08 (workflow_dispatch push works) | SATISFIED | Human-observational; maintainer confirmed via the three bot commits on main |

All 8 REQ-IDs satisfied in behavior. Traceability table at `.planning/REQUIREMENTS.md:170-177` still shows checkboxes as "Pending" — housekeeping only, not a verification gap; the SUMMARY closes them at line 99.

### Anti-Patterns Found

None. Scanned workflow + both script files for TODO/FIXME/placeholder/stub/empty-return patterns — zero findings in this phase's artifacts.

### Human Verification Required

None outstanding. Human-observational must-haves SC1, SC3, SC4 were verified live by the maintainer today 2026-04-19 (confirmed in prompt), and the git log corroborates the first-dispatch evidence:

- `ebdd41e`, `4674f6a`, `b25386c` — three bot-authored `chore(publications): sync weekly feed [skip ci]` commits from the first live run
- `4f39ad5` — diff-guard fix applied after checkpoint caught the `_meta.synced_at` drift
- Second back-to-back dispatch produced no further bot commits (SC3 confirmed)

### Gaps Summary

No gaps. All 5 truths verified, all 3 artifacts exist at all three levels (existence, substantive, wired), all 5 key links wired, all 8 REQ-IDs satisfied (two with documented, strictly-non-regressive drifts recorded in SUMMARY), no anti-patterns, no outstanding human verification.

The only minor housekeeping observation is that `.planning/REQUIREMENTS.md` lines 170-177 still show the CI REQ-IDs as "Pending" rather than "Complete" — the SUMMARY closes them at line 99, but the traceability table was not updated. This is a documentation housekeeping delta, not a goal-achievement gap, and can be swept up in `/gsd:complete-phase` or the milestone audit.

---

_Verified: 2026-04-19T15:25:00Z_
_Verifier: Claude (gsd-verifier)_
