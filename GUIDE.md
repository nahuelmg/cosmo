# Static website maintenance

## Where to make changes

- **Page markup:** edit the HTML/Jinja templates in `templates/`. Shared markup lives in `base.html` and `macros.html`; `page.html` selects the page body. Jinja automatically escapes content. Do not use `safe` on feed text.
- **Design:** edit `assets/css/site.css`. Fonts are self-hosted under `assets/fonts/`, with their licenses. SVG icons live under `assets/icons/`; their upstream license is included.
- **Browser behavior:** edit `assets/js/site.js`; the small `theme.js` runs before paint and preserves the existing theme cookie.
- **Institutional information:** edit `content/site.json`. Resource links and bilingual descriptions live in `content/resources.json`.
- **UI labels:** edit both `messages/es.json` and `messages/en.json`. Content translations are separate from UI labels.
- **Routes:** the Spanish/English mapping is in `tools/build.py`. Every non-past member receives a profile in both languages. Outreach remains available by URL but hidden from navigation, matching the previous website.

Run `python -m tools.build` after editing. A failed build leaves the previous `dist/` intact. The generator validates data and local links in a staging directory before replacing the previous output. If interrupted during the final directory swap, recover `dist.previous/` before building again.

## Content ownership

### People

The published Google Sheet supplies names, categories, roles, teaching positions, email, office, biography, and interests. `content/people-extra.json` supplies photos, identifiers, social accounts, and curated bilingual enrichment, keyed by stable slug. Sheet email/office win when present. Blank biography/interest cells omit those sections; curated placeholders are not inserted.

Run `python -m tools.sync people --dry-run` before applying a changed sheet layout. Aliases and role translations are in `tools/sync_tables.json`. Update them when introducing new spellings or roles. Validate image paths relative to `public/`.

### Journal club

`python -m tools.sync journal-club` reads the published sheet. Dates accept ISO or US month/day/year input. Times normalize to 24-hour notation. Session status is calculated against the current UTC date during synchronization. August starts each academic season. The daily job moves sessions into the archive as dates pass; an old uploaded build remains a snapshot until replaced.

Headers accept the existing English Google Form and legacy Spanish names. An empty valid sheet produces an empty archive; malformed headers fail without replacing content. Invalid rows generate warnings, preserving the prior importer's behavior. Review workflow logs when sheet columns change.

### Research

`python -m tools.sync research` reads the public Google Doc. Each area has a title followed by `Mini resumen:` and `Explicación:` blocks. Existing IDs, icons and images are retained. Unchanged Spanish retains English translations; changed Spanish is mirrored into English with a warning until translated. Blank blocks retain existing text; incomplete new areas or an empty document fail.

### Publications

`python -m tools.sync publications` fetches InspireHEP BAI queries, arXiv ORCID feeds, and public ORCID works. Manual records in `content/publications.json` are retained. Deduplication uses arXiv ID first, then normalized DOI, with priority **manual → InspireHEP → ORCID → arXiv**. ORCID-only survivors receive contributor details. Requests have timeouts/retries and at most five concurrent workers with pauses between batches. A failed required request aborts the write.

Use `--member SLUG --dry-run` to check one member. Without `--dry-run`, member-only output goes to `tools/tmp/sync-SLUG.json`. Disabling a source creates a result from the remaining enabled sources, as in the original importer; use `--dry-run` when diagnosing a temporary provider issue.

### Translations and schemas

`content/translations.en.json` maps exact source text to English. It is never overwritten by sync. Explicit bilingual translations take precedence; unmatched new text remains in its original language. Publication titles and author names remain canonical.

JSON Schemas in `content/*.schema.json` are now maintained directly. They are used both by editors and Python validation. Additional checks in `tools/content.py` enforce unique identifiers, prose rules, photo existence and journal-club consistency. No schema code generation is required.

## Configuration and publishing

Environment variables are optional: `SITE_URL`, `PEOPLE_SHEET_CSV_URL`, `JOURNAL_CLUB_SHEET_CSV_URL`, `RESEARCH_DOC_TXT_URL`. Export them in your shell, or set GitHub repository variables of the same names. `.env.example` documents them; Python does not automatically load `.env` files.

Run the checks described in README, generate `dist/`, and upload its contents to a static host at the domain root. Configure directory indexes and the supplied 404 document. Deploy the entire artifact together so content, links and assets stay consistent. Keep the previous host release to roll back if necessary.

The scheduled workflows generate downloadable artifacts, not a live deployment. No host credentials or publishing integration are assumed. Synchronization warnings and failures appear in the GitHub Actions logs; failed jobs do not push content or upload a new website artifact.
