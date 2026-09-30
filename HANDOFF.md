# Cosmo migration handoff

The user requested the full plain-HTML conversion on `main`, replacing the separately deployed Next.js static-export implementation. The integration keeps the latest main-branch member data and Juan Pablo Elia’s profile photo.

## Result

- Website: HTML, CSS and vanilla JavaScript; no React/Next.js or Node build dependencies.
- Authoring/generation: shared HTML/Jinja templates and existing JSON content, with Python tools.
- Hosting: existing GitHub Pages address, https://nahuelmg.github.io/cosmo/.
- Build: `python -m tools.build`; preview: `python -m tools.preview`.
- Generation derives `/cosmo` from the full site URL and applies it to links, assets, root redirect and 404 links. Metadata and sitemap retain exactly one prefix.
- Pages workflow builds, tests and deploys `dist/` on main pushes and after successful content synchronization. Failed checks preserve the prior deployment.
- Content syncs retain their original schedules and source/enrichment rules.

## Validation and maintenance

Read AGENTS.md, README.md and GUIDE.md. Unit tests cover domain-root and subdirectory exports, source parsing, translations, deduplication and safe writes. Browser checks serve generated files at the production prefix and exercise navigation, profiles, filters, themes, mobile keyboard behavior, images, carousel, map loading and no-JavaScript content.

`dist/`, screenshots and ZIP artifacts are ignored. To continue on another machine, clone the updated `main` and install the Python requirements. To see whether the latest integration has been committed, pushed and deployed, check Git status and the GitHub Actions runs rather than relying on this document as a live status report.
