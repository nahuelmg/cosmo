# People sync (hybrid)

`content/people.json` is **generated** by `scripts/sync-people.ts`. Do not
hand-edit it. There are two inputs:

1. **The Google Sheet** — the roster: who is in the group, which section they
   are in, and their Spanish research / teaching roles.
2. **`content/people-extra.json`** — everything the sheet can't hold, keyed by
   person `slug`: ORCID / InspireHEP ids, photo path, contact block, social
   links, bilingual bios, research interests, curated bilingual affiliations,
   and role fallbacks for collaborators. Hand-edited, committed.

The sync fetches the sheet, matches each name to a `slug`, merges the
enrichment, translates roles to English, validates against `PeopleSchema`, and
writes `content/people.json`.

## The sheet

- ID `1SMJ3gXrW-KJi-bFUXkCHZRimL4mpuqcil77iRQq0EoQ` (default in the script;
  override with `PEOPLE_SHEET_CSV_URL`). Must be readable without login.
- One tab, with **section headers as rows**:

| Section header (row)                    | Category | Row shape |
|-----------------------------------------|----------|-----------|
| `Investigadores`                        | `pi`     | `Nombre \| Cargo en investigación \| Cargo docente` |
| `Postdocs / docs / lics`                | from "Cargo en investigación": Posdoc→`postdoc`, Doctorando→`phd`, Licenciando→`undergrad` | same 3 columns |
| `Miembros Anteriores:`                  | `past`   | `Nombre (estudiante de licenciatura 2026)` |
| `Colaboradores externos y visitantes:`  | `visitors` | `Nombre` or `Nombre (Afiliación)` |

- The Spanish research role is taken verbatim from the sheet; the English side
  comes from a lookup table in the script (unknown values fall back to Spanish
  with a warning). Same for teaching roles (`Ay 1era` → "Ayudante de primera" /
  "First-rank Teaching Assistant", etc.).
- Name → slug uses `slugify`, plus an alias table in the script for known
  mismatches (`Tomas Chase` → `tomas-ferreira-chase`, `Javi Pineau` →
  `javier-pineau`, and a few accent fixes).

## Adding a person

1. Add the row to the sheet.
2. If they have an ORCID / InspireHEP id, a photo, or a real bio, add an entry
   under their slug in `content/people-extra.json` (see the schema for the
   shape). Without it they render with a placeholder bio and no profile links —
   which is fine for visitors.
3. Photos go in `public/people/` and are referenced as `people/<file>` from the
   enrichment entry.

## When it runs

`.github/workflows/sync-people.yml` — daily 08:00 UTC + **Actions ▸ "Sync
People" ▸ Run workflow**. Changed `people.json` is committed `[skip ci]` and
Vercel redeploys. A missing sheet or a validation failure fails the run and
leaves the committed file untouched.

Run locally: `pnpm sync-people` (`--dry-run` to preview).
