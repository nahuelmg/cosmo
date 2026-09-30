# Cosmo migration handoff

The website source is now committed plain HTML in the repository root, `es/` and `en/`, with ordinary CSS and JavaScript. Preview with `python -m tools.preview`; no build is required for editing. `python -m tools.build` packages the website into ignored `dist/` without generating pages.

Automatic publications, people and journal-club updates remain scheduled. Research remains manual. Python updates only marked AUTO regions, retaining manual markup and former-member profiles. Sync commits data and HTML together, retrying concurrent main changes from a fresh checkout. Pages retains its workflow_run connection and `/cosmo/` address.

Read README.md, GUIDE.md and AGENTS.md for maintenance and checks. The migration is a local implementation until committed and pushed; this document is not a live deployment status report. No framework or Node.js dependency is needed. Historical framework planning documents do not override the current architecture.

Validation: 26 unit tests passed; all 92 HTML files passed local link checks. Browser checks passed for all routes, with 18 representative pages exercised at three viewport sizes in both themes, plus interaction and no-JavaScript checks. Baseline visible text is preserved except for the corrected publication clear-button label.
