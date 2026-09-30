# Cosmo static migration handoff

Updated: 2026-09-30.

## Requested result and decisions

Convert the whole Next.js website to plain HTML, CSS and vanilla JavaScript, preserving its appearance, Spanish/English pages, profiles, filters, themes, carousel, mobile menu, content and automatic synchronization. The user approved Python for offline generation/importing and generic static hosting at the domain root.

## Completed

- Replaced the Next.js/React/TypeScript implementation and Node package/build configuration.
- Added Jinja HTML templates, ordinary CSS, browser JavaScript, local fonts/licenses and SVG icons.
- Added Python generation, validation and all four content importers, preserving the existing data sources and JSON formats.
- Added Python GitHub workflows for tests, static artifacts and scheduled content syncs. Both workflows honor the `SITE_URL` repository variable.
- Produced `dist/` with 90 localized content pages, a root redirect, a 404 page, sitemap, robots rules and assets.
- Packaged `cosmo-static-site.zip` with the contents of `dist/` at the ZIP root.
- Updated README.md, GUIDE.md, content maintenance documentation and setup.sh.

## Verified

Final checks on 2026-09-30:

- 18 Python tests passed, including parsing, translations, deduplication, validation, and failed-write/build preservation.
- All 92 generated HTML files passed link/anchor/image checks; CSS font references resolve.
- Browser checks passed for every generated route over HTTP and 18 representative pages at 390/768/1440px in light and dark themes.
- Browser checks covered search/member filtering, theme persistence, language switching, mobile focus cycling/Escape, carousel controls, email links, disclosures, deferred map loading and no-JavaScript content.
- Generated HTML contains no Next.js runtime references.
- During the migration, live dry runs passed for people (42 records), journal club (2), research (8), and all publication feeds for Tomas Ferreira Chase (7 records). These did not write or refresh the checked-in content.
- Reference comparisons are in ignored `test-results/comparison/`. The original Spanish people route looped on redirects locally; working English pages were used for visual comparison. Date-only outreach values now display the date stored in JSON rather than the prior UTC-to-local previous-day result.

## Working tree and publishing

Changes are local and uncommitted. No deployment or remote push was performed. Many deletions in `git status` are intentional removal of the replaced framework; new templates/tools/assets are currently untracked and must be included when committing. Do not restore the deleted framework as a cleanup step.

`dist/`, `test-results/`, and the deployment ZIP are ignored generated artifacts. Old ignored `node_modules/` or `.next/` caches may still exist locally; they are not used or included in the deployment ZIP.

Before publishing, set the real domain using `SITE_URL`, `--site-url`, or `content/site.json`; the default remains https://cosmo.vercel.app. Upload the contents of `dist/` to a static host with directory indexes and configure 404.html as its error document. No host was selected or configured. GitHub workflows become available once these changes are committed and pushed; they generate artifacts but do not deploy to a host.

## Resume commands

Use README.md for portable setup. The verified temporary environment in this workspace is `/tmp/cosmo-static-venv`:

```bash
/tmp/cosmo-static-venv/bin/python -m unittest discover -s tests -v
/tmp/cosmo-static-venv/bin/python -m tools.build
/tmp/cosmo-static-venv/bin/python -m tools.check dist
/tmp/cosmo-static-venv/bin/python tests/browser_check.py
python3 -m http.server 8000 --directory dist
```

For a new session, open this project and ask the assistant to read HANDOFF.md, README.md and GUIDE.md. Copy the full working project, including untracked source files, if moving to a different machine; the deployment ZIP alone does not contain the editable templates or automation.
