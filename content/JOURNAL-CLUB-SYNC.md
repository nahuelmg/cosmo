# Journal Club sync

`content/journal-club.json` is **generated** from a public Google Sheet by
`scripts/sync-journal-club.ts`. Do not hand-edit the JSON — edit the sheet.

## The sheet

- Sheet ID `1fBfnMGPPQ_dgz-hdYmJDyuntg1rqRT2YiJADTo92vfA`
  (hard-coded default in `scripts/sync-journal-club.ts`; override with the
  `JOURNAL_CLUB_SHEET_CSV_URL` env var / repo variable to point at a different one).
- It is the response sheet of a Google Form, so the columns are the form
  questions and there is a leading `Timestamp` column (the form submission time —
  **ignored**, it is not the date of the talk).
- It must be readable without login. The script reads the CSV export:
  `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv`.

### Columns (header row 1, order-independent, accent/case-insensitive)

| Column                 | Maps to            | Required | Notes |
|------------------------|--------------------|----------|-------|
| `Date of the journal`  | `date`             | ✅       | `AAAA-MM-DD` or `M/D/AAAA`; normalized to ISO |
| `Complete name`        | `speaker`          | ✅       | Name as it should appear (titles OK) |
| `Academic position`    | `speaker_position` |          | e.g. "Profesora", "Investigador" |
| `Affiliation`          | `affiliation`      |          | Institution |
| `Hour`                 | `start_time`       |          | `HH:MM` 24-hour; anything else is dropped with a warning |
| `Place/room`           | `location`         |          | e.g. "Aula Federman" |
| `Title of the journal` | `title`            | ✅       | Paper title |
| `Abstract`             | `abstract`         |          | Shown behind a "Resumen / Abstract" toggle |
| `Links`                | `paper_link`       |          | Must start with `http(s)://` or it is dropped |

The older Spanish headers (`Fecha`, `Speaker`, `Posición`, `Afiliación`,
`Título`, `Resumen`, `Link`, `Notas`) are still accepted, so a legacy sheet
keeps working.

Empty rows are skipped. Rows missing the date, speaker or title are skipped
with a warning.

### Derived automatically (not in the sheet)

- `id` = `<date>-<speaker-slug>` (a numeric suffix is added on collision)
- `status` = `upcoming` when the date is today or later (UTC), else `past`
- `academic_year` = `YYYY-YYYY` season for past sessions. The season flips on
  1 August, so Sep 2024 and Apr 2025 are both `2024-2025`.

## When it runs

`.github/workflows/sync-journal-club.yml` — daily at 07:00 UTC, plus
**Actions ▸ "Sync Journal Club" ▸ Run workflow** for an on-demand sync.
If `content/journal-club.json` changed it is committed with `[skip ci]` and
Vercel redeploys. If the sheet can't be fetched or a row fails validation the
run fails and the committed JSON is left untouched. If the sheet has **no valid
rows at all** the run also fails without writing, so the last good archive stays
live.

Run locally: `pnpm sync-journal-club` (add `--dry-run` to print without writing).
