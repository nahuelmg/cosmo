# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20 after v1.2 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** Planning next milestone (v1.3) — open candidates: carried-forward v1.1 code cleanup, v1.0 production re-measurement campaign, or new capability milestone.

## Current Position

Phase: — (between milestones)
Plan: —
Status: v1.2 shipped & archived. Ready for `/gsd:new-milestone`.
Last activity: 2026-04-20 — v1.2 Aesthetic Polish milestone complete: 13 plans across 3 phases, 26/26 requirements, 45 static routes preserved, `pnpm axe` 0 violations.

## Shipped Milestones

- **v1.0 MVP** (2026-04-18) — 31 plans across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- **v1.1 arXiv + InspireHEP Publication Sync** (2026-04-19) — 13 plans across 6 phases (7–12). 321 real publications auto-synced from InspireHEP + arXiv; weekly GitHub Actions cron; 45/48 requirements complete + 2 softened + 2 partial. Archive: `.planning/milestones/v1.1-ROADMAP.md`
- **v1.2 Aesthetic Polish** (2026-04-20) — 13 plans across 3 phases (13–15). Typography + spacing + media + interactive + documentation polish; 26/26 requirements complete; 11/11 cross-phase wiring + 5/5 E2E flows verified; CI drift gate installed. Archive: `.planning/milestones/v1.2-ROADMAP.md`

## Open Items Carried Forward (v1.3+)

**v1.2 post-milestone doc drift (new):**
- Commit `1cf9cf8 feat(header): enlarge nav tabs to text-lg and widen chrome to max-w-6xl` landed after Phase 15 seal; MASTER.md Component Specs "Nav Link" and OVERRIDES.md v1.2 row 11 still describe `text-sm + py-1.5` — needs a v1.3 amendment recording the override
- Commit `b3f697c feat(hero): remove tagline line from carousel overlay` landed after Phase 15 seal; verify MASTER.md HeroCarousel recipe still matches
- Desktop NavLink deliberately has no `focus-visible:ring-*` — relies on browser UA default; flagged in 15-VERIFICATION as observation. Revisit if judged insufficient on live site.

**v1.0 production re-measurement (deferred):**
- PERF-04/05 — Vercel production LCP + CLS numerical targets
- NAV-04 — mobile drawer 375 px live-deploy check (structural verified)
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

Last session: 2026-04-20 — v1.2 milestone completed: audit (`v1.2-MILESTONE-AUDIT.md` archived) + MILESTONES.md entry + PROJECT.md evolved + ROADMAP.md collapsed + REQUIREMENTS.md archived & deleted + git tag.
Stopped at: Between milestones — `/gsd:new-milestone` ready.
Resume file: None
