# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-17)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Phase 3 Layout Shell — parallel wave (03-01, 03-02, 03-03)

## Current Position

Phase: 3 of 6 (Layout Shell)
Plan: 03-02 complete (EmailLink component shipped)
Status: In progress — wave-1 parallel plans executing
Last activity: 2026-04-17 — Completed 03-02-PLAN.md

Progress: [█████░░░░░] ~43%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~12 min
- Total execution time: ~2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 Complete | ~57 min | ~14 min |
| 2. Content Layer | 5/5 Complete | ~40 min est. | ~8 min |
| 3. Layout Shell | 1/TBD | ~2 min | ~2 min |
| 4. Core Pages | 0/TBD | — | — |
| 5. SEO & Discoverability | 0/TBD | — | — |
| 6. Polish (A11y & Performance) | 0/TBD | — | — |

**Recent Trend:**
- 03-02 ran ~2 min (pure-auto, two-file component, no checkpoints)
- Phase 2 plans ran 3–30 min (01: 3 min pure-auto; 05: ~30 min with human-verify checkpoint)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation: Vercel-only deployment (no dual-build) — avoids static-export CI overhead.
- Foundation: next-intl with Spanish default, English toggle — locks URL structure from Phase 1.
- Content: JSON/YAML content files with Zod validation over a CMS — academic maintainers edit infrequently.
- Home: Keep auto-fade hero carousel despite anti-pattern flag — ≥6s dwell + `prefers-reduced-motion` respected.
- Publications: Defer arXiv/ADS importer to v2 — placeholder data validates layout now.

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | lint=eslint src (not next lint) | next lint removed from Next.js 16 CLI |
| 01-01 | tsconfig excludes ui-ux-pro-max/skills/references/.planning/ | Default **/*.ts glob picked up non-project TS files |
| 01-01 | Node 20 via nvm required | System had Node 18; Next.js 16 requires >=20.9.0 |
| 01-02 | Warm-academic palette at hue 45° (muted terracotta accent) | CONTEXT.md: warm band 30°–80°; cool blues rejected |
| 01-02 | Source Serif 4 + Source Sans 3 font pair | Greek subset required; Crimson Pro + Atkinson Hyperlegible disqualified (no Greek on Google Fonts) |
| 01-02 | No-border policy: focus rings via box-shadow only | CONTEXT.md: hierarchy via typography and whitespace alone |
| 01-02 | Two-tier surface: primary oklch(0.995 0.003 85) + alt oklch(0.978 0.008 80) | CONTEXT.md: max two surface tiers |
| 01-02 | Type scale ratio 1.2, H1=2rem | CONTEXT.md: restrained display scale (28–32px) |
| 01-02 | Shadow ceiling at --shadow-md; --shadow-lg/xl removed | Nature long-form aesthetic; whitespace hierarchy principle |
| 01-03 | journal-club stays English in both locales | International domain lexicon; Spanish speakers recognise it |
| 01-03 | localeDetection: false — / always → /es | Argentine-first, canonical-friendly, no Accept-Language sniffing |
| 01-03 | dev-warn/prod-silent i18n error policy | I18N-06: dev visibility + production silence on missing keys |
| 01-04 | @theme inline for font utilities | Without inline, Tailwind resolves font name literally and bypasses next/font subsetting pipeline |
| 01-04 | locale-layout order locked: hasLocale → notFound → setRequestLocale → render | Required by next-intl for static rendering; deviation breaks SSG |
| 01-04 | Greek probe retained in page.tsx until Phase 3 | Visual confirmation Greek subset stays wired across future changes |
| 01-04 | Root layout.tsx + page.tsx deleted | Proxy from 01-03 guarantees locale-prefixed traffic; no root route needed |
| 02-01 | import * as z from "zod" not "zod/v4" | Zod v4 ships as default export; /v4 path for v3-alongside compatibility only |
| 02-01 | z.strictObject() for bilingualString | .strict() chain is deprecated in Zod v4 API |
| 02-01 | photoPath rejects leading slash | path.join(PUBLIC_DIR, "/people/Foo.png") resolves to filesystem root, not public/ |
| 02-01 | siteConfig uses TypeScript satisfies not Zod | Developer-maintained file; compile-time sufficient; no runtime overhead |
| 02-01 | groupName single canonical Spanish string | Argentine institutional identity; site-level identity not bilingual (I18N-03) |
| 02-01 | .vscode/settings.json committed (.gitignore exception) | JSON schema wiring is shared team config, not user-specific |
| 02-05 | node --import tsx (not tsx/esm) for prebuild scripts | tsx/esm requires explicit file extensions in import specifiers; bare tsx flag handles .ts imports from .mjs scripts |
| 02-05 | JSON Schema target draft-07 for VS Code | VS Code JSON language server fully supports Draft 7; Draft 2020-12 (Zod v4 default) has limited VS Code support |
| 02-05 | Photo-existence check post-parse, not via Zod .refine() | Schema stays filesystem-free; error category is visually distinct in CLI output |
| 02-05 | generate-schemas is manual (not chained into prebuild) | Schema-JSON drift is visible via git diff; maintainer opts in to regeneration |
| 02-05 | Zod .refine() rules do not translate to JSON Schema — build time only | photoPath and proseString smart-quote checks are runtime-only; not representable in JSON Schema |
| 03-02 | Two-file EmailLink (server wrapper + 'use client' inner) via next/dynamic ssr:false | Only way to guarantee zero message-scheme literal in prerendered HTML source (Success Criterion 3 / NAV-03) |
| 03-02 | No loading-state fallback on dynamic import | next/dynamic loading is zero-arg; prop-aware plaintext requires duplicating UI — accepted flash-of-nothing for simplicity |
| 03-02 | URI scheme assembled via ['mai','lto'].join('') not string literal | Literal token must not appear as contiguous five characters in source or compiled bundle |

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

- Add nvm init to shell profile so pnpm works without sourcing manually each session.

### Blockers/Concerns

- **Node version environment:** pnpm and Next.js 16 commands require Node 20. Must source nvm before running: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`. Consider adding to .bashrc.

## Session Continuity

Last session: 2026-04-17
Stopped at: Completed 03-02-PLAN.md (EmailLink component)
Resume file: None
