# Buenos Aires Cosmología — editable HTML website

The bilingual website is plain HTML, CSS and browser JavaScript. Edit the committed pages directly; there is no Node.js, React, Next.js or full-page generation step. The existing design and address, https://nahuelmg.github.io/cosmo/, are preserved.

## Edit and preview

- `es/` and `en/`: editable pages, including individual profiles.
- `index.html` and `404.html`: root redirect and error page.
- `assets/`: CSS, JavaScript, fonts and icons.
- `people/`, `Portadas/`, `logo_cosmo.png`, `favicon.ico`: images.

Preview directly from the repository using Python 3.11+ (no packages required):

```bash
python -m tools.preview
```

Open http://127.0.0.1:8000/cosmo/. Use HTTP preview because the existing URLs include the `/cosmo/` hosting prefix. No build is needed to see HTML edits.

Automatic content is enclosed by `<!-- AUTO:name:START -->` and `<!-- AUTO:name:END -->` comments. Edit outside these regions freely. Changes inside them are replaced by the next relevant sync; use the source data or automation fragments for those changes. See [GUIDE.md](GUIDE.md) for content ownership.

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

The website is committed for `/cosmo/`. To move domains or paths, update HTML links and metadata, sitemap, robots, `content/site.json`, `build-info.json`, new-profile scaffolds and workflow URL settings together. `--site-url` and `SITE_URL` assert the expected URL; they do not rewrite pages.

Optional browser checks:

```bash
pip install -r requirements-dev.txt
python -m playwright install chromium
CHROME_PATH=chromium python tests/browser_check.py
```

With system Chrome installed, omit `CHROME_PATH`. Tests cover both languages, desktop/tablet/mobile layouts, navigation, filters, themes, keyboard behavior, profiles, maps and reading without JavaScript.

Historical `.planning/`, `references/` and framework-era material do not describe the current architecture. Do not commit `dist/`, local environments or test artifacts.
