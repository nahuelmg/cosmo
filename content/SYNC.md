# content/SYNC.md — Maintainer Lookup Guide

How to populate the three per-person fields that drive the v1.1 arXiv + InspireHEP sync:
`inspirehep_id`, `arxiv_id`, and `display_name_normalized`.

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

Schema validation: `/^[A-Z]\.[A-Za-z-]+\.\d+$/` (initial, dot, surname, dot, digit).

---

## Finding Your arXiv Author ID

arXiv uses a "claimed author ID" — an opaque string you set once in your
arXiv account that lets the API group your papers.

1. Log in to <https://arxiv.org/user>.
2. Click "Change user information" → scroll to "Author identifier".
3. Copy the value (it looks like `calzetta_e_1` or similar — format is
   opaque, arXiv-assigned).
4. If you have never claimed any papers: click "My Articles" on arxiv.org
   and claim each of your submissions. This wires papers to the ID.
5. Paste into `people.json`:

   ```json
   "arxiv_id": "calzetta_e_1"
   ```

Schema validation: `/^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/` — same helper
as the publication-level `arxiv` field. Modern and pre-2007 formats both pass.

Students without a claimed arXiv ID: leave the field out. Populate it the
first time you put a paper on arXiv and claim authorship.

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
| `inspirehep_id`            | optional | BAI (e.g. `E.Calzetta.1`)                 |
| `arxiv_id`                 | optional | claimed arXiv author ID                   |
| `display_name_normalized`  | required | ASCII-fold + lowercase of `name`          |

Definitive source: `src/content/schemas/people.schema.ts`. VS Code hover on
each field will show the `@see content/SYNC.md` pointer back to this file.
