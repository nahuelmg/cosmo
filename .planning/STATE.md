# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18 after v1.0 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Planning next milestone (v1.1) — arXiv + InspireHEP publication sync connecting PIs/postdocs/PhDs to profiles, with publications auto-populating on `/publications` and individual `/people/[slug]` pages.

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-18 — Milestone v1.1 started (arXiv + InspireHEP publication sync)

Progress: [done] v1.0 — 31/31 plans complete across 6 phases (100%); v1.1 defining requirements

## Current Milestone: v1.1 arXiv + InspireHEP Publication Sync

**Goal:** Auto-populate publications from InspireHEP + arXiv for each current PI, postdoc, and PhD, refreshed weekly at build time.

**Locked decisions (from milestone kickoff 2026-04-18):**
- Sync mode: build-time GitHub Action (weekly cron) — preserves fully-static SSG, keeps PERF-01
- Sources: InspireHEP + arXiv, no cross-source DOI dedup (entries source-tagged instead)
- Author linkage: explicit `arxiv_id` + `inspirehep_id` fields in `content/people.json` (no ORCID, no name-heuristics)
- Failure mode: fall back to last-good `content/publications.json`; site deploys regardless
- Profile display: `/people/[slug]` shows last-N-years subset filtered by author match; `/publications` shows full archive
- Scope: current members only (PIs / postdocs / PhDs); past members keep v1.0's flat list, no sync

## Shipped — v1.0 MVP (2026-04-18)

- Bilingual (es default / en toggle) institutional website
- 45 fully-static routes prerendered
- Schema.org ResearchOrganization + Person + ScholarlyArticle JSON-LD
- Sitemap (20 canonical URLs + hreflang alternates) + robots.txt
- axe-core 0 critical violations on 8 Spanish pages (WCAG AA)
- 73/75 v1 requirements satisfied; 2 scope-adjusted (PUBS-03/04 deferred)
- 158 commits, 2-day build span

Full archive: `.planning/milestones/v1.0-ROADMAP.md` + `v1.0-REQUIREMENTS.md` + `v1.0-MILESTONE-AUDIT.md`

## Open Items Carried Forward

**Deferred to production re-measurement** (needs Vercel deploy + Lighthouse Lab):
- PERF-04: LCP < 2.5s on mobile 4G for Home / People / Publications
- PERF-02: numerical CLS on 7 of 8 pages (structural verification complete)
- PERF-05: CLS = 0 on 7 of 8 pages (Contact CLS=0.01 measured)

**Runtime verification against live deploy**:
- NAV-04: mobile drawer 375px runtime check (structural done)
- HeroCarousel: pause / reduced-motion / MapEmbed IntersectionObserver runtime (deferred from 04-02 human-verify)

**Low-risk code polish**:
- `src/components/layout/MobileNav.tsx:87` — `focus:outline-none` flag (box-shadow ring provides focus; lint only)
- `src/components/layout/SiteFooter.tsx:1` — unused `next/link` dead import (flip to `@/i18n/navigation`)

## Accumulated Context (v1.0 shipped)

### Key Decisions (see PROJECT.md for full table + outcomes)

- Vercel-only deployment; fully-static build output
- next-intl 4.9 with Spanish default + English toggle; pathnames map at `src/i18n/routing.ts` is the URL source of truth
- CSS-first Tailwind v4 with `@theme` in `globals.css` + OKLCH tokens
- Zod v4 strict schemas + `@/content` barrel + JSON Schema IntelliSense (no CMS)
- Single `<main>` landmark in `[locale]/layout.tsx`; pages return content fragments
- `EmailLink` two-file pattern (zero `mailto:` in prerendered HTML)
- `buildPageMetadata` helper — single SEO composition site; static `metadata` export preserves SSG
- `getPathname` as URL source of truth for sitemap + nav + canonicals
- Scope-adjusted PUBS-03 / PUBS-04 beyond v1.0; HOME-03 dot-only carousel control

### Patterns established (reusable across milestones)

- Parse-at-module-load for content JSON (throws at import time, not per-request)
- Locale-resolved accessors (`getLocalized*`) — components never touch `.es`/`.en`
- Props-down server composition — page RSCs resolve translations/data, pass strings down to leaves
- Static ICON_MAP keyed by JSON field (tree-shake safe)
- Per-entry stable `id="pub-{id}"` / slug-based anchors for deep links
- Bundled atomic task commits per plan + plan-metadata commit + phase-completion commit

---

*Updated 2026-04-18 — v1.1 milestone scope locked; next: research decision → requirements → roadmap.*
