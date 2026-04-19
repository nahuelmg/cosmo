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
5. Paste into `people.json`:

   ```json
   "orcid_id": "0000-0002-1234-5678"
   ```

Schema validation: `/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/` (same helper as
the shared `orcidId`).

Students without ORCID: leave the field out. Register when you
publish your first paper.

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

| Field                      | Required | Shape                                     |
|----------------------------|----------|-------------------------------------------|
| `inspirehep_id`            | optional | BAI (e.g. `E.Calzetta.1`, `S.J.Landau.1`)|
| `orcid_id`                 | optional | 16-digit ORCID (e.g. `0000-0002-1234-5678`) |
| `display_name_normalized`  | required | ASCII-fold + lowercase of `name`          |

Definitive source: `src/content/schemas/people.schema.ts`. VS Code hover on
each field will show the `@see content/SYNC.md` pointer back to this file.

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
  "publications_selected": [],
  "inspirehep_id": "D.Lopez.Nacir.1",
  "orcid_id": "0000-0003-4398-1147",
  "display_name_normalized": "diana lopez nacir",
  "contact": { "email": "diana.lopezn@df.uba.ar" },
  "social_links": []
}
```

Both `inspirehep_id` and `orcid_id` are optional — leave either out if the
person doesn't have one. Both together gives the richest sync coverage
(InspireHEP for peer-reviewed, arXiv for preprints).

---

## Operational Troubleshooting

Day-to-day operator guide for the weekly publication sync. Complements the
ID-lookup sections above.

### Running a manual sync (`workflow_dispatch`)

When to use: you just added a new member's `inspirehep_id` / `orcid_id` and
don't want to wait until next Monday 06:00 UTC; or you're testing a sync
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
`.github/workflows/sync-publications.yml` alongside the weekly
`schedule: cron: "0 6 * * 1"` (Monday 06:00 UTC).

### Reading the step summary

After a run completes, the **"Summary"** tab at the top of the run page
shows a delta block. Expected shapes:

- **First run after adding a new member:** `X added, 0 removed, Y unchanged`
  where `X` is the number of new papers pulled from InspireHEP + arXiv for
  that member.
- **Steady-state weekly run:** `0 added, 0 removed, Z unchanged` → the
  workflow's `jq -cS '.publications'` payload diff against `HEAD` detects
  no change, skips the commit, and the step summary notes
  **"No changes — skipping commit"** (CI-05 + CI-07).
- **New papers published that week:** `N added, 0 removed, Z unchanged` →
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

If the Monday run didn't commit and Vercel didn't redeploy, GitHub Actions
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
