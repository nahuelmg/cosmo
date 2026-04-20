# Requirements: Cosmology Group Website — v1.3

**Defined:** 2026-04-20
**Milestone:** ORCID Sync & Cross-Source Dedup
**Core Value:** A credible, professional academic presence where group members can update content (people, publications, journal club, outreach) without touching code.

**Scope trigger:** Tomas Ferreira Chase's 2020 SiPM paper (DOI `10.1016/j.nima.2020.164490`) is visible on ORCID but absent from `/publications` because neither InspireHEP nor arXiv indexes it. v1.1 sync covers HEP papers well; non-HEP author-curated papers need ORCID as a 3rd source. v1.1 locked decision "Intra-source arXiv-ID dedup only (no cross-source)" is being revisited per PROJECT.md Key Decisions row.

## v1.3 Requirements

### ORCID Fetcher

- [x] **ORCID-01**: `scripts/sync-publications.ts` fetches works from `https://pub.orcid.org/v3.0/{orcid}/works` for every person in `content/people.json` with `orcid_id` set
- [x] **ORCID-02**: ORCID fetch reuses the existing `fetchWithRetry` wrapper: `AbortSignal.timeout(10_000)`, `User-Agent` header, exponential backoff on HTTP 429 (2s → 4s → 8s, capped 30s)
- [x] **ORCID-03**: ORCID HTTP 404 produces a warning (`ORCID profile not public or empty: {orcid}`) and returns `[]`, mirroring existing arXiv 404 behaviour
- [x] **ORCID-04**: ORCID works filtered to `type ∈ {"journal-article", "conference-paper"}`; datasets, software, posters, talks, and other work types are dropped
- [x] **ORCID-05**: ORCID entry extraction: `id` preferred from DOI, then arXiv ID, then `orcid-{put-code}`; title from `work-summary.title.title.value`; year from `work-summary.publication-date.year.value`; journal from `work-summary.journal-title.value` or `"Preprint"`; DOI from `external-ids.external-id[type=doi].value`; arXiv ID from `external-ids.external-id[type=arxiv].value` when present
- [x] **ORCID-06**: For every ORCID-only entry (no DOI match to an InspireHEP or arXiv entry), `sync-publications.ts` fetches `/v3.0/{orcid}/work/{put-code}` to populate the full author list from `contributors.contributor[].credit-name.value`
- [x] **ORCID-07**: ORCID fetches reuse the existing `runBatched` concurrency pattern (≤5 in flight, 2s batch pause) — no separate rate-limit scheme

### Cross-Source DOI Dedup

- [x] **DEDUP-01**: Cross-source dedup runs after intra-source dedup (arXiv-ID), keyed on DOI
- [x] **DEDUP-02**: When the same DOI appears in more than one source, precedence is **InspireHEP > ORCID > arXiv**; the winning entry's metadata is kept, losing entries are dropped
- [x] **DEDUP-03**: DOIs are normalised before comparison: lowercased, any `https://doi.org/` or `http://dx.doi.org/` prefix stripped, leading/trailing whitespace trimmed
- [x] **DEDUP-04**: Entries without a DOI fall through to the existing arXiv-ID dedup pass; entries with neither DOI nor arXiv ID use the `id` field for dedup
- [x] **DEDUP-05**: `_meta.counts` gains a `deduped` field reporting how many duplicate entries were dropped by cross-source DOI dedup in the current run

### Schema & _meta

- [x] **SCHEMA-01**: `PublicationSchema.source` enum extended from `"manual" | "inspirehep" | "arxiv"` to `"manual" | "inspirehep" | "arxiv" | "orcid"`; existing v1.1 `content/publications.json` entries parse unchanged
- [x] **SCHEMA-02**: `content/publications.schema.json` regenerated so VS Code IntelliSense reflects the new enum value
- [x] **SCHEMA-03**: `PublicationsMeta.sources` accepts `"orcid"` as a valid value (extend `sourcesSchema` in `src/content/schemas/publications.schema.ts`)
- [x] **SCHEMA-04**: `PublicationsMeta.counts` includes an `orcid` field alongside `inspirehep`, `arxiv`, `manual`

### CLI & CI

- [x] **CLI-01**: `pnpm sync-publications` accepts a `--no-orcid` flag that skips ORCID fetches entirely, mirroring `--no-inspire` and `--no-arxiv`
- [x] **CLI-02**: All-sources-skipped guard extended: if `--no-arxiv --no-inspire --no-orcid` are all passed, the script exits 1 with the existing "No sources enabled" error
- [x] **CLI-03**: Per-member progress line includes an ORCID cell: `{slug} — InspireHEP: N, arXiv: N, ORCID: N`
- [x] **CLI-04**: SYNC-15 final summary line extended to include the `deduped` count from DEDUP-05 (e.g. `Sync complete: 321 publications (3 added, 0 removed, 318 unchanged, 7 deduped, 0 warnings)`)
- [x] **CI-01**: `.github/workflows/sync-publications.yml` runs all three sources by default; `jq -cS '.publications'` payload diff-guard continues to suppress spurious commits

### Display Layer

- [ ] **UI-01**: `/publications` SourceFilter pill set includes `orcid` alongside `inspirehep` and `arxiv`; selecting the ORCID pill shows only ORCID-sourced entries
- [ ] **UI-02**: Publication entry source badge renders ORCID entries with an `ORCID` label visually distinct from `InspireHEP` and `arXiv` badges (same component, new source variant)
- [ ] **UI-03**: Bilingual UI strings added to `messages/es.json` and `messages/en.json`: `publications.source.orcid` and any ORCID-specific helper copy (filter label, badge tooltip)
- [ ] **UI-04**: `/publications` footnote updated from "two sources" wording to three-source wording in both locales (and reflects the new DOI precedence rule in plain language)
- [ ] **UI-05**: Schema.org `ScholarlyArticle` JSON-LD on `/people/[slug]` continues to emit correctly for ORCID-only entries — DOI, title, authors, year all present; Schema.org shape unchanged

### Docs & Verification

- [ ] **DOC-01**: `content/SYNC.md` extended with: ORCID works API endpoint, ORCID profile setup guidance for members, DOI-dedup precedence rule (InspireHEP > ORCID > arXiv), three-source `_meta` example, ORCID troubleshooting section
- [ ] **VERIFY-01**: After first post-deploy sync run, Tomas Ferreira Chase's 2020 SiPM paper (`10.1016/j.nima.2020.164490`) appears on `/people/tomas-ferreira-chase` with its full author list (not just his name)

## Future (deferred)

### NASA ADS API integration (SYNC-DEFER-02)

- **ADS-01**: NASA ADS API as 4th source — HEP-adjacent astrophysics coverage
- **ADS-02**: ADS API key management via GitHub Secrets

### Operational (OPS-DEFER-01)

- **OPS-01**: Action failure notification (email or Slack) on sync workflow red

### v1.1 code cleanup

- **CLEAN-01**: Remove `publications_selected` Zod field from `people.schema.ts`
- **CLEAN-02**: Remove orphaned accessor exports (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`)
- **CLEAN-03**: Remove dead `people.selectedPublications` i18n key from both locale files
- **CLEAN-04**: Update REQUIREMENTS.md PR-flow description to match direct-to-main push

### Post-v1.2 doc drift

- **DRIFT-01**: Amend MASTER.md Component Specs "Nav Link" for `text-lg` + `max-w-6xl` (commit `1cf9cf8`)
- **DRIFT-02**: Verify MASTER.md HeroCarousel recipe against `b3f697c` (tagline removed)

## Out of Scope

| Feature | Reason |
|---------|--------|
| NASA ADS API (4th source) | Still deferred — HEP cosmology largely covered by InspireHEP; ADS adds astrophysics breadth if later demanded |
| v1.1 code cleanup (orphaned accessors, dead i18n key, `publications_selected` field) | Unrelated to ORCID scope; deferred to a future cleanup-focused milestone |
| Post-v1.2 doc drift (NavLink text-lg, hero tagline) | Unrelated; deferred to a future polish/docs milestone |
| v1.0 production re-measurement (PERF-04/05, NAV-04, hero contrast) | Separate concern; deferred until a focused perf milestone |
| DATA-09/10 remaining 4 member IDs | Content task; not blocked by this milestone; do as a content PR anytime |
| ORCID work types beyond `journal-article` + `conference-paper` | `/publications` is for peer-reviewed output; datasets/software/posters are out of scope |
| Crossref DOI lookup fallback | Extra external dependency beyond what ORCID per-work detail gives; not needed to meet ORCID-06 |
| OPS-DEFER-01 (Action failure email/Slack alerts) | Unrelated to ORCID scope; deferred |
| Runtime ISR / on-demand revalidation | Architecture change; v2-scoped decision |
| Author-bold highlighting on member-authored papers (PUBS-12 softened v1.1) | User preference locked — do not re-add |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 16 | Complete |
| SCHEMA-02 | Phase 16 | Complete |
| SCHEMA-03 | Phase 16 | Complete |
| SCHEMA-04 | Phase 16 | Complete |
| DEDUP-01 | Phase 16 | Complete |
| DEDUP-02 | Phase 16 | Complete |
| DEDUP-03 | Phase 16 | Complete |
| DEDUP-04 | Phase 16 | Complete |
| DEDUP-05 | Phase 16 | Complete |
| CLI-01 | Phase 16 | Complete |
| CLI-02 | Phase 16 | Complete |
| CLI-03 | Phase 16 | Complete |
| CLI-04 | Phase 16 | Complete |
| CI-01 | Phase 16 | Complete |
| ORCID-01 | Phase 17 | Complete |
| ORCID-02 | Phase 17 | Complete |
| ORCID-03 | Phase 17 | Complete |
| ORCID-04 | Phase 17 | Complete |
| ORCID-05 | Phase 17 | Complete |
| ORCID-06 | Phase 17 | Complete |
| ORCID-07 | Phase 17 | Complete |
| UI-01 | Phase 18 | Pending |
| UI-02 | Phase 18 | Pending |
| UI-03 | Phase 18 | Pending |
| UI-04 | Phase 18 | Pending |
| UI-05 | Phase 18 | Pending |
| DOC-01 | Phase 19 | Pending |
| VERIFY-01 | Phase 19 | Pending |

**Coverage:**
- v1.3 requirements: 28 total (note: header previously said 27; recount from enumerated IDs gives 28)
- Mapped to phases: 28 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 — Phase 16 complete (SCHEMA-01..04, DEDUP-01..05, CLI-01..04, CI-01 marked Complete)*
