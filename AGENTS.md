# Cosmo — website and agent maintenance guide

This is the single repository guide for agents and maintainers. The committed HTML is the permanent website source. Do not reintroduce React, Next.js, TypeScript, Tailwind, Node dependencies, or full-page generation. Preserve the bilingual content, existing design, automatic synchronization and production address.

## Edit and preview

- `es/` and `en/`: editable pages, including individual profiles.
- `index.html` and `404.html`: root redirect and error page.
- `assets/`: CSS, JavaScript, fonts and icons.
- `people/`, `Portadas/`, `logo_cosmo.png`, `favicon.ico`: images.

Preview directly from the repository using Python 3.11+ (no packages required):

```bash
python -m tools.preview
```

Open http://127.0.0.1:8000/cosmo/. No build is needed to see HTML edits. Internal navigation and assets use document-relative URLs, so the same files also work at the server root or under another folder:

```bash
python -m tools.preview --base-path /
python -m tools.preview --base-path /demo/site/
```

For a standard server at http://127.0.0.1:8000/, use `python -m http.server 8000`. Serve the repository or the contents of `dist/` with directory indexes and trailing-slash redirects. Direct `file://` browsing is not supported.

Automatic content is enclosed by `<!-- AUTO:name:START -->` and `<!-- AUTO:name:END -->` comments. Edit outside these regions freely. Changes inside them are replaced by the next relevant sync; use the source data or automation fragments for those changes. See Content ownership below.

## Automatic updates and GitHub sync

GitHub synchronization remains enabled through the workflow definitions. The daily UTC schedules remain publications at 00:00, journal club at 00:15 and people at 00:30. Research updates remain manual. Each successful sync commits JSON and the affected HTML together. It validates a staged copy before writing and retries from fresh `main` if another push arrives during the run.

Python dependencies are needed only for automation, validation and packaging. Local sync uses POSIX file locking (Linux/macOS or WSL):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m tools.sync people --dry-run
python -m tools.sync people
python -m tools.sync publications
python -m tools.sync journal-club
python -m tools.sync research
```

A dry run validates staged changes without changing website or content files. A local lock file may be created. To render existing JSON without fetching, run `python -m tools.update_html people` (or `publications`, `journal-club`, `research`). Member-specific publication imports write only to `tools/tmp/`.

## Package and deploy

```bash
python -m tools.content
python -m unittest discover -s tests -v
python -m tools.build
python -m tools.check dist
```

`tools.build` only packages committed website files into ignored `dist/`; it never regenerates source HTML. Tools, data, tests and documentation are excluded. Failed validation preserves the previous package. `--preview` adds noindex metadata only to the packaged copy.

Pushes to `main` run the Pages workflow, including tests and browser checks, before deployment. Pull requests do not deploy. Successful scheduled syncs trigger Pages through `workflow_run`, since bot commits do not trigger push workflows. Keep the workflow name **Sync content and generate HTML** for that connection.

The production address remains `https://nahuelmg.github.io/cosmo/`. Hosting the same files at another HTTP path needs no link changes. Canonical/alternate links, social metadata, structured data, sitemap and robots retain the production URL. To change the canonical production address, update that metadata, `content/site.json`, `build-info.json`, new-profile scaffolds and workflow URL settings together. `--site-url` and `SITE_URL` assert the production URL; they do not control the preview mount path or rewrite pages.

The self-contained 404 page links to the absolute production homepages. An error document can be served at any missing URL depth, where document-relative homepage links would be unreliable. Configure your host to serve `404.html` with status 404; Python's standard HTTP server uses its own error document.

Optional browser checks:

```bash
pip install -r requirements-dev.txt
python -m playwright install chromium
CHROME_PATH=chromium python tests/browser_check.py
```

With system Chrome installed, omit `CHROME_PATH`. Tests cover both languages, desktop/tablet/mobile layouts, navigation, filters, themes, keyboard behavior, profiles, maps and reading without JavaScript.

Do not commit `dist/`, local environments or test artifacts.

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

Run the checks above, package `dist/`, and upload its contents at `/`, `/cosmo/`, or another folder. Navigation and assets are document-relative; keep these URLs relative to the containing page, including in new-profile scaffolds. `SITE_URL` asserts the canonical production URL; it does not select a mount path or rewrite HTML. Configure directory indexes, trailing-slash redirects and the supplied 404 document (whose homepage links intentionally point to production). Deploy the entire artifact together so content, links and assets stay consistent. Keep the previous host release to roll back if necessary.

The Pages workflow publishes `dist/` after a push to `main` or successful completion of the content-sync workflow. It uses GitHub’s built-in Pages token and retains the existing `/cosmo/` address. Local preview uses `python -m tools.preview` for the production prefix; `--base-path /` or `--base-path /demo/site/` tests another mount without changing configuration or committed files. Synchronization warnings and failures appear in the GitHub Actions logs; failed jobs do not push content or upload a new website artifact.

## Maintenance details

Preserve the warm academic design, light/dark themes, responsive layouts, keyboard focus, reduced-motion behavior and navigation without JavaScript. The current CSS and HTML are the design reference. Keep font and icon license files with their assets. Icons can be selected dynamically by content or embedded by the renderer; absence of an HTML file URL does not make an icon unused.

For a new person, add their row to the public sheet and enrichment under their stable slug in `content/people-extra.json`; store photos in `people/`. Use an InspireHEP BAI (for example `E.Calzetta.1`), not a numeric record ID. `orcid_id` drives imports and `contact.orcid` supplies the profile link; keep both consistent. `display_name_normalized` is the lowercase name with Unicode combining marks removed and supports publication matching. Consult the JSON schemas for field shapes.

The people sheet uses section rows for investigators, students/postdocs, former members and visitors. Research staff columns include `Nombre`, `Cargo en investigación`, `Cargo docente`, `EMAIL`, `Oficina`, `Mini Biografía` and `Líneas de investigación`. Use the current importer and `tools/sync_tables.json` as the authoritative column/alias mapping; dry-run changes before applying them.

Journal-club form columns include `Date of the journal`, `Complete name`, `Academic position`, `Affiliation`, `Hour`, `Place/room`, `Title of the journal`, `Abstract` and `Links`. Date, speaker and title are required per row; the submission timestamp is ignored. Session IDs derive from date and speaker with collision suffixes.

To run a sync on demand, open GitHub Actions → **Sync content and generate HTML** → **Run workflow**, choose a source, and inspect its logs. For publication diagnostics use `--member SLUG --dry-run`, `--verbose`, or source switches `--no-inspire`, `--no-arxiv`, `--no-orcid`. A dry run never writes member output; a member run without that flag writes only `tools/tmp/`. Review `_meta` in publications for source counts and warnings. Private/empty ORCID works and unsupported work types can explain missing records; verify IDs and public visibility before changing imports. Required request failures leave the previous content intact; investigate logs and retry transient provider failures.

`setup.sh` creates `.venv`, installs automation dependencies and packages the site. `requirements-dev.txt` additionally installs browser testing. The editor schema mappings in `.vscode/settings.json` help validate JSON while editing. Keep currently loaded content JSON, translation dictionaries, schemas, fixtures and profile history even when they are not directly served to browsers.

Historical framework planning, generic agent templates and migration-only tools have been removed. Git history retains them. Do not commit generated packages, caches, local environments, screenshots or ZIP exports.
