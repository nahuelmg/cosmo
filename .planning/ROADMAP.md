# Roadmap: Cosmology Group Website (UBA / FCEN)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-04-18)
- ✅ **v1.1 arXiv + InspireHEP Sync** — Phases 7–12 (shipped 2026-04-19)
- 🔨 **v1.2 Aesthetic Polish** — Phases 13–15 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-04-18</summary>

See `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

### Phase 1: Foundation
**Goal:** The project boots end-to-end as a bilingual Next.js app with a locked design system and i18n routing.
**Plans:** 4 — all complete

### Phase 2: Content Layer
**Goal:** All content types have Zod schemas and placeholder JSON files that pages can consume through typed accessors; the build fails loudly on malformed content.
**Plans:** 5 — all complete

### Phase 3: Layout Shell
**Goal:** Every page inherits a header with a working language toggle, a footer with institutional identity, and shared chrome — ready to wrap core pages.
**Plans:** 5 — all complete

### Phase 4: Core Pages
**Goal:** All seven top-level pages (plus People detail pages) render real placeholder content end-to-end in both locales.
**Plans:** 8 — all complete

### Phase 5: SEO & Discoverability
**Goal:** The site is fully indexable in both locales with correct canonicals, hreflang alternates, Schema.org structured data, OG / Twitter cards, sitemap, and robots.
**Plans:** 5 — all complete

### Phase 6: Polish (A11y & Performance)
**Goal:** The site meets WCAG AA and Core Web Vitals targets across all pages in both locales — ready to ship to Vercel.
**Plans:** 4 — all complete

</details>

<details>
<summary>✅ v1.1 arXiv + InspireHEP Sync (Phases 7–12) — SHIPPED 2026-04-19</summary>

See `.planning/milestones/v1.1-ROADMAP.md` for full phase details.

### Phase 7: Schema Extension
**Goal:** Zod schemas for Publication and Person extended atomically; existing v1.0 JSON parses without modification.
**Plans:** 2 — all complete

### Phase 8: Accessor
**Goal:** `getPublicationsByAuthor` in the content barrel, filtering by name variant + year window.
**Plans:** 1 — all complete

### Phase 9: Sync Script
**Goal:** `pnpm sync-publications` queries InspireHEP + arXiv, writes valid `content/publications.json`, preserves last-good on upstream failure.
**Plans:** 3 — all complete

### Phase 10: CI Wiring
**Goal:** GitHub Actions workflow runs sync on weekly Monday cron + manual dispatch; `jq` payload diff-guard prevents spurious commits.
**Plans:** 1 — all complete

### Phase 11: Display Layer
**Goal:** `/publications` and `/people/[slug]` render synced data with source badges, staleness line, filter, member-visible author truncation; all bilingual.
**Plans:** 3 — all complete

### Phase 12: v1.1 Polish & Docs (Gap Closure)
**Goal:** Close audit tech debt — DOC-01/02 shipped, DATA-09/10 lifted to 9/13, lint carryovers + placeholders purged, Leizerovich rename, Scannapieco typo fix.
**Plans:** 3 — all complete

</details>

---

## v1.2 Aesthetic Polish (Phases 13–15)

### Phase 13: Design Tokens & Layout Rhythm
**Goal:** The type scale, page-container widths, and vertical rhythm reflect the audited polish targets — `text-5xl` token exists, `text-4xl` bumped to 36 px, page widths standardised, vertical spacing codified. All other v1.2 phases depend on these tokens.
**Requirements:** TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-05, SPACE-01, SPACE-02, SPACE-03, SPACE-04
**Plans:** 4 plans in 3 waves — all complete
Plans:
- [x] 13-01-PLAN.md — globals.css `@theme` token update (`--text-4xl` → 2.25rem, add `--text-5xl`) + `@layer base` h1 leading-tight
- [x] 13-02-PLAN.md — H1 responsive migration + container widths (SPACE-01) + nav sizing consolidation (TYPO-03/04, SPACE-01/02)
- [x] 13-03-PLAN.md — ResearchCard padding `p-8` → `p-6` + audit PersonCard/OutreachCard/SessionRow (SPACE-03)
- [x] 13-04-PLAN.md — MASTER.md documentation of v1.2 type scale + Layout section (TYPO-05, SPACE-04)
**Success criteria:**
1. `--text-5xl` token is defined and H1 elements use the new 36 px size
2. Every page wrapper uses `max-w-5xl` (prose) or `max-w-6xl` (grids) per the codified rule
3. Every section / page wrapper uses `py-12` / `py-16` per the codified rhythm
4. `pnpm build` passes; visually, heading hierarchy reads distinctly on People / Research / Contact

### Phase 14: Media Sizing
**Goal:** Member photos no longer dominate their pages — `PersonCard` cards cap at ≤ 280 px wide, `PersonDetail` hero photo reduced to 180–200 px, `next/image` `sizes` attributes updated so Next serves the correct srcset.
**Requirements:** MEDIA-01, MEDIA-02, MEDIA-03, MEDIA-04, MEDIA-05
**Plans:** 3 plans in 2 waves
Plans:
- [ ] 14-01-PLAN.md — PersonCard resize to max-w-[240px] + aspect-[4/5] + PeopleSection xl:grid-cols-4 + sizes="(min-width: 640px) 240px, 100vw" (MEDIA-01, MEDIA-05 PersonCard)
- [ ] 14-02-PLAN.md — PersonDetail hero resize to 180 px + aspect-[4/5] + mobile cap + sizes="(min-width: 768px) 180px, 180px" (preserves LCP preload triple) (MEDIA-02, MEDIA-05 PersonDetail)
- [ ] 14-03-PLAN.md — HeroCarousel + OutreachCard + homepage imagery audit at 5 viewports + axe/CLS/srcset regression sweep (MEDIA-03, MEDIA-04)
**Success criteria:**
1. `/people` renders `PersonCard` at ≤ 280 px card width on `lg+` (visual check + CSS inspection)
2. `/people/[slug]` hero photo renders at 180–200 px on desktop
3. No layout shift introduced; Hero carousel and outreach imagery verified at 375 / 768 / 1024 / 1440 px
4. Next.js image srcset loads appropriate sizes (no oversized downloads)

### Phase 15: Interactive Polish & Documentation
**Goal:** Every interactive element meets the 44 × 44 tap-target bar, all focus rings unify on `accent-ring`, subtle motion is added where it clarifies state, and the design system docs reflect the v1.2 token + component deltas.
**Requirements:** BTN-01, BTN-02, BTN-03, BTN-04, BTN-05, BTN-06, MICRO-01, MICRO-02, MICRO-03, MICRO-04, MICRO-05, DOC-01, DOC-02
**Success criteria:**
1. Every interactive element (buttons, nav links, pills, dots) has an effective ≥ 44 × 44 tap area
2. Every `focus-visible:ring-*` uses `ring-accent-ring` (grep confirms zero `ring-surface/70` or stray variants)
3. `pnpm axe` reports zero violations on all 8 Spanish pages
4. `design-system/cosmology-group-uba/MASTER.md` + OVERRIDES.md reflect v1.2 adjustments

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-04-17 |
| 2. Content Layer | v1.0 | 5/5 | Complete | 2026-04-17 |
| 3. Layout Shell | v1.0 | 5/5 | Complete | 2026-04-17 |
| 4. Core Pages | v1.0 | 8/8 | Complete | 2026-04-18 |
| 5. SEO & Discoverability | v1.0 | 5/5 | Complete | 2026-04-18 |
| 6. Polish (A11y & Perf) | v1.0 | 4/4 | Complete | 2026-04-18 |
| 7. Schema Extension | v1.1 | 2/2 | Complete | 2026-04-18 |
| 8. Accessor | v1.1 | 1/1 | Complete | 2026-04-19 |
| 9. Sync Script | v1.1 | 3/3 | Complete | 2026-04-19 |
| 10. CI Wiring | v1.1 | 1/1 | Complete | 2026-04-19 |
| 11. Display Layer | v1.1 | 3/3 | Complete | 2026-04-19 |
| 12. Polish & Docs | v1.1 | 3/3 | Complete | 2026-04-19 |
| 13. Design Tokens & Layout Rhythm | v1.2 | 4/4 | Complete | 2026-04-19 |
| 14. Media Sizing | v1.2 | 0/3 | Not started | — |
| 15. Interactive Polish & Documentation | v1.2 | 0/TBD | Not started | — |
