# Roadmap: Cosmology Group Website (UBA / FCEN)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-04-18)
- ✅ **v1.1 arXiv + InspireHEP Sync** — Phases 7–12 (shipped 2026-04-19)

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
