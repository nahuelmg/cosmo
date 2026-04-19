---
phase: 07-schema-extension
verified: 2026-04-19T00:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
scope_adjustments_documented:
  - id: adj-1
    what: "BAI regex widened from /^[A-Z]\\.[A-Za-z-]+\\.\\d+$/ to /^[A-Z][A-Za-z-]*(\\.[A-Za-z-]+)+\\.\\d+$/"
    why: "Original regex rejected legitimate multi-segment BAIs (S.J.Landau.1, Tomas.F.Chase.1 — the latter was an SYNC.md example)"
    commit: 97612b6
    verdict: CORRECT — real-data bug caught at Task 3; widened regex still rejects all invalid forms
  - id: adj-2
    what: "PersonSchema.arxiv_id replaced with orcid_id (orcidId shared helper)"
    why: "Group members have ORCID but not arXiv author-page slugs; arxivId paper-ID regex would have rejected every real author slug anyway"
    commit: 97612b6
    verdict: CORRECT — ORCID is accepted by both arXiv + InspireHEP APIs; PublicationSchema.arxiv (paper IDs) unaffected
  - id: adj-3
    what: "DATA-09/10 partial: only tomas-ferreira-chase populated with real IDs this cycle"
    why: "Maintainer provided one entry; CONTEXT.md explicitly allows partial — does not block Phase 7, blocks Phase 9 E2E only"
    verdict: ACCEPTABLE per CONTEXT.md policy
---

# Phase 7: Schema Extension — Verification Report

**Phase Goal:** Extend PersonSchema with sync-enabling fields (`inspirehep_id`, `orcid_id`, `display_name_normalized`) and extend PublicationSchema with `source` + arXiv ID fields. Ship supporting maintainer docs and deprecate `publications_selected`. Populate `display_name_normalized` on all members and real IDs for at least the available investigators/postdocs.

**Verified:** 2026-04-19
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Scope Adjustments vs. Original ROADMAP

The ROADMAP and REQUIREMENTS.md were written before real member data was available. Two field-level changes and one data-coverage adjustment were made during execution:

| ID | Change | Correctness |
|----|--------|-------------|
| adj-1 | BAI regex widened to accept multi-segment initials | Correct — real data (S.J.Landau.1) would have been rejected by original regex |
| adj-2 | `arxiv_id` on PersonSchema replaced with `orcid_id` | Correct — ORCID is the portable ID the group actually holds; arXiv + InspireHEP both support ORCID queries |
| adj-3 | DATA-09/10 partial (1 of 13 current members populated) | Acceptable — CONTEXT.md policy explicit; blocks Phase 9 E2E only |

SCHEMA-03 in REQUIREMENTS.md originally specified `arxiv_id?`. The shipped field is `orcid_id?` (same intent: a portable per-person author query identifier; better implementation). This is a **correct deviation**, not a gap.

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria + PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| SC1 | `pnpm validate-content` passes on v1.0 `publications.json` with no data changes — `.default("manual")` holds | VERIFIED | `pnpm validate-content` exits 0; inline parse confirms 13 entries with `source: "manual"` |
| SC2 | Adding `inspirehep_id: "E.Calzetta.1"` to any person entry passes schema validation | VERIFIED | `PersonSchema.safeParse` with `inspirehep_id: "E.Calzetta.1"` → success; `r.data.inspirehep_id === "E.Calzetta.1"` |
| SC3 | Pre-2007 arXiv ID `gr-qc/9209007` passes publication schema validation | VERIFIED | `PublicationsSchema.safeParse([{...arxiv: "gr-qc/9209007"...}])` → OK |
| SC4 | JSON Schemas regenerated in same commit sequence as Zod changes | VERIFIED | Commits `9c30f4b` (feat) + `e6b3324` (chore) both in phase 07-01; `content/publications.schema.json` exposes `source` enum; `content/people.schema.json` exposes `inspirehep_id`, `orcid_id`, `display_name_normalized` |
| SC5 | `PersonSchema.publications_selected` marked `@deprecated` in JSDoc; field still parses | VERIFIED | Line 77 in `people.schema.ts`: `@deprecated v1.1`; inline parse with `publications_selected: ["pub-1","pub-2"]` succeeds |
| T6 | `display_name_normalized` on ALL 15 entries (current + past) | VERIFIED | `jq '[.[] | select(.display_name_normalized == null)]'` → `[]`; 15/15 entries populated |
| T7 | `content/people.schema.json` exposes `orcid_id` (not `arxiv_id`) | VERIFIED | `grep '"orcid_id"' content/people.schema.json` → 1 match; `grep '"arxiv_id"'` → 0 matches |
| T8 | `content/publications.schema.json` exposes `source` enum | VERIFIED | `grep -A5 '"source"'` shows `"enum": ["manual","inspirehep","arxiv"]` with `"default":"manual"` |
| T9 | `content/SYNC.md` covers BAI + ORCID + `display_name_normalized` (not arXiv author-page section) | VERIFIED | 4 `##` sections: "Finding Your InspireHEP BAI Identifier", "Finding Your ORCID", "`display_name_normalized` Format", "Field Summary"; 105 lines |
| T10 | `pnpm typecheck` passes | VERIFIED | Exits 0 with no output |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Status | Lines | Key Evidence |
|----------|--------|-------|-------------|
| `src/content/schemas/shared.ts` | VERIFIED | 185 | `arxivId` regex: `/^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/`; `normalizeName` exported at line 183 |
| `src/content/schemas/publications.schema.ts` | VERIFIED | 127 | `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` at line 86 |
| `src/content/schemas/people.schema.ts` | VERIFIED | 201 | `inspirehep_id` (widened BAI regex line 91), `orcid_id` (line 103), `display_name_normalized` (line 112); `@deprecated v1.1` at line 77 |
| `content/publications.schema.json` | VERIFIED | - | `"source"` with enum `["manual","inspirehep","arxiv"]` and `"default":"manual"` present |
| `content/people.schema.json` | VERIFIED | - | `"inspirehep_id"` (1 match), `"orcid_id"` (1 match), `"display_name_normalized"` (2 matches); `"arxiv_id"` absent |
| `content/SYNC.md` | VERIFIED | 105 | 4 `##` sections; covers BAI lookup, ORCID lookup, `display_name_normalized` spec, field summary |
| `content/people.json` | VERIFIED | - | 15/15 entries have `display_name_normalized`; `tomas-ferreira-chase` has `inspirehep_id: "Tomas.F.Chase.1"` and `orcid_id: "0009-0001-0286-2136"` |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/content/schemas/people.schema.ts` | `src/content/schemas/shared.ts` | imports `orcidId` for `orcid_id` field | WIRED | `import { ..., orcidId } from "./shared"` at line 25; `orcid_id: orcidId.optional()` at line 103 |
| `src/content/schemas/publications.schema.ts` | `src/content/schemas/shared.ts` | imports `arxivId` for publication-level `arxiv` field | WIRED | `import { canonicalString, arxivId, doiId } from "./shared"` at line 20; `arxiv: arxivId.optional()` at line 65 |
| `content/people.schema.json` | `src/content/schemas/people.schema.ts` | `pnpm generate-schemas` regenerated from Zod | WIRED | JSON schema contains `"inspirehep_id"` and `"orcid_id"` matching Zod definition; commit `97612b6` includes regen after BAI regex fix |
| `content/people.json` | `src/content/schemas/people.schema.ts` | `pnpm validate-content` parses via `PeopleSchema.safeParse` | WIRED | `pnpm validate-content` exits 0 on full 15-entry file |

---

## Requirements Coverage (Phase 7 subset)

| Requirement | Original Spec | Shipped | Status | Notes |
|-------------|--------------|---------|--------|-------|
| SCHEMA-01 | `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` | Exact match | SATISFIED | |
| SCHEMA-02 | arxiv ID regex accepts pre-2007 `gr-qc/9209007` | `/^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/` | SATISFIED | |
| SCHEMA-03 | `arxiv_id?: string` on PersonSchema | `orcid_id?: orcidId` — field renamed, intent preserved | SATISFIED (deviation) | ORCID is the actual portable identifier; arXiv + InspireHEP accept ORCID queries |
| SCHEMA-04 | `publications_selected` marked `@deprecated` JSDoc | `@deprecated v1.1` at line 77; Zod shape unchanged; field still parses | SATISFIED | |
| SCHEMA-05 | All 5 JSON Schema files regenerated in same commit as Zod changes | `e6b3324` regenerates all 5 sidecar files; `97612b6` re-regenerates after BAI fix | SATISFIED | |
| SCHEMA-06 | `pnpm check-content` passes on v1.0 JSON | `pnpm validate-content` exits 0 | SATISFIED | |
| DATA-09 | `inspirehep_id` populated for all current PIs, postdocs, PhDs | 1 of 13 populated (`tomas-ferreira-chase: "Tomas.F.Chase.1"`) | PARTIAL — ACCEPTABLE | CONTEXT.md: partial does not block Phase 7; blocks Phase 9 E2E only |
| DATA-10 | `arxiv_id` (reconceived as `orcid_id`) populated for all current members who have one | 1 of 13 populated (`tomas-ferreira-chase: "0009-0001-0286-2136"`) | PARTIAL — ACCEPTABLE | Same policy as DATA-09 |

---

## Anti-Patterns Scan

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| All modified files | TODO/FIXME/placeholder | — | None found |
| `people.schema.ts` | `arxiv_id` comment text in `@deprecated` line 79 (refers to `inspirehep_id / arxiv_id`) | INFO | Stale comment references the pre-deviation field name `arxiv_id`; does not affect runtime or validation; low priority cosmetic |
| `content/people.json` | `esteban-calzetta` contact.scholar points to `...?user=calzetta_placeholder` | INFO | Placeholder URL in `scholar` field — not a schema issue; a data quality note for maintainer |

No blocker or warning anti-patterns found.

---

## Command Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `pnpm validate-content` | 0 | "Content validation passed (5 files, all entries parsed, all photos exist)" |
| `pnpm typecheck` | 0 | No output (clean) |
| Pre-2007 arXiv inline parse | 0 | "OK — gr-qc/9209007 accepted; source defaults to: manual" |
| Full publications.json parse | 0 | "OK — publications.json parses with source.default(manual) — 13 entries" |
| SC2 `E.Calzetta.1` spot-check | 0 | "OK — E.Calzetta.1 accepted, inspirehep_id: E.Calzetta.1" |
| `publications_selected` parse check | 0 | "OK — publications_selected still parses, has 2 entries" |
| BAI regex multi-segment test | 0 | All 4 accept cases pass; all 4 reject cases fail |

---

## Commit Verification

All 6 referenced commits confirmed present in `git log`:

| Commit | Tag | Content |
|--------|-----|---------|
| `9c30f4b` | feat(07-01) | Extend PublicationSchema + PersonSchema for v1.1 sync |
| `e6b3324` | chore(07-01) | Regenerate JSON Schemas for v1.1 sync fields |
| `6a851f8` | docs(07-01) | Add content/SYNC.md maintainer lookup guide |
| `9b3c38e` | data(07-02) | Populate display_name_normalized on all members |
| `97612b6` | fix(07-02) | Loosen BAI regex + swap arxiv_id→orcid_id on PersonSchema |
| `e2a6b80` | data(07-02) | Populate tomas-ferreira-chase IDs (DATA-09 partial) |

---

## Human Verification (Optional — Not Blocking)

These items pass automated checks but have a human-confirmation component:

### 1. VS Code IntelliSense for new fields

**Test:** Open `content/people.json` in VS Code, add `"inspirehep_id": "` inside any current-member entry — VS Code should offer autocomplete and show the `@see content/SYNC.md` JSDoc on hover.
**Expected:** Autocomplete accepts `"E.Calzetta.1"`; red squiggle on `"INVALID"`.
**Why human:** IDE integration cannot be verified programmatically.

### 2. DATA-09/10 remaining 13 members

**Test:** Before Phase 9 E2E testing, populate `inspirehep_id` + `orcid_id` for the 12 remaining current members listed in 07-02-SUMMARY.md "Blockers Remaining" section.
**Expected:** `pnpm validate-content` continues to pass after each addition.
**Why human:** Real BAI + ORCID values require maintainer action.

---

## Overall Assessment

Phase 7 achieved its goal. The schema extension is atomic, backward-compatible, and fully validated:

- All v1.0 content continues to parse unchanged
- New fields are live in both Zod types and regenerated JSON Schemas
- Maintainer documentation covers the two scope adjustments (ORCID replaces arXiv author-page slug; BAI regex widened for multi-segment names)
- `pnpm validate-content` and `pnpm typecheck` both pass
- The two scope deviations (adj-1, adj-2) are correct responses to real-data constraints discovered at Task 3; they do not weaken the phase goal
- The partial DATA-09/10 coverage (1/13 members populated) is explicitly acceptable per CONTEXT.md and tracked in 07-02-SUMMARY.md for Phase 9 prep

Downstream phases (8, 9, 11) have a stable, tested schema foundation.

---

*Verified: 2026-04-19*
*Verifier: Claude (gsd-verifier)*
