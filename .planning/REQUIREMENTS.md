# Requirements: v1.1 — arXiv + InspireHEP Publication Sync

**Defined:** 2026-04-18
**Milestone goal:** Auto-populate publications from InspireHEP + arXiv for each current PI, postdoc, and PhD, refreshed weekly at build time, while preserving v1.0's fully-static SSG guarantee.

**Locked decisions (from milestone kickoff):**
- Sync mode: build-time GitHub Action (weekly cron) — no runtime ISR
- Sources: InspireHEP + arXiv, entries source-tagged, no cross-source DOI dedup
- Author linkage: explicit `arxiv_id` + `inspirehep_id` fields in `content/people.json`; no ORCID, no name-heuristic matching
- Failure mode: fall back to last-good `content/publications.json` (do not commit on failure)
- Profile display: `/people/[slug]` shows last-10-years subset filtered by author match
- Scope: current members only (PIs / postdocs / PhDs)
- Differentiator shipped: author highlighting (bold group members) on `/publications`
- Differentiators deferred: per-person exclude list, "View on InspireHEP/arXiv" profile links, Action failure notifications

---

## v1.1 Requirements

### Schema Extension (atomic prerequisite)

- [x] **SCHEMA-01**: `PublicationSchema` extended with `source: z.enum(["manual", "inspirehep", "arxiv"]).default("manual")` — existing v1.0 entries parse without modification
- [x] **SCHEMA-02**: `PublicationSchema` arxiv ID regex accepts both modern (`2306.12345`) and pre-2007 (`gr-qc/9209007`) formats
- [x] **SCHEMA-03**: `PersonSchema` extended with top-level optional `orcid_id?: string` (portable author identifier; superseded `arxiv_id` after real-data check — arXiv author-page slugs unavailable) and `inspirehep_id?: string` (BAI format, widened regex accepts multi-segment names like `Tomas.F.Chase.1`)
- [x] **SCHEMA-04**: `PersonSchema.publications_selected` marked `@deprecated` via JSDoc; field still tolerated; sync script logs warning if populated
- [x] **SCHEMA-05**: `content/publications.schema.json` + `content/people.schema.json` regenerated from Zod (`pnpm generate-schemas`) in the same commit as schema changes
- [x] **SCHEMA-06**: `pnpm validate-content` passes on existing v1.0 JSON content with no data changes

### Content Data (human dependency)

- [~] **DATA-09**: `content/people.json` populated with `inspirehep_id` (BAI format) — partial: 9 of 13 sync-scoped current members (esteban-calzetta, diana-lopez-nacir, susana-landau, cecilia-scannapieco, nahuel-miron-granese, javier-badia, tomas-ferreira-chase, matias-leizerovich, augusto-chantada); 4 remaining (juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia) tracked in 12-02-SUMMARY as follow-up data commit. Sync scope = categories pi/postdoc/phd per Phase 9 decision; 2 undergrads (javier-pineau, tomas-cicarella) intentionally excluded.
- [~] **DATA-10**: `content/people.json` populated with `orcid_id` (reconceived from arxiv_id) — partial: 9 of 13 sync-scoped current members; same coverage schedule and remaining-slug list as DATA-09.

### Accessor (helper library)

- [x] **ACC-01**: `getPublicationsByAuthor(nameVariants: string[], options?: { lastNYears?: number }): Publication[]` lives in `src/content/accessors/publications.ts`
- [x] **ACC-02**: Accessor filters publications where any author name matches any `nameVariants` string (case-insensitive, diacritic-normalized via NFD-strip)
- [x] **ACC-03**: `lastNYears` option cuts results to the last N calendar years counted from `new Date().getFullYear()`
- [x] **ACC-04**: Accessor re-exported from `src/content/index.ts` barrel (24-symbol surface)
- [x] **ACC-05**: Accessor has no imports from `people.ts` (avoids circular dependency)

### Sync Script

- [x] **SYNC-01**: `scripts/sync-publications.ts` runnable via `pnpm exec tsx scripts/sync-publications.ts` and `pnpm sync-publications`
- [x] **SYNC-02**: `fast-xml-parser@^5.7.1` added as devDependency with `isArray` callback for arXiv Atom `entry` / `author` / `link` / `category` nodes
- [x] **SYNC-03**: Script fetches InspireHEP literature per `inspirehep_id` with concurrency-limited queue (max 5 parallel), 2s inter-batch pause, exponential backoff on HTTP 429
- [x] **SYNC-04**: Script reads `hits.total` from first InspireHEP response and paginates until complete (or configured cap); logs "fetched X of Y total" per author
- [x] **SYNC-05**: Script fetches arXiv for `arxiv_id`-populated members only; skips and logs warning when `arxiv_id` missing (never falls back to name-based `au:` search)
- [x] **SYNC-06**: Script validates `inspirehep_id` values match the BAI format at startup; exits with clear error on `INSPIRE-00...` numeric IDs
- [x] **SYNC-07**: Script extracts publication year from InspireHEP `publication_info[0].year` with fallback to `preprint_date` year; from arXiv `<published>` (version 1) date
- [x] **SYNC-08**: Script normalizes author strings with `.normalize("NFC")`; strips BibTeX markup from titles (curly braces, LaTeX escapes)
- [x] **SYNC-09**: Script performs intra-run dedup by arXiv ID within each source (prevents Planck/Euclid papers appearing once per co-authoring member)
- [x] **SYNC-10**: Script sorts publications deterministically (year desc, then arxiv ID alpha) before serialization
- [x] **SYNC-11**: Script validates the full result with `PublicationsSchema.safeParse()` in memory before writing; exits non-zero without writing on any failure
- [x] **SYNC-12**: Script writes `content/publications.json` with `_meta: { synced_at: ISO8601, status: "ok" }` block and 2-space indentation
- [x] **SYNC-13**: Script tags each entry with the appropriate `source: "inspirehep" | "arxiv"`; entries remain source-tagged (no cross-source dedup)
- [x] **SYNC-14**: Every request uses `AbortSignal.timeout(10_000)`; script exits non-zero and preserves last-good JSON if any upstream request fails
- [x] **SYNC-15**: Script emits a summary line "X added, Y removed, Z unchanged" suitable for GitHub Action step output

### GitHub Action (CI automation)

- [x] **CI-01**: `.github/workflows/sync-publications.yml` scheduled at `0 6 * * 1` (Monday 06:00 UTC) with `workflow_dispatch` for manual runs
- [x] **CI-02**: Workflow declares `permissions: contents: write`
- [x] **CI-03**: Workflow sets up pnpm (`pnpm/action-setup@v4`) and Node 20, installs with `--frozen-lockfile`, runs the sync script (versions pinned to project's `.nvmrc` / `engines.node` and widest-adopted stable action tag; original spec said `v5` / Node 22 before the project pinned Node 20)
- [x] **CI-04**: Workflow runs `pnpm validate-content` after sync writes JSON, as an independent second-gate validation (package.json uses `validate-content`; original spec said `check-content`, which has never existed)
- [x] **CI-05**: Workflow uses a payload-aware diff check over `content/publications.json` (`jq -cS '.publications'` comparison against `HEAD` + `git checkout HEAD -- ...` if unchanged) to skip the commit on identical publications data — ignores `_meta.synced_at` byte drift that made a plain `git diff --quiet` always report changes
- [x] **CI-06**: Workflow commits with message including `[skip ci]` (prevents the push from triggering a second workflow run)
- [x] **CI-07**: Workflow step summary reports per-run delta ("X added, Y removed") or "No changes"; sync failures leave `content/publications.json` untouched
- [x] **CI-08**: Manual `workflow_dispatch` verified to push successfully — covers any branch-protection rule on `main` (adjust permissions or add `github-actions[bot]` bypass if blocked)

### Publications Page (/publications)

- [x] **PUBS-05**: `/publications` renders the synced archive grouped by year, newest first (existing v1.0 UI preserved; data source flipped from hand-curated to synced)
- [x] **PUBS-06**: Each entry renders a source badge ("InspireHEP" / "arXiv" / "Manual") — small pill, text-xs, accessible
- [x] **PUBS-07**: Source filter toggle ("Todos / InspireHEP / arXiv / Manual") filters the page in-browser — no URL state persistence (PUBS-04 still deferred)
- [x] **PUBS-08**: Preprint vs published indicator per entry (semantic signal `pub.journal === "Preprint"`; consistent with sync-script fallback)
- [x] **PUBS-09**: "Actualizado el [date]" staleness indicator rendered from `_meta.synced_at` with locale-aware `Intl.DateTimeFormat`
- [x] **PUBS-10**: Footnote (bilingual) explains two-source design and why duplicates may appear for the same paper
- [x] **PUBS-11**: Author list formatted as: full list if ≤5 authors; first 3 + "et al." if >5 — with member-visible invariant (extend head-through-member when a highlighted author falls past position 3)
- [~] **PUBS-12**: Member-author bold highlighting DROPPED per user feedback in Phase 12 polish — the bold weight read as visually confusing against the serif body type. Member-visibility-under-`et al.` invariant (PUBS-11) still honored via `formatAuthors` + `buildMemberSurnameSet`; the helper still drives author-list truncation. Softening follows the PEOP-14 pattern (not treated as a gap)

### Person Profile Page (/people/[slug])

- [x] **PEOP-13**: `/people/[slug]` renders a new "Publications" section listing the person's last-10-years output via `getPublicationsByAuthor(deriveNameVariants(person), { lastNYears: 10 })`; section hidden entirely when list is empty (intentional during DATA-09/10 rollout)
- [~] **PEOP-14**: Count subtitle DROPPED per locked 11-CONTEXT decision (softens SC5). Heading is bare `Publicaciones` / `Publications` — the list's own length does the communication. Softening recorded in 11-CONTEXT.md, 11-03-PLAN.md, 11-03-SUMMARY.md, and 11-VERIFICATION.md (not treated as a gap)
- [x] **PEOP-15**: Profile publication entries render the same source badge as `/publications` — shared `PublicationEntry.tsx` component verbatim
- [x] **PEOP-16**: Profile publication entries render preprint vs published indicator — shared `PublicationEntry.tsx` component verbatim
- [x] **PEOP-17**: `generateStaticParams` category filter (pi / postdoc / phd) preserved — no profile pages for past members
- [x] **PEOP-18**: v1.0 manual "selected publications" list (driven by deprecated `publications_selected`) REPLACED by the synced last-10-years list — `getPublicationById` import removed, `SelectedPub` interface removed, legacy ~66-line render block stripped

### Bilingual (i18n drift prevention)

- [x] **I18N-08**: All new UI strings present in both `messages/es.json` and `messages/en.json`: source badge labels, preprint/published indicators, filter labels (`Todos`/`All` + 3 sources), `updatedAt` ICU format, two-source footnote (count subtitle dropped per locked 11-CONTEXT decision)
- [x] **I18N-09**: `pnpm check-translations` passes with zero key drift (confirmed in 11-03-SUMMARY.md)

### Documentation

- [x] **DOC-01**: Maintainer note in `content/SYNC.md` explains how to add `inspirehep_id` + `orcid_id` to `people.json`, with paste-ready example entry and BAI/ORCID lookup workflow (arxiv_id reference updated — field was reconceived as orcid_id in Phase 7-02)
- [x] **DOC-02**: Operational Troubleshooting section in `content/SYNC.md` covers: manual `workflow_dispatch` steps, step-summary interpretation (added/removed/unchanged + warnings), failed-cron diagnosis (BAI format, 429 retry, Atom parse, validate-content gate), local `--dry-run` fallback

---

## Deferred to v1.2+

### Publication Sync Expansion
- **SYNC-DEFER-01**: ORCID-first author lookup (requires every person to register an ORCID)
- **SYNC-DEFER-02**: NASA ADS API (astrophysics breadth beyond HEP cosmology)
- **SYNC-DEFER-03**: Cross-source DOI dedup (merge InspireHEP + arXiv records of the same paper)
- **SYNC-DEFER-04**: Citation count display (currently stored silently in JSON; surface later if demand arises)
- **SYNC-DEFER-05**: h-index badges (deliberately out — self-promotional tone risk)

### Operational Hardening
- **OPS-DEFER-01**: Action failure notification (email or Slack webhook) — currently relies on GitHub's built-in cron failure notifications
- **OPS-DEFER-02**: Per-person exclusion list (`exclude_arxiv_ids: []` in people.json) — maintainer escape valve for unwanted papers

### Profile Enhancements
- **PEOP-DEFER-01**: "View on InspireHEP / arXiv" live-profile links on `/people/[slug]`

### From v1.0
- **PUBS-03**: Filter controls for year / author / topic on `/publications` (UI filter only; source filter ships in v1.1 under PUBS-07)
- **PUBS-04**: Filter state reflected in URL query params

---

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| Runtime ISR / on-demand revalidation | Build-time GitHub Action preserves fully-static SSG (PERF-01 guarantee); ISR adds Vercel function cost + API rate-limit risk |
| PR-based sync (human review step) | Group publishing cadence is slow; auto-commit with Zod validation + Vercel build guard is safe enough |
| Past-member sync | Past members stay a flat list (v1.0 PEOP-05); no profile pages to target |
| Cross-source dedup | Source-tagged separate entries is v1.1's explicit design choice |
| Citation count surfaces | Stale data risk + self-promotional; link to live InspireHEP profile for current counts |
| Full conference proceedings by default | Dilutes peer-reviewed signal; add opt-in flag only if requested |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 7 | Complete |
| SCHEMA-02 | Phase 7 | Complete |
| SCHEMA-03 | Phase 7 | Complete |
| SCHEMA-04 | Phase 7 | Complete |
| SCHEMA-05 | Phase 7 | Complete |
| SCHEMA-06 | Phase 7 | Complete |
| DATA-09 | Phase 7 / extended Phase 12 | Partial (9/13 sync-scoped; 4 remaining — juan-manuel-armaleo, gonzalo-santa-cruz, guadalupe-ahumada-acuna, juan-pablo-elia. 2 undergrads out of sync scope.) |
| DATA-10 | Phase 7 / extended Phase 12 | Partial (9/13 sync-scoped; same follow-up schedule and remaining-slug list as DATA-09) |
| ACC-01 | Phase 8 | Complete |
| ACC-02 | Phase 8 | Complete |
| ACC-03 | Phase 8 | Complete |
| ACC-04 | Phase 8 | Complete |
| ACC-05 | Phase 8 | Complete |
| SYNC-01 | Phase 9 | Complete |
| SYNC-02 | Phase 9 | Complete |
| SYNC-03 | Phase 9 | Complete |
| SYNC-04 | Phase 9 | Complete |
| SYNC-05 | Phase 9 | Complete |
| SYNC-06 | Phase 9 | Complete |
| SYNC-07 | Phase 9 | Complete |
| SYNC-08 | Phase 9 | Complete |
| SYNC-09 | Phase 9 | Complete |
| SYNC-10 | Phase 9 | Complete |
| SYNC-11 | Phase 9 | Complete |
| SYNC-12 | Phase 9 | Complete |
| SYNC-13 | Phase 9 | Complete |
| SYNC-14 | Phase 9 | Complete |
| SYNC-15 | Phase 9 | Complete |
| CI-01 | Phase 10 | Complete |
| CI-02 | Phase 10 | Complete |
| CI-03 | Phase 10 | Complete |
| CI-04 | Phase 10 | Complete |
| CI-05 | Phase 10 | Complete |
| CI-06 | Phase 10 | Complete |
| CI-07 | Phase 10 | Complete |
| CI-08 | Phase 10 | Complete |
| PUBS-05 | Phase 11 | Complete |
| PUBS-06 | Phase 11 | Complete |
| PUBS-07 | Phase 11 | Complete |
| PUBS-08 | Phase 11 | Complete |
| PUBS-09 | Phase 11 | Complete |
| PUBS-10 | Phase 11 | Complete |
| PUBS-11 | Phase 11 | Complete |
| PUBS-12 | Phase 11 / softened Phase 12 | Softened (member bold dropped per user feedback; not a gap) |
| PEOP-13 | Phase 11 | Complete |
| PEOP-14 | Phase 11 | Softened (count subtitle dropped per 11-CONTEXT; not a gap) |
| PEOP-15 | Phase 11 | Complete |
| PEOP-16 | Phase 11 | Complete |
| PEOP-17 | Phase 11 | Complete |
| PEOP-18 | Phase 11 | Complete |
| I18N-08 | Phase 11 | Complete |
| I18N-09 | Phase 11 | Complete |
| DOC-01 | Phase 11 / closed Phase 12 | Complete |
| DOC-02 | Phase 11 / closed Phase 12 | Complete |

**Coverage:** 54 requirements across phases 7–12. DOC-01 + DOC-02 closed Phase 12; DATA-09/10 improved to 9/14 coverage Phase 12. All v1.1 requirements mapped.

*Status column updated by `/gsd:execute-phase` as phases complete.*

---

*Drafted 2026-04-18. Traceability finalized by roadmapper 2026-04-18. Ready for `/gsd:plan-phase 7`.*
