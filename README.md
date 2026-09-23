# Cosmology Group — UBA / FCEN

Bilingual institutional website for the Cosmology Group at FCEN, Universidad de Buenos Aires. Spanish is the default language; English is available on every page.

Production address: **https://nahuelmg.github.io/cosmo/**

For coding agents and future sessions, read [AGENTS.md](AGENTS.md) for the project handoff, sync schedules, and implementation constraints.

## Development

Use Node **20.x** (`nvm use`) and pnpm **10.x**, matching CI.

```bash
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:3000/cosmo/es/
pnpm validate-content
pnpm lint
pnpm test
pnpm build               # generates out/, including root and 404 HTML
pnpm typecheck
pnpm check-export        # verifies routes, links, and assets in out/
pnpm preview             # http://localhost:3000/cosmo/ (static files only)
```

`pnpm start` also runs the static preview. The preview serves real files, redirects directory URLs to trailing slashes, and returns the exported 404 page for missing paths. `PORT=3001 pnpm preview` changes its port. The build downloads Google Fonts and bundles them into the exported site.

## GitHub Pages deployment

In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. No branch containing generated HTML is needed.

The **Deploy GitHub Pages** workflow validates and builds pull requests without publishing. Pushes to `main` and manual runs on `main` build and deploy `out/`. The workflow uses the `github-pages` environment and GitHub's built-in token; no deployment secret is required. Its deployment job reports the published URL. Failed validation/builds leave the previous deployment intact.

The workflow also runs after successful **Sync Publications**, **Sync People**, and **Sync Journal Club** workflows. It checks out the latest `main`, including the content commit created by the sync. This explicit trigger is necessary because commits pushed using `GITHUB_TOKEN` do not trigger push workflows.

To publish initially, push the implementation to `main` after enabling Pages, or run **Actions → Deploy GitHub Pages → Run workflow**. After deployment, check the homepage, a Spanish and English section, a person profile, language/theme switches, and a missing URL. To roll back, revert the problematic commit on `main` and let the workflow publish the previous content.

## Content and routing

- `content/`: validated JSON content; `messages/`: Spanish and English UI translations.
- `src/views/`: shared section and profile implementations.
- `src/app/[locale]/`: homepage and static section/profile route adapters.
- `src/i18n/routing.ts`: translated public paths; `sections.ts` maps them to views at build time.
- `src/config/paths.ts`: `/cosmo` prefix and helper for public assets. Next.js navigation applies the prefix itself.
- `src/config/site.ts`: identity and canonical URL.

Both languages and all non-past member profiles are generated at build time. For example, `/cosmo/es/personas/` and `/cosmo/en/people/` are real exported directories. No middleware, runtime server, or rewrite rules are needed. The root landing page opens Spanish; the 404 page links to both homepages.

Keep editing content through the existing JSON and sync scripts (see `content/*SYNC.md`). Changes go live after a successful deployment. Browser features such as publication filters, the carousel, and theme selection remain interactive.

## Environment

See `.env.example`. `NEXT_PUBLIC_SITE_URL` defaults to `https://nahuelmg.github.io/cosmo` and includes the repository path, without a trailing slash. The production workflow sets `SITE_INDEXABLE=true`; local and pull-request builds default to disallowing search indexing. A future repository/domain change must update both the canonical URL and the base path, followed by a rebuild.

The site uses Next.js 16, React 19, TypeScript, Tailwind CSS 4, and next-intl. GitHub Pages receives only the generated HTML, CSS, JavaScript, fonts, and images in `out/`.
