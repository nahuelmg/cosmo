# Cosmo — plain HTML website

The user explicitly chose to replace the Next.js authoring system with plain HTML templates, CSS and vanilla browser JavaScript. Python performs offline generation and content synchronization. Do not reintroduce React, Next.js, TypeScript, Tailwind or Node package/build dependencies.

## Current architecture

- Read README.md and GUIDE.md for commands and content ownership.
- Edit `templates/` for HTML, `assets/css/` for CSS and `assets/js/` for browser interactions. Preserve the existing design, accessibility, bilingual content and translated URLs.
- `content/` contains existing JSON sources, JSON Schemas, curated English translations, site settings and resource links. `messages/` contains UI translations.
- `tools/build.py` generates full HTML pages, metadata, sitemap, root redirect and 404 document. `dist/` is generated and ignored.
- `tools/sync.py` and its helpers import people, publications, journal-club and research content. Keep the source identifiers, curated enrichment and failure safeguards.
- Existing member updates and Juan Pablo Elia’s portrait from the previous main branch are preserved.
- `.planning/`, `references/` and older skill material are historical. Their framework-specific advice does not override the current Python/static architecture.

## GitHub Pages

Live address: https://nahuelmg.github.io/cosmo/. The site is a GitHub project Pages site, so `/cosmo/` must appear in browser-facing paths.

`content/site.json` defaults to `https://nahuelmg.github.io/cosmo`. The generator derives the prefix from this full URL (overridden by `SITE_URL` or `--site-url`). Templates use `route(...)` for prefixed navigation and `asset(...)` for assets; absolute metadata uses the full site URL plus unprefixed route paths. Do not double-prefix canonical URLs. Output files remain directly under `dist/`, without a nested `cosmo/` directory.

Preview with `python -m tools.preview`, which mounts `dist/` at the configured prefix. Test direct visits, refresh, root redirect, 404 links, profile language switching, assets and both languages at `/cosmo/`; root-hosting tests alone are insufficient.

`.github/workflows/pages.yml` builds and tests with Python, uploads `dist/`, and deploys through GitHub Pages. Main pushes and manual main runs publish; pull requests do not. Its `workflow_run` trigger watches **Sync content and generate HTML** and must be preserved because bot commits cannot trigger another push workflow. Failed checks must not replace the live website.

The consolidated sync workflow retains the daily UTC schedules: publications 00:00, journal club 00:15, people 00:30. Research remains manual. Source overrides are repository variables; production Pages builds use the explicit live URL in `pages.yml`.

## Checks

```bash
python -m tools.content
python -m unittest discover -s tests -v
python -m tools.build
python -m tools.check dist
python tests/browser_check.py
```

Install `requirements.txt` for generation and unit tests; `requirements-dev.txt` adds browser testing. Browser tests use installed Chrome by default or Playwright Chromium with `CHROME_PATH=chromium`.

Do not edit generated HTML as the permanent source. Do not commit `dist/`, ZIP artifacts, screenshots or local environments.
