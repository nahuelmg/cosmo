# Static website maintenance

## Where to make changes

Edit `es/**/index.html` and `en/**/index.html` directly. Home, contact, outreach and resources are maintained entirely as HTML. Their older JSON records are retained as historical inputs, not page generators. Edit both languages when changing shared information. Header/footer edits must be applied to the relevant pages and `tools/templates/new-profile-*.html` for future profiles.

CSS lives in `assets/css/site.css`; browser behavior lives in `assets/js/`. Images live directly under `people/` and `Portadas/`. Preview with `python -m tools.preview`; refresh to see changes immediately.

Only content between `AUTO` markers is generated. Keep each marker pair intact and unique. Missing, duplicate or nested markers abort an update. `tools/templates/` contains automation fragments and scaffolds for new profiles, not a full-site templating system. Feed text is escaped by Jinja; do not mark it safe.

`messages/` and `content/translations.en.json` affect automatic fragments. Static labels elsewhere must be edited directly in HTML. After editing JSON, translations or fragments, run `python -m tools.update_html SOURCE` for each affected source. Packaging does not run these updates implicitly.

Sync stages data and HTML, checks links, detects concurrent local edits, and applies validated changes with rollback on write errors. Avoid editing while a local sync is applying changes. GitHub commits the completed data/HTML update together; it never publishes an intermediate copy. The CI driver uses disposable checkouts, retries concurrent pushes and never force-pushes.

`python -m tools.build` copies an explicit website allowlist to `dist/`. Failed checks leave the previous package intact. If interrupted during the final directory swap, recover `dist.previous/` before packaging again.

## Content ownership

### People

The published Google Sheet supplies names, categories, roles, teaching positions, email, office, biography, and interests. `content/people-extra.json` supplies photos, identifiers, social accounts, and curated bilingual enrichment, keyed by stable slug. Sheet email/office win when present. Blank biography/interest cells omit those sections; curated placeholders are not inserted.

Run `python -m tools.sync people --dry-run` before applying a changed sheet layout. Aliases and role translations are in `tools/sync_tables.json`. Update them when introducing new spellings or roles. Validate image paths relative to the repository root.

Profiles are created in both languages from small HTML scaffolds. `content/profile-history.json` retains member records when they leave the current roster. Their existing pages remain available, marked as former members, with manual content and historical publication links preserved. Do not delete this registry during sync. People updates also refresh publication filter choices and profile metadata. Publication updates refresh the main list, article metadata and each retained profile’s publication list.

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

Run the checks described in README, package `dist/`, and upload its contents at the committed `/cosmo/` prefix. `SITE_URL` asserts that URL; it does not rewrite HTML. Configure directory indexes and the supplied 404 document. Deploy the entire artifact together so content, links and assets stay consistent. Keep the previous host release to roll back if necessary.

The Pages workflow publishes `dist/` after a push to `main` or successful completion of the content-sync workflow. It uses GitHub’s built-in Pages token and retains the existing `/cosmo/` address. Local preview uses `python -m tools.preview` so the same prefix is tested. Synchronization warnings and failures appear in the GitHub Actions logs; failed jobs do not push content or upload a new website artifact.
