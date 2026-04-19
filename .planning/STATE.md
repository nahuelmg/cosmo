# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19 after v1.1 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.1 shipped. Planning next milestone — run `/gsd:new-milestone` to scope v1.2.

## Current Position

Phase: — (no active milestone)
Plan: —
Status: v1.1 archived + tagged. Ready to plan next milestone.
Last activity: 2026-04-19 — v1.1 milestone complete, tag pushed.

Progress: v1.1 SHIPPED (13/13 plans across Phases 7–12)

## Shipped Milestones

- **v1.0 MVP** (2026-04-18) — 31 plans across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied. Full archive: `.planning/milestones/v1.0-ROADMAP.md`
- **v1.1 arXiv + InspireHEP Publication Sync** (2026-04-19) — 13 plans across 6 phases (7–12). 321 real publications auto-synced from InspireHEP + arXiv; weekly GitHub Actions cron; 45/48 requirements complete + 2 softened + 2 partial (9/13 DATA-09/10). Full archive: `.planning/milestones/v1.1-ROADMAP.md`

## Open Items Carried Forward (v1.2+)

**v1.0 production re-measurement (deferred):**
- PERF-04/05 — Vercel production LCP + CLS numerical targets
- NAV-04 — mobile drawer 375px live-deploy check (structural verified)
- HeroCarousel pause / reduced-motion / MapEmbed IntersectionObserver runtime verification
- Hero "Grupo de Cosmología" title contrast on JWST starfield backgrounds (needs stronger text-shadow or dedicated gradient scrim)

**v1.1 content tasks (deferred):**
- DATA-09/10: add `inspirehep_id` + `orcid_id` for juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia (4 remaining sync-scoped members)

**v1.1 code cleanup (deferred):**
- Remove `publications_selected` Zod field from `src/content/schemas/people.schema.ts`
- Remove orphaned accessor exports: `getPublicationById`, `getPublicationsByTopic`, `getAllTopics`
- Remove dead `people.selectedPublications` i18n key from both locale files
- Update REQUIREMENTS.md PR-flow description to match direct-to-main push (Phase 10 decision)

**v1.1 operational (deferred):**
- OPS-DEFER-01: Action failure notification (email/Slack)
- OPS-DEFER-02: Per-person exclusion list (`exclude_arxiv_ids`)
- SYNC-DEFER-02/03: NASA ADS API + cross-source DOI dedup

## Session Continuity

Last session: 2026-04-19 — v1.1 milestone complete, archived, tagged.
Resume file: None
