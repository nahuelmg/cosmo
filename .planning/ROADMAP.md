# Roadmap: Cosmology Group Website (UBA / FCEN)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-04-18) · archive: `milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 arXiv + InspireHEP Sync** — Phases 7–12 (shipped 2026-04-19) · archive: `milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 Aesthetic Polish** — Phases 13–15 (shipped 2026-04-20) · archive: `milestones/v1.2-ROADMAP.md`
- 🚧 **v1.3 ORCID Sync & Cross-Source Dedup** — Phases 16–19 (in progress)

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

<details>
<summary>✅ v1.2 Aesthetic Polish (Phases 13–15) — SHIPPED 2026-04-20</summary>

See `.planning/milestones/v1.2-ROADMAP.md` for full phase details.

### Phase 13: Design Tokens & Layout Rhythm
**Goal:** Type scale, page-container widths, and vertical rhythm reflect the audited polish targets — `--text-5xl` token exists, `--text-4xl` bumped to 36 px, page widths standardised, vertical spacing codified.
**Plans:** 4 — all complete

### Phase 14: Media Sizing
**Goal:** Member photos no longer dominate their pages — PersonCard caps at 240 px, PersonDetail hero reduced to 180 px, `sizes` attributes tuned so Next serves the correct srcset.
**Plans:** 3 — all complete

### Phase 15: Interactive Polish & Documentation
**Goal:** Every interactive element meets the 44×44 tap-target bar, all focus rings unify on `accent-ring`, subtle motion added, and design-system docs reflect the v1.2 deltas.
**Plans:** 6 — all complete

</details>

---

## v1.3 ORCID Sync & Cross-Source Dedup (Phases 16–19)

**Milestone goal:** Add ORCID works API as a third publication source, dedup across all three sources by DOI, and surface `orcid` as a first-class source in the UI — so papers that are author-curated on ORCID but absent from InspireHEP and arXiv (e.g. the 2020 SiPM paper) appear on `/publications` and individual person pages.

### Phase 16: Schema & Sync Infrastructure

**Goal:** The codebase accepts `"orcid"` as a valid publication source and the sync pipeline has the DOI-based dedup logic, extended CLI flags, and CI wiring needed to run all three sources — before a single ORCID API call is made.

**Depends on:** Phase 15 (v1.2 complete)

**Requirements:** SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, DEDUP-01, DEDUP-02, DEDUP-03, DEDUP-04, DEDUP-05, CLI-01, CLI-02, CLI-03, CLI-04, CI-01

**Success Criteria** (what must be TRUE when Phase 16 completes):
1. `pnpm tsc --noEmit` and `pnpm build` pass cleanly after the schema enum is extended — existing `content/publications.json` entries (`"manual"`, `"inspirehep"`, `"arxiv"`) parse without error; a synthetic `{ "source": "orcid" }` entry also passes Zod validation.
2. Running `pnpm sync-publications --no-orcid` with the two existing sources enabled exits cleanly and writes valid JSON; running `--no-arxiv --no-inspire --no-orcid` exits 1 with "No sources enabled".
3. The per-member progress line printed during a sync run includes an ORCID cell: `{slug} — InspireHEP: N, arXiv: N, ORCID: N`; the final summary line includes a `deduped` count.
4. A unit test (or manual dry-run) demonstrates that when two entries share the same normalized DOI, the one with higher-precedence source (InspireHEP > ORCID > arXiv) survives and the duplicate is dropped, with `_meta.counts.deduped` reflecting the drop count.
5. `.github/workflows/sync-publications.yml` runs all three sources by default (the ORCID fetch function is a stub at this point; the workflow flag wiring is real).

**Plans:** 3 plans

Plans:
- [x] 16-01-schema-extension-PLAN.md — Extend Zod schema for `"orcid"` source + `orcid`/`deduped` counts, regenerate JSON schema, patch `content/publications.json`
- [x] 16-02-ci-workflow-audit-PLAN.md — Add CI-01 traceability comment to `.github/workflows/sync-publications.yml`
- [x] 16-03-sync-pipeline-PLAN.md — `--no-orcid` flag, `fetchOrcid` stub, `normalizeDoi` + `dedupByDoi`, pipeline rewire, progress/summary/_meta updates, Vitest coverage

### Phase 17: ORCID Fetcher

**Goal:** `sync-publications.ts` fetches real ORCID works for every person with `orcid_id` set, filters to `journal-article` + `conference-paper`, extracts per-work metadata, fetches full author lists for ORCID-only entries, and produces `source: "orcid"` Publication objects that flow through the Phase 16 dedup pipeline into `content/publications.json`.

**Depends on:** Phase 16 (schema `"orcid"`-aware; dedup + CLI wiring live)

**Requirements:** ORCID-01, ORCID-02, ORCID-03, ORCID-04, ORCID-05, ORCID-06, ORCID-07

**Success Criteria** (what must be TRUE when Phase 17 completes):
1. Running `pnpm sync-publications` against the live repo writes `content/publications.json` that includes at least one entry with `"source": "orcid"` — confirming real API data flows end-to-end through fetch → extract → dedup → write-gate.
2. Tomas Ferreira Chase's SiPM paper (`10.1016/j.nima.2020.164490`) appears in `content/publications.json` with `source: "orcid"`, a full author list (not just his name), and the correct year, title, and journal string — confirming ORCID-06 per-work detail fetch works.
3. Running `pnpm sync-publications --no-orcid` produces output identical to the pre-v1.3 sync (no ORCID entries, no `"orcid"` in `_meta.sources`) — confirming the flag correctly skips all ORCID fetches.
4. When the ORCID API returns 404 for a person, the script emits a warning and continues rather than aborting — `content/publications.json` is still written with the remaining sources' data.

**Plans:** 3 plans

Plans:
- [x] 17-01-fixtures-and-503-retry-PLAN.md — Copy ORCID fixtures into `scripts/fixtures/`; extend `fetchWithRetry` to retry on HTTP 503 (ORCID burst-exceed) in addition to 429
- [x] 17-02-fetch-orcid-and-extraction-PLAN.md — Real `fetchOrcid` + `orcidGroupToPublication` (ORCID-01..05, -07); group-level external-ids union extraction; side-map lookup; unit tests + fixture SiPM extraction
- [x] 17-03-author-enrichment-and-verify-PLAN.md — `fetchOrcidWorkDetail` + `enrichOrcidAuthors` post-dedup pass (ORCID-06); unit tests with SiPM detail fixture; live three-source sync run; commit updated `content/publications.json`

### Phase 18: Display Layer

**Goal:** `/publications` treats ORCID entries as a first-class source — the filter pill, source badge, bilingual labels, footnote wording, and Schema.org JSON-LD all cover the `"orcid"` source with parity to `"inspirehep"` and `"arxiv"`.

**Depends on:** Phase 17 (real ORCID entries in `content/publications.json`)

**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05

**Success Criteria** (what must be TRUE when Phase 18 completes):
1. On `/publications` (both `/es/publicaciones` and `/en/publications`), an "ORCID" filter pill appears in the SourceFilter group; clicking it shows only ORCID-sourced entries and the pill renders as active (`aria-pressed="true"`).
2. Each ORCID publication entry on `/publications` displays a source badge labeled "ORCID" (visually distinct from "InspireHEP" and "arXiv" badges) that uses the same component with a new source variant — no new badge component.
3. The footnote below the publication list reads as a three-source description in both Spanish and English, and includes a plain-language note about the DOI precedence rule.
4. On `/people/tomas-ferreira-chase`, the SiPM paper appears in the "Publicaciones recientes" section with its full author list, rendered identically in structure to InspireHEP- and arXiv-sourced papers (DOI link, year, journal string).

### Phase 19: Docs & Verification

**Goal:** `content/SYNC.md` fully documents the three-source model so a maintainer can configure ORCID IDs, understand dedup behaviour, and troubleshoot sync failures — and a post-deploy sync confirms the SiPM paper is live on the deployed site.

**Depends on:** Phase 18 (display layer complete and ORCID entries visible)

**Requirements:** DOC-01, VERIFY-01

**Success Criteria** (what must be TRUE when Phase 19 completes):
1. `content/SYNC.md` contains: (a) the ORCID works API endpoint and how it's queried, (b) step-by-step guidance for a member to find and add their ORCID iD to `content/people.json`, (c) an explicit table or paragraph stating the DOI precedence rule (InspireHEP > ORCID > arXiv), (d) a three-source `_meta` JSON example, and (e) an ORCID troubleshooting section covering 404 / private profile / missing work types.
2. After the first post-deploy `workflow_dispatch` sync run completes, Tomas Ferreira Chase's SiPM paper (`10.1016/j.nima.2020.164490`) is visible on the live `/people/tomas-ferreira-chase` page with title, year, journal, and full author list — confirming the end-to-end ORCID pipeline works in production.

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
| 14. Media Sizing | v1.2 | 3/3 | Complete | 2026-04-20 |
| 15. Interactive Polish & Documentation | v1.2 | 6/6 | Complete | 2026-04-20 |
| 16. Schema & Sync Infrastructure | v1.3 | 3/3 | Complete | 2026-04-20 |
| 17. ORCID Fetcher | v1.3 | 3/3 | Complete | 2026-04-20 |
| 18. Display Layer | v1.3 | — | Not started | — |
| 19. Docs & Verification | v1.3 | — | Not started | — |
