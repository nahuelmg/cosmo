# Roadmap: Cosmology Group Website (UBA / FCEN)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-04-18)
- 🚧 **v1.1 arXiv + InspireHEP Sync** — Phases 7–11 (in progress)

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

---

### 🚧 v1.1 arXiv + InspireHEP Sync (Phases 7–11)

**Milestone Goal:** Auto-populate publications from InspireHEP + arXiv for each current PI, postdoc, and PhD, refreshed weekly at build time — replacing v1.0's manual `content/publications.json` while preserving the fully-static SSG guarantee (PERF-01).

**Locked decisions:**
- Build-time GitHub Action (weekly cron) — no runtime ISR
- Sources: InspireHEP (BAI) + arXiv (claimed author ID) — entries source-tagged, no cross-source DOI dedup
- Author linkage: explicit `arxiv_id` + `inspirehep_id` in `content/people.json`
- Failure mode: last-good JSON preserved on any upstream failure
- Profile display: last-10-years window on `/people/[slug]`; full archive on `/publications`

---

#### Phase 7: Schema Extension

**Goal:** The Zod schemas for Publication and Person are extended atomically — existing v1.0 JSON parses without modification, and maintainers can safely add `arxiv_id` / `inspirehep_id` to `people.json`.

**Depends on:** Phase 6 (v1.0 shipped)

**Requirements:** SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, DATA-09, DATA-10

**Note on DATA-09 / DATA-10:** These are human-action prerequisites, not code tasks. The maintainer (PI or group admin) must look up each current member's InspireHEP BAI identifier and claimed arXiv author ID before Phase 9 can be tested end-to-end. This phase gates that action by making the schema safe to receive those fields.

**Success Criteria** (what must be TRUE when this phase completes):
1. `pnpm validate-content` passes on the existing v1.0 `content/publications.json` with no data changes — the `.default("manual")` guard holds
2. Adding `"inspirehep_id": "E.Calzetta.1"` to any entry in `content/people.json` passes VS Code schema validation and `pnpm validate-content` — no Zod strictObject rejection
3. A publication entry with an arXiv ID in the pre-2007 format (`gr-qc/9209007`) passes schema validation
4. `content/publications.schema.json` and `content/people.schema.json` are regenerated in the same commit as the schema code changes — VS Code IntelliSense reflects the new fields immediately
5. `PersonSchema.publications_selected` is marked `@deprecated` in JSDoc; the field still parses without error

**Plans:** 2 plans

Plans:
- [ ] 07-01-PLAN.md — Extend PublicationSchema (`source` enum + `.default("manual")` + pre-2007 arXiv regex in `shared.ts`) and PersonSchema (`inspirehep_id?`, `arxiv_id?`, required `display_name_normalized`); deprecate `publications_selected` via JSDoc; export `normalizeName` helper; regenerate all 5 JSON Schemas; create `content/SYNC.md` maintainer lookup guide
- [ ] 07-02-PLAN.md — Populate `content/people.json` — `display_name_normalized` on every entry; `inspirehep_id` (BAI) and `arxiv_id` (claimed author ID) on every current PI, postdoc, and PhD via maintainer checkpoint; run `pnpm validate-content` to confirm the updated JSON parses cleanly

---

#### Phase 8: Accessor

**Goal:** `getPublicationsByAuthor` exists in the content barrel and correctly filters publications by name variant and year window — the page component that will call it can be written against a stable, tested interface.

**Depends on:** Phase 7 (updated Publication type must be in place)

**Requirements:** ACC-01, ACC-02, ACC-03, ACC-04, ACC-05

**Success Criteria** (what must be TRUE when this phase completes):
1. `import { getPublicationsByAuthor } from "@/content"` compiles in strict TypeScript with no type errors
2. `getPublicationsByAuthor(["García", "garcia"], { lastNYears: 10 })` returns only entries where any author field contains a case-insensitive, NFC-normalized match to "García" or "garcia" AND whose year falls within the last 10 calendar years
3. The accessor file has zero imports from `src/content/people.ts` — circular dependency is structurally impossible
4. `getPublicationsByAuthor(["Someone"], {})` called with the full v1.0 publication list returns results (not an empty array caused by a missing `.default("manual")` source field)

**Plans:** 1 plan

Plans:
- [ ] 08-01-PLAN.md — Install Vitest + implement `getPublicationsByAuthor` in `src/content/accessors/publications.ts` using NFD-strip `normalizeName` + unit tests covering 4-char guard, diacritic fold, year window (incl. `lastNYears: 0`), pre-sort, non-mutation, ACC-04 barrel identity, ACC-05 no-people-import

---

#### Phase 9: Sync Script

**Goal:** `pnpm sync-publications` runs locally, queries InspireHEP and arXiv for all members with IDs populated, writes a valid `content/publications.json`, and exits non-zero without writing anything if any upstream request fails.

**Depends on:** Phase 7 (updated schema types for imports and validation), Phase 8 (accessor not strictly required but schema must be stable), DATA-09/DATA-10 populated (human action from Phase 7)

**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06, SYNC-07, SYNC-08, SYNC-09, SYNC-10, SYNC-11, SYNC-12, SYNC-13, SYNC-14, SYNC-15

**Success Criteria** (what must be TRUE when this phase completes):
1. `pnpm sync-publications` completes without error when run locally with real BAI IDs populated in `people.json`; `content/publications.json` is written with a valid `_meta.synced_at` ISO timestamp and `source`-tagged entries
2. Running the script a second time with identical upstream data produces a byte-for-byte identical `content/publications.json` — deterministic sort is confirmed
3. `pnpm validate-content` passes on the freshly written JSON without manual edits
4. A member with no `arxiv_id` produces a logged warning ("skipping arXiv for [name]: no arxiv_id") and is not searched by name — arXiv output is partial, not contaminated
5. Passing an `INSPIRE-00XXXXXX` numeric ID (wrong format) causes the script to exit 1 with a clear format-error message before any network requests are made

**Plans:** 3 plans

Plans:
- [ ] 09-01: Add `fast-xml-parser@^5.7.1` devDependency; add `sync-publications` script to `package.json`; scaffold `scripts/sync-publications.ts` with startup validation (BAI format check, people.json read), concurrency-limited InspireHEP queue, arXiv Atom fetch, `fast-xml-parser` config with `isArray` callback
- [ ] 09-02: Implement extraction layer — year from `publication_info[0].year` / `preprint_date` / arXiv `<published>`; NFC normalization; BibTeX markup strip; `source` tagging; intra-run dedup by arXiv ID; deterministic sort (year desc, arXiv ID alpha)
- [ ] 09-03: Implement write gate — `PublicationsSchema.safeParse()` in memory, write on success with `_meta` block, exit 1 without writing on failure; `AbortSignal.timeout(10_000)` on every request; pagination loop reading `hits.total`; summary log "X added, Y removed, Z unchanged"; local end-to-end test with real data

---

#### Phase 10: CI Wiring

**Goal:** A GitHub Actions workflow runs the sync script on a weekly Monday cron and on manual `workflow_dispatch`, commits `content/publications.json` only when the content changes, and surfaces per-run delta in the step summary — with no spurious Vercel rebuilds on identical data.

**Depends on:** Phase 9 (locally validated sync script — do not wire CI before the script is confirmed working)

**Requirements:** CI-01, CI-02, CI-03, CI-04, CI-05, CI-06, CI-07, CI-08

**Success Criteria** (what must be TRUE when this phase completes):
1. A manual `workflow_dispatch` run completes successfully and either commits an updated `content/publications.json` to `main` or logs "No changes — skipping commit" if data is identical
2. The Action step summary shows a per-run delta line ("X added, Y removed") or "No changes"
3. Running the workflow twice in succession with no upstream data change results in zero commits the second time — `git diff --quiet` guard confirmed
4. A Vercel deploy is triggered only when `content/publications.json` actually changes — confirmed by reviewing Vercel deploy history after two consecutive workflow runs

**Plans:** 1 plan

Plans:
- [ ] 10-01: Author `.github/workflows/sync-publications.yml` — cron `0 6 * * 1`, `workflow_dispatch`, `permissions: contents: write`, pnpm + Node 22 setup, `--frozen-lockfile`, sync script step, `pnpm validate-content` gate, `git diff --quiet` skip-commit guard, `[skip ci]` commit message, step summary reporting; run first manual `workflow_dispatch` to verify push lands on `main` (tests any branch-protection rules)

---

#### Phase 11: Display Layer

**Goal:** `/publications` renders the auto-populated archive with source badges, source filter, preprint indicators, staleness date, and author highlighting; `/people/[slug]` renders each member's last-10-years publication list with the same badges and indicators; all new UI strings are bilingual and translation-complete.

**Note:** Maintainer documentation (BAI lookup, arXiv ID claiming, `display_name_normalized` format) is owned by Phase 7's `content/SYNC.md`. Operational docs for the sync (CI triggers, troubleshooting failed crons) — if needed — will be added directly to README or a lightweight ops note, not duplicated here.

**Depends on:** Phase 8 (accessor for `/people/[slug]`), Phase 9 (sync produces valid output for realistic UI testing)

**Requirements:** PUBS-05, PUBS-06, PUBS-07, PUBS-08, PUBS-09, PUBS-10, PUBS-11, PUBS-12, PEOP-13, PEOP-14, PEOP-15, PEOP-16, PEOP-17, PEOP-18, I18N-08, I18N-09

**Success Criteria** (what must be TRUE when this phase completes):
1. `/publications` loads with publications grouped by year, newest-first; each entry shows a source pill ("InspireHEP" / "arXiv" / "Manual"), a preprint-vs-published indicator, and an author list formatted as full list if ≤5 authors or "First, Second, Third et al." if >5
2. The source filter toggle ("Todos / InspireHEP / arXiv / Manual") narrows the visible entries in-browser without a page reload; selecting "Todos" restores the full list
3. The "Actualizado el [date]" staleness indicator renders the date from `_meta.synced_at`; the bilingual two-source footnote appears below the list in both locales
4. A group member's name in any publication author list is rendered in bold; non-member names are rendered in normal weight
5. `/people/[slug]` for a current PI, postdoc, or PhD shows a "Publications" section listing their last-10-years output with count subtitle ("N publicaciones en los últimos 10 años" / "N publications in the last 10 years"); the old `publications_selected` list is gone
6. `pnpm check-translations` passes with 0 key drift — all new UI strings present in both `messages/es.json` and `messages/en.json`

**Plans:** 3 plans

Plans:
- [ ] 11-01: Shared publication entry component — source badge pill, preprint/published indicator, author list formatting (≤5 full / >5 et al.), author highlighting via `display_name_normalized` matching; add all new i18n keys to `messages/es.json` + `messages/en.json`
- [ ] 11-02: `/publications` page updates — flip data source to synced JSON, wire source filter toggle, render staleness indicator from `_meta.synced_at`, add bilingual two-source footnote; `pnpm check-translations` passes
- [ ] 11-03: `/people/[slug]` publications section — call `getPublicationsByAuthor(nameVariants, { lastNYears: 10 })`, render count subtitle, reuse shared entry component, remove `publications_selected` render path; verify PEOP-17 (past members unchanged); final `pnpm build` + `pnpm check-translations` verification

---

## Progress

**Execution Order:** 7 → 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-04-17 |
| 2. Content Layer | v1.0 | 5/5 | Complete | 2026-04-17 |
| 3. Layout Shell | v1.0 | 5/5 | Complete | 2026-04-17 |
| 4. Core Pages | v1.0 | 8/8 | Complete | 2026-04-18 |
| 5. SEO & Discoverability | v1.0 | 5/5 | Complete | 2026-04-18 |
| 6. Polish (A11y & Perf) | v1.0 | 4/4 | Complete | 2026-04-18 |
| 7. Schema Extension | v1.1 | 2/2 | Complete | 2026-04-18 |
| 8. Accessor | v1.1 | 0/1 | Not started | - |
| 9. Sync Script | v1.1 | 0/3 | Not started | - |
| 10. CI Wiring | v1.1 | 0/1 | Not started | - |
| 11. Display Layer | v1.1 | 0/3 | Not started | - |
