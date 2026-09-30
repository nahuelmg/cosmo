# Buenos Aires Cosmología — static website

Bilingual institutional website for the Cosmology Group at FCEN / UBA / IFIBA / CONICET. The website is **plain HTML, CSS, and JavaScript**. There is no Node.js, React, Next.js, bundler, database, or application server requirement.

Python generates complete HTML pages from shared templates and the existing JSON content. Python is only needed when updating the site; upload the contents of `dist/` to any static host.

## Build and preview

Requires Python 3.11 or newer.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m tools.build
python -m http.server 8000 --directory dist
```

Open <http://localhost:8000>. Stop the preview with Ctrl+C. On Windows, activate with `.venv\Scripts\activate`.

The generated site has Spanish and English pages, individual profiles, publication search/member filters, a carousel, theme switching, mobile navigation, research sections, journal-club archives, resources, outreach, and contact details. Content remains available without JavaScript. Fonts and images are served locally; the optional map uses Google Maps.

## Editing

| Source | Purpose |
| --- | --- |
| `templates/` | HTML page templates, shared header/footer and content components |
| `assets/css/site.css` | Ordinary CSS and design tokens |
| `assets/js/` | Browser interactions and theme initialization |
| `public/` | Images and favicon; copied to the output root |
| `content/` | Content, JSON Schemas, site configuration, and resource links |
| `messages/es.json`, `messages/en.json` | Interface translations |
| `tools/` | Python generation, validation, and synchronization |

Edit templates or source content, then run `python -m tools.build` again. `dist/` is generated and git-ignored: direct HTML edits there will be overwritten. Assets and pages use root-relative URLs, so preview through HTTP rather than double-clicking files.

People and journal-club records are generated from Google Sheets. Research Spanish text comes from a Google Doc. Preserve manual enrichment in `content/people-extra.json` and translations in `content/translations.en.json`; see [maintenance guide](GUIDE.md).

## Automatic and manual content updates

```bash
python -m tools.sync people --dry-run
python -m tools.sync people
python -m tools.sync journal-club
python -m tools.sync publications
python -m tools.sync research
python -m tools.build
```

Every importer supports `--dry-run` and `--verbose`. Publications also supports `--member SLUG`, `--no-inspire`, `--no-arxiv`, and `--no-orcid`. Member-specific output goes to `tools/tmp/` and never overwrites the shared archive. A dry run writes no files.

GitHub Actions preserves the daily UTC schedules: publications at 00:00, journal club at 00:15, and people at 00:30. Research is manual. Each sync validates and builds before committing changed content, then uploads the complete website as an artifact. Generation runs in that workflow because bot commits do not trigger another push workflow. The host is not updated automatically; download and upload the artifact, or connect a hosting-specific deployment step later.

## Deploy

```bash
python -m tools.build --site-url https://your-domain.example
```

Upload **the contents of `dist/`** to the domain's document root. Choose a host that serves directory `index.html` files and configure `404.html` as its error document if supported. Existing paths such as `/es/personas` resolve through the host's directory redirect to `/es/personas/`. No SPA rewrite or framework routing is needed.

Set `SITE_URL` in the environment, pass `--site-url`, or update `content/site.json` to control canonical URLs and the sitemap. The command-line flag takes precedence. The checked-in default remains `https://cosmo.vercel.app`; set your real domain before publishing. For GitHub workflows, set the repository variable `SITE_URL`.

`python -m tools.build --preview` generates noindex metadata and blocks crawlers in `robots.txt`. Normal builds allow indexing. Subdirectory hosting is not configured.

## Checks

```bash
python -m tools.content
python -m unittest discover -s tests -v
python -m tools.build
python -m tools.check dist
```

Optional browser checks:

```bash
pip install -r requirements-dev.txt
python -m playwright install chromium
CHROME_PATH=chromium python tests/browser_check.py
```

The browser checks use a temporary local server and cover both languages, desktop/tablet/mobile layouts, filtering, theme persistence, locale switching, menu keyboard focus, carousel controls, disclosures, email links, deferred maps, and reading without JavaScript. With system Chrome installed, omit `CHROME_PATH`. Screenshots are saved in `test-results/`.

The `.planning/`, `references/`, and `skills/` directories retain historical project material. Older Next.js/TypeScript commands there describe the previous implementation; this README and the maintenance guide describe the current project.
