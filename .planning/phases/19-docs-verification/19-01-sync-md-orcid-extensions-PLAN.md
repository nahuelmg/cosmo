---
phase: 19-docs-verification
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - content/SYNC.md
autonomous: true

must_haves:
  truths:
    - "A maintainer reading content/SYNC.md can identify the ORCID Works API endpoint the sync script queries and understands the two ORCID URLs used (works list + per-work detail)"
    - "A maintainer reading content/SYNC.md understands the distinction between orcid_id (sync field) and contact.orcid (display field for the Phase 18 author-link pill) and knows to set both"
    - "A maintainer reading content/SYNC.md can state the DOI precedence rule (Manual > InspireHEP > ORCID > arXiv) without reading the script"
    - "A maintainer reading content/SYNC.md sees a realistic three-source _meta JSON example showing synced_at, sources, counts (inspirehep/arxiv/manual/orcid/deduped), and warnings"
    - "A maintainer hitting an ORCID-specific failure (404, private profile, missing work types, per-work-detail 404, non-404/non-200 error) can find a matching troubleshooting row in content/SYNC.md"
  artifacts:
    - path: "content/SYNC.md"
      provides: "Three-source sync maintainer guide including ORCID-specific sections"
      contains_all:
        - "pub.orcid.org/v3.0"
        - "arxiv.org/a/"
        - "contact.orcid"
        - "InspireHEP > ORCID > arXiv"
        - "deduped"
        - "journal-article"
  key_links:
    - from: "content/SYNC.md ORCID API section"
      to: "scripts/sync-publications.ts works-list + work-detail fetch calls"
      via: "endpoint URL citations"
      pattern: "pub\\.orcid\\.org/v3\\.0/\\{orcid\\}/works"
    - from: "content/SYNC.md DOI precedence section"
      to: "scripts/sync-publications.ts priorityOrdered concat (line ~873)"
      via: "stated precedence order matches script concat order"
      pattern: "Manual.*InspireHEP.*ORCID.*arXiv"
    - from: "content/SYNC.md field summary"
      to: "Phase 18 author-link pill (buildMemberOrcidMap)"
      via: "contact.orcid clarification"
      pattern: "contact\\.orcid"
---

<objective>
Extend content/SYNC.md with five ORCID-specific sections that together satisfy every sub-requirement of DOC-01. This is the final maintainer-facing documentation work for v1.3 — after this plan a new PI/student can wire up their ORCID, understand how the three sources combine, and troubleshoot ORCID-specific failures without reading any TypeScript.

Purpose: DOC-01 closure. The existing SYNC.md covers InspireHEP BAI lookup and ORCID sign-up (v1.1-era) but pre-dates the ORCID-as-sync-source work from Phases 16–18. A maintainer adding an ORCID today would not know which API the script calls, would miss the orcid_id vs contact.orcid distinction introduced in 18-01, would not understand DOI dedup precedence, would not know what _meta fields to expect, and would have no ORCID-specific troubleshooting matrix.

Output: A single atomic edit to content/SYNC.md adding the five sections listed under <tasks>. No code changes, no data changes.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/19-docs-verification/19-RESEARCH.md
@content/SYNC.md
@scripts/sync-publications.ts
@content/publications.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add ORCID API mechanics and contact.orcid clarification to SYNC.md</name>
  <files>content/SYNC.md</files>
  <action>
Open content/SYNC.md and add two inserts targeting DOC-01 (a) and DOC-01 (b).

**Insert A — "ORCID Works API: how the sync queries it"** — new `###` subsection directly AFTER the existing `## Finding Your ORCID` section (i.e. before `## \`display_name_normalized\` Format`). Must document:

1. Works-list endpoint: `https://pub.orcid.org/v3.0/{orcid}/works` — called once per person with `orcid_id` set; requires `Accept: application/json` header (default response is XML, which would break the JSON parser). Cite scripts/sync-publications.ts line ~365.
2. Per-work detail endpoint: `https://pub.orcid.org/v3.0/{orcid}/work/{putCode}` — called AFTER cross-source dedup, only for ORCID-only survivors, to populate the full contributor list (ORCID-06). Cite scripts/sync-publications.ts line ~400.
3. arXiv ORCID feed (separate, not the ORCID API): `https://arxiv.org/a/{orcid}.atom2` — the only arXiv endpoint that supports ORCID; the regular `search_query` does NOT. Cite scripts/sync-publications.ts line ~338.
4. Work-type filter: only `journal-article` and `conference-paper` surface; datasets, software, posters, talks, book chapters are dropped silently in `orcidGroupToPublication` (line ~536). Explicit call-out per research Pitfall 4.

Write in plain English, match the existing SYNC.md tone (declarative, maintainer-focused, no marketing). Use a fenced code block for each endpoint URL.

**Insert B — clarify orcid_id vs contact.orcid** — modify the existing `## Finding Your ORCID` section. The existing step 5 tells the reader to paste into `orcid_id` only; extend it so the reader sets BOTH fields:

- `orcid_id`: top-level field on the person entry — used by the sync script to query ORCID and arXiv APIs (drives data ingestion).
- `contact.orcid`: nested field inside `contact` — used by the `/publications` author-link ORCID pill (Phase 18 decision 18-01; rendered by `buildMemberOrcidMap` in `src/lib/publications-helpers.ts`). Pill appears on non-ORCID-source papers where a member-author has this field set.
- **Recommendation:** set both to the same 16-digit ID. `orcid_id` drives sync; `contact.orcid` drives display.

Update the example `people.json` snippet in the "Example full entry" section (Diana López Nacir) so that `contact` shows both `email` and `orcid` (pick a valid-shaped 16-digit ID consistent with her existing `orcid_id` — `0000-0003-4398-1147`).

Do NOT change any other sections. Do NOT renumber the existing sections. Preserve heading hierarchy (`##` for top-level sections, `###` for sub-sections).

Preview your change with `git diff content/SYNC.md` and re-read the whole file top-to-bottom to make sure the flow still reads cleanly.
  </action>
  <verify>
    - `git diff content/SYNC.md` shows only additions in the ORCID region + the contact.orcid update, no accidental deletions elsewhere
    - `grep -n "pub.orcid.org/v3.0" content/SYNC.md` returns at least 2 matches (works-list + work-detail)
    - `grep -n "arxiv.org/a/" content/SYNC.md` returns ≥1 match
    - `grep -n "contact.orcid" content/SYNC.md` returns ≥2 matches (prose + example)
    - `grep -n "journal-article" content/SYNC.md` returns ≥1 match
    - `pnpm validate-content` still passes (no JSON schema changes, but good sanity check)
  </verify>
  <done>
DOC-01 (a) satisfied: API endpoints documented. DOC-01 (b) satisfied: orcid_id vs contact.orcid distinction explicit with dual-field recommendation; example entry updated.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add DOI precedence, three-source _meta example, and ORCID troubleshooting to SYNC.md</name>
  <files>content/SYNC.md</files>
  <action>
Continue editing content/SYNC.md to add three more sections targeting DOC-01 (c), (d), (e).

**Insert C — "DOI precedence and cross-source dedup"** — new `###` subsection placed after the new "ORCID Works API" subsection from Task 1 (still under `## Finding Your ORCID` OR promoted to a new `##` section — pick whichever reads cleaner; the research note suggested the field-summary region, but adjacent to the ORCID API discussion is also valid). Must contain:

1. A precedence statement: **Manual > InspireHEP > ORCID > arXiv**, first-seen-wins.
2. A short table OR ordered-list showing the concat order used by `mergePublications` and the two dedup passes (arXiv-ID dedup first, then DOI dedup). Cite scripts/sync-publications.ts line ~873 (`priorityOrdered` concat).
3. DOI normalization rule (DEDUP-03): lowercased, `https://doi.org/` or `http://dx.doi.org/` prefix stripped, whitespace trimmed.
4. Why this order: manual entries hand-curated by maintainers always win; InspireHEP > ORCID because Inspire's records have richer HEP metadata (affiliations, PACS); ORCID > arXiv because ORCID is author-curated and usually has the published-journal version whereas arXiv is preprint-only.

**Insert D — Three-source `_meta` JSON example** — add to the `## Field Summary` section (or as a new `###` subsection adjacent to it) a fenced JSON block showing the real current `_meta` block from `content/publications.json`. Use this exact example (numbers from the 2026-04-20 sync per 19-RESEARCH.md §d):

```json
{
  "_meta": {
    "synced_at": "2026-04-20T20:45:58.468Z",
    "sources": ["inspirehep", "orcid", "arxiv"],
    "counts": {
      "inspirehep": 317,
      "arxiv": 73,
      "manual": 0,
      "orcid": 87,
      "deduped": 36
    },
    "warnings": [
      "No arXiv results for Esteban Calzetta (0000-0002-3083-3420)"
    ]
  }
}
```

Annotate each field in prose: `synced_at` (ISO timestamp of last successful run), `sources` (which sources were enabled this run — respects `--no-*` flags), `counts.{inspirehep,arxiv,manual,orcid}` (raw count per source before dedup), `counts.deduped` (DEDUP-05: how many cross-source DOI duplicates were dropped), `warnings` (non-fatal per-member issues). Note that `orcid` and `deduped` are REQUIRED schema fields per decision 16-01.

**Insert E — ORCID Troubleshooting** — add a new `###` subsection inside the existing `## Operational Troubleshooting` section (after "Running a dry-run locally" or as its own `###` between existing subsections — maintainer's judgement). Use a markdown table with columns "Symptom | Root cause | Script behavior | Fix". Rows (from 19-RESEARCH.md §e):

1. `Warning: ORCID profile not public or empty: {id}` in warnings block → HTTP 404 from `pub.orcid.org` — invalid ORCID iD typed into `orcid_id` → `fetchOrcid` returns `[]` (line ~368–370), script continues → Verify the ID resolves at `https://orcid.org/{id}`.
2. No warning but `counts.orcid` stays 0 for a specific member → HTTP 200 with empty `group: []` — profile is real but set to private or contains zero works (Pitfall 7, line ~357) → Silent; no error emitted → Member must make their works public in ORCID privacy settings.
3. Papers visible on orcid.org profile but missing from `publications.json` → Work type is not `journal-article` or `conference-paper` (datasets, software, posters, book chapters, preprints) → `orcidGroupToPublication` returns `null` (line ~536), item dropped → Expected; `/publications` is peer-reviewed-only. Out of scope per REQUIREMENTS.md.
4. Paper appears in `publications.json` but author list is just the owner's name → HTTP 404 on `/work/{putCode}` during enrichment — profile changed between works-list and detail fetch → Placeholder author list preserved (decision 17-03, line ~403) → Non-fatal; re-run `workflow_dispatch` to retry enrichment.
5. `ORCID {statusCode} for {orcid}` thrown in logs → Non-404, non-200 response (502/503/429) → `fetchWithRetry` wraps 503 + 429 with backoff (decision 17-01) — if persistent, bubbles up → Transient: re-run `workflow_dispatch`. Persistent 429 means upstream rate limit; wait an hour and retry.

Preserve existing troubleshooting subsections (workflow_dispatch how-to, step summary reading, cron failures, dry-run) unchanged.

**Final polish pass:** re-read the whole file. Check that:
- Heading hierarchy is consistent (one `#` title, `##` sections, `###` subsections — no skipped levels)
- All fenced code blocks have language identifiers (```json, ```bash, ```js)
- No trailing whitespace added
- Table column separators align (pipe characters)
- References to script line numbers use `line ~NNN` (approximate, since line numbers shift with edits) not `line NNN` (brittle)
  </action>
  <verify>
    - `grep -n "InspireHEP > ORCID > arXiv" content/SYNC.md` returns ≥1 match
    - `grep -n "deduped" content/SYNC.md` returns ≥2 matches (_meta example + dedup explanation)
    - `grep -n "journal-article" content/SYNC.md` returns ≥1 match (troubleshooting row 3 or API section work-type filter)
    - `grep -n '"counts"' content/SYNC.md` returns ≥1 match (_meta JSON block)
    - `grep -nE 'ORCID profile not public' content/SYNC.md` returns ≥1 match (troubleshooting row 1)
    - `pnpm validate-content` still passes
    - `git diff --stat content/SYNC.md` shows only SYNC.md changed
  </verify>
  <done>
DOC-01 (c) satisfied: DOI precedence rule explicit. DOC-01 (d) satisfied: three-source _meta JSON example with field annotations. DOC-01 (e) satisfied: ORCID troubleshooting table covering all five failure modes. REQUIREMENTS.md line 54 DOC-01 can be checked off.
  </done>
</task>

</tasks>

<verification>
Phase-level cross-cutting checks after both tasks complete:

1. All five DOC-01 sub-requirements covered — walk through SC1 (a)–(e) and point to the content/SYNC.md section that satisfies each.
2. `content/SYNC.md` still renders cleanly as markdown (no broken fences, tables, or heading levels) — verify by running `ls -la content/SYNC.md` and opening the file in a preview.
3. No unintended changes outside SYNC.md: `git diff --stat` must show only `content/SYNC.md`.
4. Existing sections preserved verbatim — Finding Your BAI, display_name_normalized format, workflow_dispatch how-to, step summary reading, cron-failure playbook, dry-run instructions.
5. `pnpm validate-content` passes (no schema impact, but confirms no accidental JSON file touches).
</verification>

<success_criteria>
Measurable:
- `content/SYNC.md` contains all five DOC-01 insertions (verified by the grep commands in each task's <verify> block).
- `pnpm validate-content` exits 0.
- No files other than `content/SYNC.md` modified.
- All five of DOC-01's enumerated sub-requirements (a)(b)(c)(d)(e) have a corresponding passage in the file.
</success_criteria>

<output>
After completion, create `.planning/phases/19-docs-verification/19-01-SUMMARY.md` with:
- Which SYNC.md sections were added/modified (with line ranges)
- Sample grep confirmations that DOC-01 (a)–(e) are each covered
- Any deviations from the plan (e.g., if a section was placed in a different location than the plan suggested)
- Commit hash for the edit
</output>
