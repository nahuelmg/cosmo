# Project Tracker Template

> Copy this template for each new project. Log time per phase to build pricing reference data over time.

---

# {{Project Name}} — Effort Tracker

**Client**: {{client name}}
**Start date**: {{YYYY-MM-DD}}
**Target delivery**: {{YYYY-MM-DD}}
**Actual delivery**: {{YYYY-MM-DD}}

---

## Phase Breakdown

| # | Phase | Estimated Turns | Actual Turns | Hours | Status | Notes |
|---|-------|----------------|-------------|-------|--------|-------|
| 1 | Discovery & scoping | — | | | | Client calls, requirement gathering |
| 2 | Foundation (scaffold, tokens, types) | 2-3 | | | | |
| 3 | Data layer (mock data, provider, hooks) | 3-5 | | | | |
| 4 | Core UI (primary components) | 5-8 | | | | |
| 5 | Navigation & routing | 2-3 | | | | |
| 6 | Polish (theme, skeletons, errors) | 3-5 | | | | |
| 7 | API integration | 3-5 | | | | |
| 8 | Domain features | 3-8 | | | | Varies by complexity |
| 9 | Testing & QA | 2-3 | | | | |
| 10 | Deployment & handoff | 1-2 | | | | |
| | **TOTAL** | **24-42** | | | | |

### How to count "turns"

A **turn** = one conversation with Claude that produces committed code. Typically 15-45 minutes of wall time including review.

### Reference baseline (from Asset Price Dashboard)

| Phase | Turns | What was built |
|-------|-------|---------------|
| Foundation | 3 | Next.js scaffold, OKLCH tokens, types, formatting utils |
| Data layer | 3 | BTC JSON data, DataProvider interface, MockProvider, hooks |
| Core charts | 3 | Lightweight Charts, candlestick/line/area, controls |
| Navigation | 2 | Asset picker, URL state, top nav |
| Polish | 3 | Dark mode, comparison chart, skeletons |
| Binance API | 4 | Client module, BFF routes, ApiProvider, polling |
| Error states | 1 | Error boundaries, stale indicators, loading |
| Interval selector | 2 | Candle interval store, UI, data pipeline |
| Portfolio features | 6 | Zustand store, CRUD, math, summary, chart |
| **Total** | **27** | **13 phases, v1.0–v1.3** |

---

## Complexity Multipliers

Use these to adjust estimates for different project types:

| Factor | Multiplier | Example |
|--------|-----------|---------|
| Static site (no backend) | 0.6x | Landing page, portfolio site |
| Standard CRUD app | 1.0x | Dashboard, admin panel |
| Real-time data | 1.3x | Live dashboard, chat |
| E-commerce (payments) | 1.5x | Stripe integration, cart, checkout |
| Auth + multi-user | 1.4x | User accounts, permissions |
| Bilingual (i18n) | 1.2x | Content in 2+ languages |
| CMS integration | 1.2x | Sanity, Contentful, Strapi |
| Custom animations | 1.3x | Framer Motion, GSAP, transitions |
| Mobile-first responsive | 1.1x | (Should be standard, slight overhead) |

### Pricing formula (starting point)

```
Estimated turns = Base turns * Complexity multipliers
Estimated hours = Turns * 0.5 (30 min avg per turn)
Price = Hours * Hourly rate
```

Adjust after each project based on actual effort.

---

## Scope Changes Log

| Date | Change | Impact (turns) | Approved by |
|------|--------|---------------|-------------|
| {{date}} | {{what changed}} | +{{N}} turns | {{client name}} |

---

## Retrospective

**What went well**: {{fill after project completion}}

**What was harder than expected**: {{fill after project completion}}

**What to do differently next time**: {{fill after project completion}}

**Update general SKILL.md with**: {{any new patterns discovered}}

**New domain skill needed?**: {{yes/no — if yes, run extraction process}}

---

*Generated from project-tracker template v1.0*
