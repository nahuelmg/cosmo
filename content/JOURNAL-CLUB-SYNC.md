# Journal Club sync

`content/journal-club.json` is **generated** from a public Google Sheet by
`scripts/sync-journal-club.ts`. Do not hand-edit the JSON — edit the sheet.

## The sheet

- Sheet ID `1DOgFAP-e_aqOvQzkT5js0dVySqL6EHEyLApjMniQX3M`
  (hard-coded default in `scripts/sync-journal-club.ts`; override with the
  `JOURNAL_CLUB_SHEET_CSV_URL` env var / repo variable to point at a different one).
- It must be readable without login. The script reads the CSV export:
  `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv`.

### Columns (header row 1, order-independent, accent/case-insensitive)

| Column      | Maps to            | Required | Notes |
|-------------|--------------------|----------|-------|
| `Fecha`     | `date`             | ✅       | `AAAA-MM-DD` |
| `Speaker`   | `speaker`          | ✅       | Name as it should appear (titles OK) |
| `Posición`  | `speaker_position` |          | e.g. "Profesora", "Investigador" |
| `Afiliación`| `affiliation`      |          | Institution |
| `Título`    | `title`            | ✅       | Paper title |
| `Resumen`   | `abstract`         |          | Shown behind a "Resumen / Abstract" toggle |
| `Link`      | `paper_link`       |          | Must start with `http(s)://` or it is dropped |
| `Notas`     | `notes`            |          | Short group commentary, shown inline |

Empty rows are skipped. Rows missing `Fecha`, `Speaker` or `Título` are skipped
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
run fails and the committed JSON is left untouched.

Run locally: `pnpm sync-journal-club` (add `--dry-run` to print without writing).
