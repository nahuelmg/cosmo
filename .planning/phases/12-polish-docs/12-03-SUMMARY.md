---
phase: 12-polish-docs
plan: 03
subsystem: docs
tags: [sync, maintainer-docs, inspirehep, orcid, workflow-dispatch, troubleshooting, requirements]

requires:
  - phase: 07-schema-foundation
    provides: PersonSchema.inspirehep_id + orcid_id + display_name_normalized fields, initial SYNC.md sections (BAI/ORCID/display_name_normalized/Field Summary)
  - phase: 09-sync-script
    provides: scripts/sync-publications.ts CLI (--dry-run, --member, --no-arxiv, --no-inspire, --verbose), SYNC-02/03/05/06/14 error shapes
  - phase: 10-ci-wiring
    provides: .github/workflows/sync-publications.yml (workflow_dispatch + cron schedule), CI-04/05/06/07 step-summary semantics
  - phase: 12-02-data-backfill
    provides: diana-lopez-nacir populated record (real inspirehep_id D.Lopez.Nacir.1 + orcid_id 0000-0003-4398-1147) used as paste-ready example
provides:
  - Extended content/SYNC.md with "Example full entry" subsection (paste-ready people.json snippet)
  - Extended content/SYNC.md with "Operational Troubleshooting" h2 (workflow_dispatch / step summary / cron-failure diagnosis / local --dry-run)
  - REQUIREMENTS.md DOC-01 + DOC-02 flipped Pending -> Complete (spec bullets + traceability table + coverage line)
affects: [gsd-audit-milestone, gsd-complete-milestone, v1.1-release, future-maintainer-onboarding]

tech-stack:
  added: []
  patterns:
    - "Maintainer-facing docs live alongside schema-validated content (content/SYNC.md next to content/people.json) — hover-jumpable via @see JSDoc pointers"
    - "Troubleshooting sections cross-reference the REQUIREMENTS.md requirement IDs (SYNC-02/03/05/06/14, CI-04/05/06/07) so operators can trace symptoms back to spec decisions"

key-files:
  created:
    - ".planning/phases/12-polish-docs/12-03-SUMMARY.md"
  modified:
    - "content/SYNC.md (+132 lines — Example full entry subsection + Operational Troubleshooting h2)"
    - ".planning/REQUIREMENTS.md (DOC-01/02 spec + traceability + Coverage line)"

key-decisions:
  - "Paste-ready snippet uses diana-lopez-nacir (real 12-02 backfill data) rather than a fictional placeholder — pulls actual inspirehep_id D.Lopez.Nacir.1 + orcid_id 0000-0003-4398-1147 + email. Long bio/interests elided as '...' to keep snippet ~22 lines. Concrete example that will still be valid after future ID updates because it's anchored to a shipped record."
  - "Example placed as Field Summary subsection (not under 'Finding Your ORCID') — keeps the two ID-lookup sections tight and self-contained; the combined example naturally belongs with the field-shape table."
  - "Operational Troubleshooting placed as new final h2 (after Field Summary) — maintains 'lookup first, operate second' narrative flow; new operators read top-down without having to jump back."
  - "Each troubleshooting subsection is h3 under the single h2 (not four separate h2s) — keeps the h2 count low and groups operational content as a unit in VS Code's markdown outline."
  - "Coverage line rewrite: 'phases 7-12' (en-dash preserved from prior revision). Notes both DOC-01/02 closure and DATA-09/10 improvement to 9/14 coverage — gives milestone auditor a one-line view of what Phase 12 touched."

patterns-established:
  - "Paste-ready people.json snippets use the most-recently-verified real record as the source of truth; long prose fields elide to '...' for scannability"
  - "Operational docs cite workflow files by full path (.github/workflows/sync-publications.yml) and script files by full path (scripts/sync-publications.ts) — no relative shortcuts that break when the doc moves"

duration: 14min
completed: 2026-04-19
---

# Phase 12 Plan 03: Maintainer Docs (DOC-01 + DOC-02) Summary

**content/SYNC.md extended with paste-ready diana-lopez-nacir people.json snippet and full Operational Troubleshooting section (workflow_dispatch / step summary / cron-failure playbook / local --dry-run); REQUIREMENTS.md DOC-01/02 flipped Complete**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-04-19T21:08Z (approx)
- **Completed:** 2026-04-19T21:22Z (approx)
- **Tasks:** 2
- **Files modified:** 2 (content/SYNC.md, .planning/REQUIREMENTS.md)

## Accomplishments

- **DOC-01 closed:** content/SYNC.md now has a paste-ready `people.json` snippet showing `inspirehep_id` + `orcid_id` in context — the last missing piece of the maintainer ID-lookup guide (BAI + ORCID how-tos already shipped in 07-01; this closes the loop with a concrete copy-paste target).
- **DOC-02 closed:** content/SYNC.md has a new `## Operational Troubleshooting` section covering all four operator scenarios from the plan — manual `workflow_dispatch` sync, step-summary interpretation (three delta shapes + warnings), cron-failure diagnosis (4 failure modes mapped to requirement IDs), and local `--dry-run` preview.
- **REQUIREMENTS.md traceability clean:** DOC-01/02 flipped from `Pending` -> `Complete` in both the spec bullets (with rewritten descriptions matching what actually shipped) and the traceability table; Coverage line updated to `phases 7-12`.
- **Phase 12 gap-closure complete (3/3 plans):** 12-01 (lint/JSDoc) + 12-02 (data backfill + sync purge) + 12-03 (maintainer docs) all landed. v1.1 milestone ready for `/gsd:audit-milestone` re-run.

## Task Commits

Each task committed atomically:

1. **Task 1: Extend content/SYNC.md with ID-lookup examples + operational troubleshooting** - `518b4d7` (docs)
2. **Task 2: Flip DOC-01 + DOC-02 to Complete in REQUIREMENTS.md** - `71546de` (docs)

## Files Created/Modified

- `content/SYNC.md` — +132 lines. Added `### Example full entry` subsection under `## Field Summary` (paste-ready diana-lopez-nacir snippet, ~22 JSON lines, long prose elided to `"..."`). Added `## Operational Troubleshooting` h2 with four h3 subsections: "Running a manual sync (`workflow_dispatch`)", "Reading the step summary", "When the cron fails", "Running a dry-run locally". Cites `.github/workflows/sync-publications.yml` (workflow_dispatch + `schedule: cron: "0 6 * * 1"`) and `scripts/sync-publications.ts` CLI flags (`--dry-run`, `--member <slug>`, `--no-arxiv`, `--no-inspire`, `--verbose`).
- `.planning/REQUIREMENTS.md` — 5 lines changed: DOC-01 + DOC-02 spec bullets rewritten (`[ ]` -> `[x]` + new descriptions matching shipped content); DOC-01 + DOC-02 traceability rows (`Phase 11 | Pending` -> `Phase 11 / closed Phase 12 | Complete`); Coverage line (`phases 7-11` -> `phases 7-12` + Phase 12 closure note).
- `.planning/phases/12-polish-docs/12-03-SUMMARY.md` — this file.

## Decisions Made

- **Example record selection:** Used `diana-lopez-nacir` (from 12-02 backfill) rather than a generic placeholder — pulls actual `inspirehep_id: "D.Lopez.Nacir.1"` + `orcid_id: "0000-0003-4398-1147"` from the current `people.json`. Concrete, verifiable, and self-updating (stays in sync with reality even if IDs change because the file-level example is a human reference, not an import).
- **Snippet elision strategy:** `short_bio`, `full_bio`, and `research_interests` array elided to `"..."` / `[ { "es": "...", "en": "..." } ]` — keeps the paste-ready snippet to ~22 lines while preserving the full JSON structure. `publications_selected: []` retained empty because it's schema-required; `social_links: []` retained because it's an array even when empty; `contact.email` retained (1 line, high signal). Dropped `contact.orcid` and `contact.office` from example (redundant with `orcid_id`; office is optional).
- **Placement in SYNC.md:** Example snippet placed as `### Example full entry` subsection under the existing `## Field Summary` h2, not under "Finding Your ORCID" — keeps the two ID-lookup how-to sections tight and self-contained; the combined example naturally belongs with the field-shape table.
- **Operational Troubleshooting structure:** Single h2 with four h3 subsections rather than four separate h2s — keeps the VS Code markdown outline compact and groups operational content as one unit. Subsection order follows the narrative "what do I do first, what do I watch, what if it breaks, what if I want to preview" — maps to actual operator mental model.
- **Cross-referencing REQUIREMENTS IDs:** Each cron-failure mode is tagged with its originating requirement ID (`SYNC-02`, `SYNC-03`, `SYNC-06`, `CI-04`) — when an operator hits an error, they can grep REQUIREMENTS.md for the ID and find the original decision context. This is the first time SYNC.md cross-references REQUIREMENTS.md by ID; pattern locked for future v1.2 operational docs.
- **REQUIREMENTS spec bullet rewrites:** Did NOT preserve the original bullet text when flipping to `[x]` — rewrote to describe what actually shipped. Original DOC-01 bullet mentioned `arxiv_id` which was reconceived as `orcid_id` in Phase 7-02; the updated bullet notes this inline. Keeps the spec honest rather than archaeological.

## Deviations from Plan

None - plan executed exactly as written. Snippet location, annotation text, all four troubleshooting subsections (B.1-B.4), and both REQUIREMENTS.md edits landed in the specified form.

## Issues Encountered

None. Plan was surgical and well-specified.

## User Setup Required

None — no external service configuration required. All changes are documentation-only in `content/SYNC.md` and `.planning/REQUIREMENTS.md`.

## Verification Evidence

```bash
# Task 1 — content/SYNC.md
$ grep -c '^## ' content/SYNC.md           # expect >=5
5
$ grep -c 'workflow_dispatch' content/SYNC.md
4
$ grep -c 'sync-publications.yml' content/SYNC.md
2
$ grep -ci 'step summary' content/SYNC.md
3
$ grep -c 'dry-run' content/SYNC.md
3
$ grep -c '429' content/SYNC.md
3

# Task 2 — REQUIREMENTS.md
$ grep -cE 'DOC-0[12].*Pending' .planning/REQUIREMENTS.md   # expect 0
0
$ grep 'DOC-01\|DOC-02' .planning/REQUIREMENTS.md
- [x] **DOC-01**: Maintainer note in `content/SYNC.md` explains ...
- [x] **DOC-02**: Operational Troubleshooting section in `content/SYNC.md` covers ...
| DOC-01 | Phase 11 / closed Phase 12 | Complete |
| DOC-02 | Phase 11 / closed Phase 12 | Complete |
$ grep 'Coverage:' .planning/REQUIREMENTS.md
**Coverage:** 54 requirements across phases 7-12. DOC-01 + DOC-02 closed Phase 12; DATA-09/10 improved to 9/14 coverage Phase 12. All v1.1 requirements mapped.

# End-of-plan build
$ pnpm build
... 45/45 static routes
```

## Next Phase Readiness

**v1.1 milestone ready for audit + completion.** Phase 12 gap closure 3/3 complete:

- 12-01: lint + JSDoc carryover fixes (commits `70337f8`, `4bf708d`, etc.)
- 12-02: 9-member data backfill + Matias Leizerovich rename + 321 real publications + template-placeholder purge + REQUIREMENTS DATA-09/10 update
- 12-03 (this plan): DOC-01 + DOC-02 closure

**Next steps for operator:**
1. (Optional) Fix `cecilia-scannapieco` display_name_normalized typo before audit — flagged in 12-02 decisions; not a 12-03 scope item but blocks accurate surname-match for her 47 InspireHEP papers.
2. Run `/gsd:audit-milestone` to confirm v1.1 gate state.
3. Run `/gsd:complete-milestone` to close v1.1.

**Carryovers beyond v1.1:**
- DATA-09/10 still at 9/13 sync-scoped coverage — 4 members (juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia) lack IDs; profiles show empty publications sections until backfilled. Not a code blocker; tracked in REQUIREMENTS.md traceability as Partial.
- v1.2 cleanup scheduled: Zod `publications_selected` field removal + `people.selectedPublications` i18n key deletion.

---
*Phase: 12-polish-docs*
*Completed: 2026-04-19*
