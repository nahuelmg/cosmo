# content/SYNC.md — Maintainer Lookup Guide

How to populate the three per-person fields that drive the v1.1 arXiv + InspireHEP sync:
`inspirehep_id`, `orcid_id`, and `display_name_normalized`.

All three live on each entry in `content/people.json`. The Zod schema is
`src/content/schemas/people.schema.ts`. VS Code will auto-validate via the
sidecar `content/people.schema.json`.

---

## Finding Your InspireHEP BAI Identifier

InspireHEP assigns every physicist a permanent "BAI" (Bibliographic Author
Identifier) of the form `Initial.Surname.N`, e.g. `E.Calzetta.1`.

1. Go to <https://inspirehep.net/authors> and search for your name.
2. Open your author profile page.
3. The URL is `https://inspirehep.net/authors/<numeric-id>` — ignore the
   numeric id; you want the BAI.
4. On the profile page, look for the "BAI" label (usually in the sidebar,
   near "ORCID" and "Other IDs"). Copy the string — it looks like
   `E.Calzetta.1`, `D.LopezNacir.1`, `S.J.Landau.1`.
5. Paste into `people.json`:

   ```json
   "inspirehep_id": "E.Calzetta.1"
   ```

Schema validation: `/^[A-Z][A-Za-z-]*(\.[A-Za-z-]+)+\.\d+$/` (initial segment, one or more name segments, digit — supports multi-part names like `S.J.Landau.1`, `Tomas.F.Chase.1`).

---

## Finding Your ORCID

ORCID (Open Researcher and Contributor ID) is a portable 16-digit
identifier that links to your publications across arXiv, InspireHEP,
and most academic databases.

1. If you don't have one: sign up at <https://orcid.org/register>
   (free, ~2 minutes).
2. Once registered, find your ORCID on the top-right of your orcid.org
   profile. Format: `0000-0002-1234-5678` (four 4-digit groups, the
   last may end in `X`).
3. Link it to arXiv: log in at <https://arxiv.org/user> → "Change user
   information" → paste your ORCID.
4. Link it to InspireHEP: open your author profile, click "Update your
   profile" → add ORCID under "Other IDs".
5. Paste into `people.json` — **set both fields** (see note below):

   ```json
   "orcid_id": "0000-0002-1234-5678"
   ```

   and inside the `contact` object:

   ```json
   "contact": {
     "email": "you@example.com",
     "orcid": "0000-0002-1234-5678"
   }
   ```

Schema validation: `/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/` (same helper as
the shared `orcidId`).

**`orcid_id` vs `contact.orcid` — set both**

These are two separate fields with different purposes:

- `orcid_id` — top-level field on the person entry. Used by the sync
  script to query the ORCID Works API and the arXiv ORCID feed. Drives
  data ingestion (which papers are pulled in).
- `contact.orcid` — nested inside the `contact` object. Used by the
  `/publications` page to render an ORCID link pill next to the
  author's name on any publication where they are listed as an author
  (Phase 18 decision 18-01; rendered via `buildMemberOrcidMap` in
  `src/lib/publications-helpers.ts`). The pill appears even on papers
  sourced from InspireHEP or arXiv.

**Recommendation:** set both to the same 16-digit ID. `orcid_id` drives
sync; `contact.orcid` drives display. If you only set `orcid_id`, papers
will sync correctly but no ORCID link pill will appear on the author's
name in the publications list.

Students without ORCID: leave both fields out. Register when you
publish your first paper.

---

### ORCID Works API: how the sync queries it

The sync script makes up to three separate HTTP requests per person who
has an `orcid_id`. All calls go to the **anonymous ORCID Public API** —
no OAuth is required.

**1. Works list** (one call per person, always)

```
https://pub.orcid.org/v3.0/{orcid}/works
```

Returns a grouped list of all works on the profile. The request must
include `Accept: application/json`; the API default is XML, which would
break the JSON parser (scripts/sync-publications.ts line ~365).

**2. Per-work detail** (one call per ORCID-only survivor, after dedup)

```
https://pub.orcid.org/v3.0/{orcid}/work/{putCode}
```

Called after cross-source DOI dedup to fetch the full contributor list
for papers that survived only in the ORCID source (ORCID-06). Enrichment
runs after dedup so no detail calls are wasted on papers that were already
ingested from InspireHEP or arXiv (scripts/sync-publications.ts line ~400).

**3. arXiv ORCID feed** (separate from the ORCID API — one call per person)

```
https://arxiv.org/a/{orcid}.atom2
```

The only arXiv endpoint that supports ORCID lookup. The standard
`export.arxiv.org/api/query` search endpoint does NOT accept an ORCID as
a query parameter. Results are an Atom feed parsed with `fast-xml-parser`
(scripts/sync-publications.ts line ~338).

**Work-type filter**

Only `journal-article` and `conference-paper` entries surface from the
ORCID Works API. Datasets, software, posters, talks, book chapters, and
preprints-only entries are silently dropped in `orcidGroupToPublication`
(scripts/sync-publications.ts line ~536). This is intentional: the
`/publications` page covers peer-reviewed outputs only.

---

### DOI precedence and cross-source dedup

When the same paper appears in more than one source, the sync uses
**first-seen-wins** across a fixed priority order:

**Manual > InspireHEP > ORCID > arXiv**

This order matches the `priorityOrdered` concat at
scripts/sync-publications.ts line ~873:

```typescript
const priorityOrdered = [...manualEntries, ...allInspire, ...allOrcid, ...allArxiv];
```

Two dedup passes then remove cross-source duplicates:

| Pass | Key | Where |
|------|-----|-------|
| 1 | arXiv ID | Catches InspireHEP + arXiv duplicates (existing behaviour) |
| 2 | DOI | Catches InspireHEP + ORCID and ORCID + arXiv duplicates |

Both passes run **before** the final sort so that source priority is
preserved (the sort would scramble the order and break first-seen-wins).

**DOI normalization (DEDUP-03):** before comparison, DOIs are lowercased,
the `https://doi.org/` or `http://dx.doi.org/` prefix is stripped, and
surrounding whitespace is trimmed.

**Why this priority order:**

- Manual entries are hand-curated by maintainers and always take
  precedence.
- InspireHEP beats ORCID because Inspire records carry richer HEP
  metadata (affiliations, conference proceedings, PACS codes).
- ORCID beats arXiv because ORCID is author-curated and typically links
  to the published journal version, whereas arXiv is a preprint.

The `counts.deduped` field in `_meta` records how many cross-source DOI
duplicates were dropped in pass 2.

---

## `display_name_normalized` Format

ASCII-folded, lowercase version of the maintainer's display name. Phase 11
uses it to substring-match normalized author strings from sync output
against the group roster.

Spec (also exported as `normalizeName` in `src/content/schemas/shared.ts`):

1. Unicode NFD decomposition
2. Strip all combining marks (`\p{M}`)
3. Lowercase

Examples:

| `name`               | `display_name_normalized`  |
|----------------------|----------------------------|
| Esteban Calzetta     | esteban calzetta           |
| Diana Lopez Nacir    | diana lopez nacir          |
| Núñez, María         | nunez, maria               |
| Juan Manuel Armaleo  | juan manuel armaleo        |

Required field — every person in `people.json` must have it. Students
without IDs still need this.

Quick check in a Node shell:

```js
"Núñez, María".normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
// → "nunez, maria"
```

---

## Field Summary

| Field                      | Required | Shape                                       | Purpose              |
|----------------------------|----------|---------------------------------------------|----------------------|
| `inspirehep_id`            | optional | BAI (e.g. `E.Calzetta.1`, `S.J.Landau.1`)  | InspireHEP sync      |
| `orcid_id`                 | optional | 16-digit ORCID (e.g. `0000-0002-1234-5678`) | ORCID + arXiv sync   |
| `contact.orcid`            | optional | 16-digit ORCID (same value as `orcid_id`)   | Author ORCID pill    |
| `display_name_normalized`  | required | ASCII-fold + lowercase of `name`            | Author matching      |

`orcid_id` and `contact.orcid` serve different purposes — see the
`orcid_id` vs `contact.orcid` note above. Set both to the same ID.

Definitive source: `src/content/schemas/people.schema.ts`. VS Code hover on
each field will show the `@see content/SYNC.md` pointer back to this file.

### `_meta` block: what the sync writes to `publications.json`

After every sync run the script writes a `_meta` object at the top level
of `content/publications.json`. Real example from the 2026-04-20 sync:

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

Field annotations:

- `synced_at` — ISO 8601 timestamp of when the run completed.
- `sources` — which sources were active this run. Respects `--no-arxiv`,
  `--no-inspire` CLI flags; a source missing here means it was skipped.
- `counts.inspirehep` / `counts.arxiv` / `counts.manual` / `counts.orcid`
  — raw publication count per source **before** cross-source dedup.
- `counts.deduped` — number of entries removed in the DOI cross-source
  dedup pass (second pass). In the example above, 36 papers that appeared
  in both InspireHEP and ORCID (or ORCID and arXiv) were collapsed into
  the higher-priority source's version. `orcid` and `deduped` are
  **required** schema fields (decision 16-01).
- `warnings` — non-fatal per-member messages (empty ORCID profile, arXiv
  ORCID not registered, etc.). The sync completes normally regardless.

### Example full entry

Paste-ready `people.json` snippet showing where `inspirehep_id` + `orcid_id`
live alongside the rest of a person entry. Based on the real
`diana-lopez-nacir` record; long prose fields elided as `"..."`:

```json
{
  "slug": "diana-lopez-nacir",
  "name": "Diana Lopez Nacir",
  "role": { "es": "Investigadora Principal", "en": "Principal Investigator" },
  "category": "pi",
  "photo": "people/Diana_LN.png",
  "short_bio": { "es": "...", "en": "..." },
  "full_bio": { "es": "...", "en": "..." },
  "research_interests": [ { "es": "...", "en": "..." } ],
  "inspirehep_id": "D.Lopez.Nacir.1",
  "orcid_id": "0000-0003-4398-1147",
  "display_name_normalized": "diana lopez nacir",
  "contact": { "email": "diana.lopezn@df.uba.ar", "orcid": "0000-0003-4398-1147" },
  "social_links": []
}
```

Both `inspirehep_id` and `orcid_id` are optional — leave either out if the
person doesn't have one. Both together gives the richest sync coverage
(InspireHEP for peer-reviewed, arXiv for preprints).

---

## Operational Troubleshooting

Day-to-day operator guide for the daily publication sync. Complements the
ID-lookup sections above.

### Running a manual sync (`workflow_dispatch`)

When to use: you just added a new member's `inspirehep_id` / `orcid_id` and
don't want to wait until the next 06:00 UTC run; or you're testing a sync
script change on `main`.

Steps:

1. Go to the repo's **Actions** tab on GitHub.
2. In the left sidebar, click **"Sync Publications"** (or navigate directly
   to `https://github.com/<owner>/<repo>/actions/workflows/sync-publications.yml`).
3. Click the grey **"Run workflow"** dropdown (top-right of the runs list).
4. Confirm the branch is `main`, then click the green **"Run workflow"**
   button.
5. The run starts within ~15 seconds. Click it to follow step-by-step
   progress.

The `workflow_dispatch` trigger is declared in
`.github/workflows/sync-publications.yml` alongside the daily
`schedule: cron: "0 6 * * *"` (06:00 UTC every day).

### Reading the step summary

After a run completes, the **"Summary"** tab at the top of the run page
shows a delta block. Expected shapes:

- **First run after adding a new member:** `X added, 0 removed, Y unchanged`
  where `X` is the number of new papers pulled from InspireHEP + arXiv for
  that member.
- **Steady-state daily run:** `0 added, 0 removed, Z unchanged` → the
  workflow's `jq -cS '.publications'` payload diff against `HEAD` detects
  no change, skips the commit, and the step summary notes
  **"No changes — skipping commit"** (CI-05 + CI-07).
- **New papers published since the last run:** `N added, 0 removed, Z unchanged` →
  commit lands with message `chore(content): sync publications [skip ci]`
  (the `[skip ci]` prefix prevents the push from re-triggering the workflow
  — CI-06).

Warnings (non-fatal) appear in the step summary's warnings block:

- Missing `orcid_id` for a member → `skipping arXiv for [name]: no orcid_id`
  (SYNC-05). Member still gets InspireHEP coverage if `inspirehep_id` is
  present.
- 429 rate-limit retry → logged to stderr with exponential-backoff timing
  (SYNC-03). Transient; the script recovers automatically.

### When the cron fails

If a scheduled run didn't commit and Vercel didn't redeploy, GitHub Actions
notifies the repo owner by email (default setting). Investigate in this
order:

1. Go to the failed run in the Actions tab. Open the failing step's log.
2. Common failure modes:
   - **Startup BAI-format error (`SYNC-06`):** someone added a malformed
     `inspirehep_id` to `people.json` (e.g. `INSPIRE-00...` numeric form
     instead of BAI). Fix the ID in `people.json`, push, re-run.
   - **InspireHEP 429 after 3 retries (`SYNC-03`):** upstream temporarily
     overloaded. Wait an hour, re-run via `workflow_dispatch`. The script's
     `AbortSignal.timeout(10_000)` + exponential backoff handles transient
     429s automatically; hitting the retry ceiling means real upstream
     pressure.
   - **arXiv Atom parse error (`SYNC-02`):** rare. `fast-xml-parser` hit an
     unexpected Atom entry shape. Capture the failing ORCID, open an issue
     pointing at `scripts/sync-publications.ts`'s `arxivEntryToPublication`
     function, and skip that member via `--member <slug>` omission until
     the parser is patched.
   - **`pnpm validate-content` gate fail (`CI-04`):** the sync wrote a JSON
     that doesn't pass `PublicationsSchema.safeParse`. This should be
     impossible because SYNC-11 runs the same validation in-memory before
     writing — if it happens, it's a schema-mismatch bug. Escalate.
3. Reruns via `workflow_dispatch` are **idempotent**: the script preserves
   the last-good JSON on any failure (SYNC-14), so retrying never corrupts
   the file.

### Running a dry-run locally

Before pushing new IDs to `main`, preview the sync output without
committing:

```bash
pnpm sync-publications --dry-run --member <slug>
```

Output goes to `scripts/tmp/sync-<slug>.json` — the real
`content/publications.json` is **not** touched. This is the safest way to
validate a new member's BAI / ORCID before merging.

CLI flags supported by `scripts/sync-publications.ts` (09-01 decision):

- `--dry-run` — write to `scripts/tmp/` instead of `content/`
- `--member <slug>` — restrict sync to a single person
- `--no-arxiv` — skip the arXiv source entirely
- `--no-inspire` — skip the InspireHEP source entirely
- `--verbose` — log per-fetch URLs and retry timings

### ORCID-specific troubleshooting

| Symptom | Root cause | Script behavior | Fix |
|---------|------------|-----------------|-----|
| `Warning: ORCID profile not public or empty: {id}` appears in the warnings block | HTTP 404 from `pub.orcid.org` — the `orcid_id` value is invalid or the profile was deleted | `fetchOrcid` returns `[]` (line ~368–370); sync continues without that member's ORCID papers | Verify the ID resolves at `https://orcid.org/{id}`. Correct the value in `people.json`. |
| No warning, but `counts.orcid` stays 0 for a specific member across multiple runs | HTTP 200 with empty `group: []` — the ORCID profile exists but is set to private, or the member has added no works (Pitfall 7, line ~357) | Silent — no warning emitted | Member must log in to orcid.org and set their works visibility to "Everyone", or manually add their papers to their ORCID profile. |
| Papers visible on orcid.org profile but absent from `publications.json` | Work type is not `journal-article` or `conference-paper` (datasets, software, preprints, book chapters, posters, talks) | `orcidGroupToPublication` returns `null` (line ~536); item silently dropped | Expected behaviour — `/publications` is peer-reviewed outputs only. If the paper is a journal article, check that ORCID has the correct work type set on the entry. |
| Paper appears in `publications.json` but the author list is only the profile owner's name | HTTP 404 on `/work/{putCode}` during per-work enrichment — the profile changed between the works-list fetch and the detail fetch | Placeholder author list (owner name only) preserved; paper still included (decision 17-03, line ~403) | Non-fatal. Re-run via `workflow_dispatch` to retry enrichment. Usually resolves on the next weekly cron. |
| `ORCID {statusCode} for {orcid}` error appears in the run log | Non-404, non-200 response from the ORCID API (502, 503, 429) | `fetchWithRetry` applies exponential backoff for 503 and 429 responses (decision 17-01); if retries are exhausted the error bubbles up and the run fails | Transient: wait a few minutes and re-run via `workflow_dispatch`. Persistent 429 means ORCID rate-limit; wait an hour before retrying. |
