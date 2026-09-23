# Cosmo — agent handoff

Last updated: 2026-09-23. This is an existing, deployed website; preserve its current content and design unless the task requests changes.

## Project and current status

- **Identity:** Buenos Aires Cosmología, the Cosmology Group at the Department of Physics, FCEN, Universidad de Buenos Aires; affiliated with IFIBA / CONICET.
- **Website:** https://nahuelmg.github.io/cosmo/
- **Public repository:** https://github.com/nahuelmg/cosmo
- **Branch:** `main`.
- **Hosting:** GitHub Pages, configured to deploy with GitHub Actions. No runtime server or custom domain.
- **Languages:** Spanish by default, English toggle; translated URLs are intentional.
- **Deployment implementation:** commit `a18a1c4` (`Prepare static website and GitHub Pages deployment`). It is committed, pushed, and deployed.
- The static-hosting migration is complete. There was no outstanding deployment blocker at handoff. Check current Git status and workflow results before assuming this snapshot still matches the latest state.

The user chose to retain the Next.js authoring system, existing appearance and interactions, and URLs such as `/cosmo/es/personas/`. The request was to generate a static HTML website, not to rewrite the project as manually maintained HTML.

## Start here

1. Read this file and [README.md](README.md), then inspect `git status` and the relevant implementation before editing.
2. Use the workflow YAML and current code as the source of truth. `GUIDE.md` is a generic project-startup template; `.planning/` contains historical plans that may describe the older server/Vercel architecture.
3. Keep TypeScript strict, the bilingual content model, existing design tokens, and accessible interactions. The design references are [MASTER.md](design-system/cosmology-group-uba/MASTER.md) and [OVERRIDES.md](design-system/cosmology-group-uba/OVERRIDES.md); the implemented tokens are in `src/app/globals.css`.
4. For content tasks, read the relevant `content/` documentation before changing generated JSON. Some older instructions in `content/SYNC.md` mention editing `people.json`; use the newer hybrid people-sync model described below instead.

## Architecture and file map

Stack: Next.js 16 App Router, React 19, next-intl 4, TypeScript, Tailwind CSS 4, Zod, and Vitest. Exact resolved versions live in `pnpm-lock.yaml`.

| Location | Responsibility |
|---|---|
| `src/app/[locale]/layout.tsx` | Locale validation, static locale generation, shared layout, metadata, theme bootstrap |
| `src/app/[locale]/page.tsx` | Homepage |
| `src/app/[locale]/[section]/page.tsx` | Static translated section routes |
| `src/app/[locale]/[section]/[slug]/page.tsx` | Static member profile routes |
| `src/views/` | Shared section and profile implementations |
| `src/i18n/` | Routing map, navigation wrappers, messages configuration, section resolution |
| `src/components/` | Layout, carousel, people, research, publications, and other UI |
| `src/content/` | Zod schemas and content accessors |
| `content/` | Content JSON, curated enrichment/translations, and sync documentation |
| `messages/es.json`, `messages/en.json` | UI translations |
| `public/` | Logo, portraits, and hero images; path capitalization matters |
| `src/config/paths.ts` | `/cosmo` base path and `withBasePath` helper |
| `src/config/site.ts` | Group identity, affiliations, address, canonical site URL |
| `src/lib/metadata.ts`, `src/lib/schemas.ts` | SEO metadata and JSON-LD |
| `scripts/finalize-export.ts` | Root redirect HTML, bilingual 404 HTML, `.nojekyll` |
| `scripts/check-export.ts` | Expected export files and local HTML link/asset validation |
| `scripts/preview-static.ts` | Static preview mounted at `/cosmo/` |

### Static-hosting requirements

- `next.config.ts` uses `output: "export"`, `trailingSlash: true`, `basePath: "/cosmo"`, and `images.unoptimized: true`.
- `pnpm build` runs content validation before Next.js and the export finalizer afterward. Deploy **`out/`**, not `.next/`. Do not commit generated build output.
- There is no `src/proxy.ts` middleware. Localized URLs are actual exported directories, not server rewrites. Keep locale/section/profile enumeration in `generateStaticParams`; unknown paths should return 404.
- All non-`past` member profiles are generated in both languages. Keep the profile route generator, sitemap, and export checker consistent when changing eligibility.
- Use the typed navigation wrappers from `src/i18n/navigation.ts`. Next.js links add the base path; do not prefix their internal route keys manually. Use `withBasePath` for public assets and plain HTML links instead.
- Language switching passes only the profile `slug` when present. Locale and section come from the destination language's routing map. Preserve query strings.
- Theme preferences are read in the browser. The inline bootstrap script prevents a theme flash; `ThemeProvider` uses an external store for hydration. Do not reintroduce a server `cookies()` read into the exported layout.
- `pnpm start` means static preview, not `next start`. GitHub Pages cannot run request-time Next.js code or the image optimization service.
- The root `/cosmo/` landing page redirects to `/cosmo/es/` with visible language links. The exported `404.html` links to both homepages.

## Content maintenance

- **People:** `content/people.json` is generated from the roster Google Sheet plus hand-maintained `content/people-extra.json`, keyed by slug. Put persistent photos, external identifiers, and curated bilingual enrichment in `people-extra.json`; do not patch generated output as the long-term source. See [PEOPLE-SYNC.md](content/PEOPLE-SYNC.md).
- **Journal Club:** synced from a published Google Sheet. See [JOURNAL-CLUB-SYNC.md](content/JOURNAL-CLUB-SYNC.md).
- **Publications:** synced by `scripts/sync-publications.ts` using member identifiers and its configured literature sources. Read that script and [SYNC.md](content/SYNC.md) for source/identifier details; store curated member identifiers through the people enrichment model.
- **English content translations:** `content/translations.en.json` maps exact source text to English and is not overwritten by syncs. Explicit bilingual fields take precedence; unknown source text remains in its original language. See [TRANSLATIONS.md](content/TRANSLATIONS.md).
- **Research:** `pnpm sync-research` exists and uses a Google document, but there is currently **no scheduled research-sync workflow**.
- UI strings belong in both `messages/` files. Preserve names, publication titles, and institutional identity as appropriate; avoid replacing real content with mock data.
- Runtime content comes from checked-in JSON. External syncs happen separately; content becomes public only after a successful build/deployment.

## Sync schedule and deployment

The schedules below run every day. Buenos Aires uses ART (UTC−3); each UTC time is on the next calendar day relative to the listed local evening.

| Workflow | Buenos Aires | UTC | Cron |
|---|---|---|---|
| Sync Publications | 21:00 | 00:00 | `0 0 * * *` |
| Sync Journal Club | 21:15 | 00:15 | `15 0 * * *` |
| Sync People | 21:30 | 00:30 | `30 0 * * *` |

Each sync also supports manual `workflow_dispatch`, validates content, and commits changed output to `main` using the Actions bot.

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) defines **Deploy GitHub Pages**:

- Pushes to `main` and manual runs on `main` validate, build, and deploy.
- Pull requests validate and build without publishing.
- Successful completion of any of the three named sync workflows triggers deployment via `workflow_run`, even when the sync found no content changes. Failed syncs do not deploy through this trigger.
- Preserve the explicit `workflow_run` trigger: sync commits use `GITHUB_TOKEN` and `[skip ci]`, so a push trigger alone is insufficient. These runs check out the latest `main`, which includes any commit made during the sync.
- Production runs share a deployment concurrency group. Publishing happens after checks pass; deployment has no independent cron schedule.
- The workflow uploads `out/` and deploys it to the `github-pages` environment. It uses GitHub's built-in token; no custom deployment secret is required.
- Inspect status and logs at https://github.com/nahuelmg/cosmo/actions. A failed build does not replace the last published site. Revert a problematic commit and deploy the corrected `main` to roll back.

## Local commands and environment

Use **Node 20.x** (`.nvmrc` and `package.json`) and **pnpm 10.x**, matching CI. The previous session's machine defaulted to Node 24 / pnpm 12; Node 24 failed in the existing `.mjs` content validator, and pnpm 12 attempted to modify build-script policy. Select the project toolchain instead of changing application code to accommodate an incidental local version.

```bash
nvm use
node --version
pnpm --version             # should be 10.x
pnpm install --frozen-lockfile
pnpm dev                   # http://localhost:3000/cosmo/es/

# Validation and production-like preview
pnpm validate-content
pnpm lint
pnpm test
pnpm build                 # prebuild + next build + postbuild
pnpm typecheck             # run after build on a fresh checkout for generated route types
pnpm check-export
pnpm preview               # http://localhost:3000/cosmo/
```

`PORT=3001 pnpm preview` selects another port. Google Fonts are downloaded during the build and bundled into the export; dependencies and fonts require network access. No Node server is required after deployment.

See [.env.example](.env.example):

- `NEXT_PUBLIC_SITE_URL=https://nahuelmg.github.io/cosmo` includes the repository path, without a trailing slash. Keep canonical, social image, sitemap, and JSON-LD URLs consistent with it.
- `SITE_INDEXABLE=true` is set by the production workflow. Local and pull-request builds default to disallowing indexing. To inspect production robots output locally, use `SITE_INDEXABLE=true pnpm build`.
- Optional content-source overrides: `PEOPLE_SHEET_CSV_URL`, `JOURNAL_CLUB_SHEET_CSV_URL`, and `RESEARCH_DOC_TXT_URL`. The people and journal-club workflows read repository variables; scripts contain default source locations.
- A repository/domain change requires updating both the canonical URL and base path, then rebuilding.

## Last verified results and next-session checks

On 2026-09-23, commit `a18a1c4` passed content validation, lint, type checking, the production build, and **203 tests across 10 files**. Export validation checked **93 required files and 3,213 local HTML references**, including **72 localized member profile pages**. Counts will change as content changes.

Local static-preview and live Chrome checks passed for the root redirect, Spanish/English navigation, profile language switching with query preservation, direct visits and refreshes, saved dark theme, publication search/member filters, carousel controls, images, mobile navigation, and 404 links. The browser harness/screenshots were temporary files outside the repository; they are not a committed test suite.

Successful workflow evidence from that session:

- Initial deployment: https://github.com/nahuelmg/cosmo/actions/runs/35921171183
- Manually dispatched Journal Club sync: https://github.com/nahuelmg/cosmo/actions/runs/35921516036
- Deployment automatically triggered by that sync: https://github.com/nahuelmg/cosmo/actions/runs/35921574404

For future routing or hosting changes, repeat the build/export checks and browser smoke checks against the static preview mounted at `/cosmo/`; a successful dev-server page alone does not establish GitHub Pages compatibility. Update this handoff when architecture, schedules, deployment, or outstanding work changes.
