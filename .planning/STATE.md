# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19 after v1.1 milestone)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.2 Aesthetic Polish — ui-ux-pro-max consultation + application across typography, buttons, spacing, photo sizing, micro-interactions. Preserves warm-academic direction.

## Current Position

Phase: 14 of 15 — In progress (media sizing)
Plan: 02 of 3 planned — COMPLETE (PersonDetail hero 180×225 4:5 portrait; LCP preserved)
Status: 14-02 shipped; 14-01 (PersonCard 240px 4:5) landed on main; 14-03 pending
Last activity: 2026-04-20 — Completed 14-02-PLAN.md: PersonDetail hero resized to 180×225 (4:5) + sizes tightened to "(min-width: 768px) 180px, 180px"; LCP triple (preload/eager/fetchPriority) preserved verbatim

Progress: v1.1 SHIPPED (13/13 plans); v1.2 Phase 13 shipped (4/4 plans); Phase 14 in progress (2/3 plans complete)
██████████ Phase 13: 4/4 plans complete ✓
██████░░░░ Phase 14: 2/3 plans complete

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

Last session: 2026-04-20T04:06:00Z — 14-02 PersonDetail hero resize complete.
Stopped at: Completed 14-02-PLAN.md (PersonDetail hero 180×225 4:5 + tightened sizes + mobile cap; LCP preserved)
Resume file: None

## Accumulated Decisions (v1.2)

| Decision | Context | Phase |
|---|---|---|
| Scope `line-height: 1.2` to `h1` only in `@layer base` | H3 at text-2xl is sub-display; tight leading hurts readability there | 13-01 |
| `--text-5xl: 2.5rem` caps hero H1 at 40px (not Tailwind default 48px) | HeroCarousel only; inner page H1s use text-4xl (36px) | 13-01 |
| SPACE-03 two-tier rule: dense = p-4 (grid cards), spacious = p-6 (feature cards), flat across breakpoints | No CSS abstraction, no responsive variants per CONTEXT.md | 13-03 |
| ResearchCard p-8 was out-of-spec; reduced to p-6 | Only card using p-8; now uniform with OutreachCard spacious tier | 13-03 |
| tracking-tight removed from all inner-page H1s; @layer base -0.01em governs | Consistent letter-spacing; tracking-tight (-0.025em) was overriding the base rule | 13-02 |
| research/page.tsx promoted to max-w-6xl (grid classification) | Research has card grid content; prose header at 6xl width is acceptable | 13-02 |
| MASTER.md Layout section: Hero py-20 retained as reserved convention | HeroCarousel v1.2 doesn't use a wrapper py-20; kept for future full-bleed variants | 13-04 |
| SessionRow documented as py-5 (dense-row equivalent) in MASTER.md | List rows with dividers use vertical-only padding; not a deviation from p-4 dense tier | 13-04 |
| PersonDetail hero = 180 px × 225 px (4:5 portrait), matching PersonCard shape | Detail reads as card zoom-in; 44% footprint reduction; bio column auto-widens by 60 px | 14-02 |
| Mobile PersonDetail layout: stacked + centered 180 px cap (not inline at 375 px) | Inline at 375 leaves ~147 px for bio — breaks line length; stacked preserves reading flow | 14-02 |
| sizes="(min-width: 768px) 180px, 180px" over `…, 100vw` on capped-mobile images | When mobile cap equals desktop width, narrow-constant sizes tightens preload srcset (256w 1x / 384w 2x) | 14-02 |
| Aspect-ratio via wrapper `aspect-[4/5]` (not fixed w/h on Image) on LCP images | Preserves Phase 6 `fill`+parent-aspect pattern so LCP preload hint stays stable | 14-02 |
