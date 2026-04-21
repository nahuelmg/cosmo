# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20 after v1.3 milestone completion)

**Core value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.
**Current focus:** v1.3 shipped — next milestone TBD. Candidates: code cleanup sweep, v1.0 production re-measurement, NASA ADS as 4th source, content reconciliation, or new capability milestone.

## Current Position

Phase: None active — v1.3 complete
Plan: Not started
Status: Ready to plan next milestone
Last activity: 2026-04-21 — Completed quick task 001: v1.4 code cleanup sweep

Progress: [ship] v1.3 ✅ · [quick] 001 ✅

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | v1.4 code cleanup sweep — carried-forward deferrals from v1.1/v1.2/v1.3 | 2026-04-21 | 540f2c3 | [001-code-cleanup-sweep](./quick/001-code-cleanup-sweep/) |

## Shipped Milestones

- **v1.0 MVP** (2026-04-18) — 31 plans across 6 phases. 45 fully-static routes. axe-core 0 violations. 73/75 v1 requirements satisfied. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- **v1.1 arXiv + InspireHEP Publication Sync** (2026-04-19) — 13 plans across 6 phases (7–12). 321 real publications auto-synced from InspireHEP + arXiv; weekly GitHub Actions cron; 45/48 requirements complete + 2 softened + 2 partial. Archive: `.planning/milestones/v1.1-ROADMAP.md`
- **v1.2 Aesthetic Polish** (2026-04-20) — 13 plans across 3 phases (13–15). Typography + spacing + media + interactive + documentation polish; 26/26 requirements complete; 11/11 cross-phase wiring + 5/5 E2E flows verified; CI drift gate installed. Archive: `.planning/milestones/v1.2-ROADMAP.md`
- **v1.3 ORCID Sync & Cross-Source Dedup** (2026-04-20) — 9 plans across 4 phases (16–19). ORCID works API as 3rd publication source; cross-source DOI dedup with InspireHEP > ORCID > arXiv precedence; olive-green badge + filter pill + three-source bilingual footnote; 28/28 requirements complete; 8/8 cross-phase wiring + 5/5 E2E flows verified; SiPM paper live on production. Archive: `.planning/milestones/v1.3-ROADMAP.md`

## Open Items Carried Forward (next milestone+)

<!-- v1.1/v1.2/v1.3 code + doc cleanup resolved via quick-001 on 2026-04-21. -->

**v1.3 surfaced deferrals (content):**
- 6 of 9 members with `orcid_id` lack `contact.orcid` — author-ORCID link pill only wires for 3 (Calzetta, Lopez Nacir, Landau). Content task.
- Tomás Ferreira Chase's own `contact.orcid` empty — his InspireHEP papers don't link through to his profile. Cosmetic.

**v1.0 production re-measurement (deferred):**
- PERF-02 / PERF-04 / PERF-05 Vercel production LCP + CLS
- NAV-04 mobile drawer 375 px live-deploy check
- Hero title contrast on JWST starfield backgrounds
- HeroCarousel pause / reduced-motion / MapEmbed IntersectionObserver runtime verification

**Content tasks:**
- DATA-09/10: 4 remaining sync-scoped member IDs (juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia)

## Session Continuity

Last session: 2026-04-20 — v1.3 milestone complete; archived, tagged, and committed.
Stopped at: Ready for `/gsd:new-milestone` to define next scope.
Resume file: None
