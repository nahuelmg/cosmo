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
