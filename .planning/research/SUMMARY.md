# Research Summary — v1.1 Publication Sync (InspireHEP + arXiv)

**Project:** Cosmo Group Website (UBA / FCEN)
**Milestone:** v1.1 — arXiv + InspireHEP auto-sync
**Researched:** 2026-04-18
**Confidence:** HIGH (stack and architecture verified against live codebase; APIs verified against live InspireHEP endpoint and official arXiv docs)

---

## Executive Summary

v1.1 adds automated publication sync to an already-shipped v1.0 static Next.js 16 site. The fundamental architecture is a weekly GitHub Actions cron job that runs `scripts/sync-publications.ts`, queries InspireHEP (per-author by BAI identifier) and arXiv (per-author by claimed arXiv ID), validates the merged result against the existing Zod schema, and commits `content/publications.json` back to `main`. Vercel rebuilds on the push. The Next.js SSG build is unchanged — it reads the committed JSON file at build time as it always has. The sync script and the Next.js build share one artifact and zero runtime coupling.

The recommended approach is deliberately minimal: one new devDependency (`fast-xml-parser@5.7.x` for arXiv's Atom XML), no new runtime deps in the browser bundle, and two new files (`scripts/sync-publications.ts` and `.github/workflows/sync-publications.yml`). All other tooling — `tsx`, `zod`, native `fetch`, `AbortSignal.timeout` — is already present. Schema changes are additive: `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` on `PublicationSchema` and two optional fields on `PersonSchema`. The `.default("manual")` on `z.strictObject` is load-bearing — without it, all 20 v1.0 curated entries fail validation the moment the schema is deployed.

The key risks are: (1) the schema migration must be atomic — Zod change + JSON Schema regeneration in a single commit, before any sync code is written; (2) `people.json` must be populated with BAI identifiers for all current members before the sync script is useful, which is a human dependency that blocks the automation; (3) arXiv name-based search must never be used as a fallback — it contaminates the publication list with wrong-author papers for anyone with a common Spanish surname. Pitfalls that seem like implementation details (rate-limit handling, deterministic JSON serialization to prevent spurious Vercel rebuilds, year-field selection for published vs. preprint records) are architectural commitments that must be in the first version of the script, not retrofitted.

---

## Five Decisions That Shape the Roadmap

These are the cross-cutting choices the roadmap must enforce:

1. **Schema extension is Phase A and must be atomic.** `publications.schema.ts` + `people.schema.ts` + `pnpm generate-schemas` + `pnpm check-content` all pass in a single commit. No other v1.1 work begins until this is green. Splitting schema and JSON Schema regeneration across two plans creates a window where the VS Code tooling lies to maintainers.

2. **`people.json` data population is a human dependency that blocks sync.** The BAI identifier (`inspirehep_id: "E.Calzetta.1"`) and optional arXiv author ID (`arxiv_id: "calzetta_e_1"`) must be filled in for every current member before the sync script produces real output. This is not a code task — it requires the PI or group admin to look up each member's IDs on InspireHEP. The roadmap must schedule this as an explicit human-action item, not assume it happens automatically.

3. **arXiv queries require claimed author IDs — no name-based fallback.** Members without a claimed arXiv author ID are skipped for arXiv queries. The correct fallback is InspireHEP (which has curator-assisted deduplication). Name-based `au:Rodriguez_M` searches return papers from other institutions and contaminate the list permanently until noticed.

4. **The sync script must validate in-memory before writing** (Strategy B). If any fetch fails — including a partial failure where InspireHEP succeeds but arXiv fails — the script exits 1 without writing. The last-good JSON is preserved. This is not just error handling; it is the correctness contract that makes the GitHub Action safe to run unattended.

5. **Deterministic JSON serialization is required from day one.** Sort publications by year descending, then by `arxiv` ID alphabetically, before calling `JSON.stringify(sorted, null, 2)`. Without this, every weekly run produces a non-empty diff even with identical data (V8 insertion-order variance), triggering spurious Vercel rebuilds every Monday morning.

---

## Key Findings

### Stack (v1.1 additions only)

No new runtime dependencies in the Next.js browser bundle. One new devDependency:

| Package | Version | Purpose |
|---------|---------|---------|
| `fast-xml-parser` | 5.7.1 | Parse arXiv Atom 1.0 XML response — zero deps, synchronous, ESM + CJS |

Existing tooling already covers everything else:
- **Native `fetch` + `AbortSignal.timeout(10_000)`** — Node 22 built-in; no axios, got, or undici
- **`tsx@^4.21.0`** — already a devDependency; runs the sync script via `pnpm exec tsx scripts/sync-publications.ts`
- **Zod v4** — already validates schemas; sync script validates in-memory before writing

Critical `fast-xml-parser` config for arXiv Atom feeds — `isArray` is non-negotiable, without it single-result queries collapse `entry` from an array to a plain object and the script crashes silently:

```ts
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["entry", "author", "link", "category"].includes(name),
});
```

**Script location:** `scripts/sync-publications.ts` (consistent with `validate-content.mjs` and `generate-schemas.mjs`). Uses relative imports (`../src/content/schemas/publications.schema.ts`), NOT the `@/` alias — `tsx` under Node.js does not resolve webpack-style path aliases. This is the same pattern the two existing scripts already use.

**GitHub Action:** `.github/workflows/sync-publications.yml`. Requires `permissions: contents: write` in the workflow YAML — without it, the push to `main` returns 403. The commit message must include `[skip ci]` to prevent the push from triggering a second sync run (infinite loop). Uses a `git diff --quiet` check before committing so byte-identical runs produce no commit and no Vercel rebuild.

**arXiv API:** Base URL is `http://export.arxiv.org/api/query` (HTTP, not HTTPS — documented; HTTPS redirects are inconsistent). Use a single batch `id_list` call for the whole group rather than per-author sequential queries to stay well within the 3 req/s rate limit.

**InspireHEP API:** Rate limit is 15 requests per 5-second window. For a group of 5–15 members, do NOT use `Promise.all()` over all authors — use a concurrency-limited queue (3–5 parallel max) with 2s inter-batch pauses and exponential backoff on 429.

### Features

**Table stakes (must ship for v1.1 to feel complete):**
- Source badge per entry ("arXiv" / "InspireHEP" / "Manual") — required because two sources with no cross-source dedup means users must understand provenance
- Preprint vs. published status indicator — academic audiences require this distinction; conflating them is a credibility error
- Last-5-years filter on `/people/[slug]` — prevents a PI with 120 papers from overwhelming their profile; 5 years aligns with CONICET grant evaluation windows (explicitly a "last 5 years of output" assessment)
- Author publication count subtitle on profile ("N publicaciones en los últimos 5 años") — credibility signal for applicants and funders
- Source filter toggle on `/publications` ("Todos / InspireHEP / arXiv / Manual") — necessary to explain why the same paper may appear twice
- "Actualizado el [date]" on `/publications` — makes staleness honest
- Weekly GitHub Actions cron (`0 6 * * 1`) + commit + Vercel rebuild — the automation is the entire point of v1.1
- Manual exclusion list per person (`exclude_arxiv_ids: []` in `people.json`) — the pragmatic guard against early-career papers and large-collaboration papers the group does not want foregrounded

**Differentiators (build if time allows):**
- Group member author highlighting (bold names matching current members in author lists) — MEDIUM complexity; requires `display_name_normalized` on person records and a render-time name lookup
- arXiv category → topic_tag auto-mapping at sync time
- Per-person "View on arXiv" link on profile pages (LOW complexity once `arxiv_id` is stored)

**Explicitly deferred to v2+:**
- Cross-source DOI dedup (InspireHEP vs. arXiv for the same paper)
- Citation count display (stale data + self-promotional tone; store in JSON silently for future optionality)
- h-index badges
- ADS / ORCID as additional sources

**Anti-features (do not build):**
- Name-based arXiv fallback — silently pollutes the list with wrong-author papers
- Citation count as a headline metric — stale data; not shown on any peer group site (MPA, IAS, UCL Cosmoparticle); link to InspireHEP author page for live counts instead
- Full conference proceedings import by default — dilutes peer-reviewed signal; add `show_proceedings: false` config boolean if explicitly requested

**UX conventions from peer site survey (KIPAC, CCAPP, UCL Cosmoparticle, IRIS-HEP):**
- No peer cosmology group site hosts a curated per-profile publication list — v1.1's last-5-years section is a genuine differentiator
- Author list format: show all if ≤5 authors; first 3 + "et al." if >5
- HEP citation style: `Authors. "Title." Journal Abbr. Volume, ArticleID (Year). arXiv:NNNNN [cat].`
- Sort: reverse-chronological; co-author order: alphabetical by surname (HEP field convention)
- Citation counts: NOT displayed on any peer group site

### Architecture

The v1.1 architecture introduces a strict two-environment separation:

```
SYNC ENVIRONMENT (GitHub Actions, weekly)
  scripts/sync-publications.ts
    ├── fetch InspireHEP + arXiv
    ├── merge, validate with PublicationsSchema.safeParse()
    └── write content/publications.json on success only

BUILD ENVIRONMENT (Next.js SSG, triggered by push)
  src/content/accessors/publications.ts
    └── import rawPublications from "content/publications.json"
    └── PublicationsSchema.parse() at module load — throws at build if invalid
```

The handoff artifact is `content/publications.json`. The sync script never imports Next.js internals. The build never calls external APIs. The sync script must NOT be added to the `prebuild` hook — that would make local development require network access.

**Modified files (additive only — no structural rewrite):**

| File | Change |
|------|--------|
| `src/content/schemas/publications.schema.ts` | Add `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` |
| `src/content/schemas/people.schema.ts` | Add `arxiv_id?: string` and `inspirehep_id?: string` as top-level optionals |
| `src/content/accessors/publications.ts` | Add `getPublicationsByAuthor(nameVariants, { lastNYears? })` |
| `src/content/index.ts` | Re-export `getPublicationsByAuthor` |
| `src/app/[locale]/people/[slug]/page.tsx` | Call `getPublicationsByAuthor` with person's name variants |

**New files:**

| File | Type |
|------|------|
| `scripts/sync-publications.ts` | CLI sync script |
| `.github/workflows/sync-publications.yml` | CI/cron workflow |

**Key accessor signature:**
```ts
export function getPublicationsByAuthor(
  nameVariants: string[],
  options: { lastNYears?: number } = {},
): Publication[]
```
Accepts plain strings (not a `Person` object) to avoid circular imports between `publications.ts` and `people.ts`. The page component builds the name variants.

**Validation pipeline (three gates):**
1. Sync script: `safeParse()` in memory before `writeFileSync` — fail fast, no partial write
2. CI Action: `pnpm validate-content` after write, before commit — belt-and-suspenders
3. Vercel build: `PublicationsSchema.parse()` at module load — final guard

**Year extraction rule:**
- InspireHEP records: `publication_info[0].year` if present (journal year); fall back to `parseInt(preprint_date.slice(0,4))`
- arXiv records: year from `<published>` (version 1 submission date, not `<updated>`)

### Critical Pitfalls

**Pitfall 1 (CRITICAL): `z.strictObject` nukes v1.0 entries without `.default("manual")`**
`PublicationSchema` is `z.strictObject`. Adding `source` as a required field without `.default("manual")` breaks all 20 existing entries on the first build after the schema change. Use `z.enum(["manual","inspirehep","arxiv"]).default("manual")`. Schema change and JSON Schema regeneration (`pnpm generate-schemas`) must ship in the same commit — never separately.

**Pitfall 2 (CRITICAL): Rate limit cascade from `Promise.all()` over all authors**
InspireHEP allows 15 req/5s. Firing all 15 group members in parallel saturates the window. Use a concurrency-limited queue (3–5 parallel max), 2s inter-batch delay, exponential backoff on 429. This must be in the initial script — the first CI run is the worst time to discover rate limiting.

**Pitfall 3 (CRITICAL): arXiv name-based fallback contaminates the publication list**
Members without a claimed arXiv author ID must be skipped for arXiv queries — do not fall back to `au:Rodriguez_M` name search. For common Spanish surnames, name-based search returns papers from unrelated researchers. An incomplete arXiv list is correct; a contaminated one requires a data recovery operation and a `git revert`.

**Pitfall 4 (CRITICAL): BAI vs. INSPIRE-ID format confusion causes silent zero-results**
`inspirehep_id` in `people.json` must store the BAI format (`E.Calzetta.1`), not the INSPIRE numeric ID (`INSPIRE-00140145`). The sync script must validate the format at startup and log a clear error if the wrong format is detected rather than passing it silently to the API and returning 0 papers.

**Pitfall 5 (CRITICAL): Non-deterministic JSON serialization causes weekly spurious Vercel rebuilds**
`JSON.stringify` output order varies across Node.js versions and across InspireHEP pagination shifts. Sort publications deterministically before serializing. Add `git diff --quiet content/publications.json` before committing — skip commit entirely if byte-identical. Configure Vercel's "Ignored Build Step" as a backstop.

**Pitfall 6 (MODERATE): Same collaboration paper appears N times (once per co-authoring group member)**
Planck, Euclid, LSST papers appear in every co-author's InspireHEP query result. Post-processing dedup by arXiv ID (O(n) pass) prevents the same paper from appearing 3× on `/publications`. This is intra-run dedup, distinct from the deferred cross-source DOI dedup.

**Pitfall 7 (MODERATE): `PersonSchema` rejects `arxiv_id`/`inspirehep_id` until schema updated AND JSON Schema regenerated**
`PersonSchema` is `z.strictObject`. Any maintainer who adds `arxiv_id` to `people.json` before the schema extension is committed breaks all CI builds with a cryptic Zod error. Schema + JSON Schema regeneration must ship as one atomic commit before any `people.json` changes.

**Pitfall 8 (MODERATE): `publications_selected` becomes a stale-reference trap**
The v1.0 `PersonSchema` has `publications_selected: []`. The sync rewrites the ID space in `publications.json`. Any populated `publications_selected` entry becomes a dangling reference with no build-time guard (the cross-file validator was deferred in Plan 02-05). Either deprecate the field with JSDoc or activate the validator — decide explicitly in Phase A.

**Pitfall 9 (MODERATE): Senior PI's papers silently truncated without pagination**
InspireHEP defaults to 10 results. `size=25` silently caps a PI with 120 papers at 25. Always read `hits.total` from the first response and paginate until complete or the configured cap is reached. Log "fetched X of Y total" per author to the Action summary.

**Pitfall 10 (MODERATE): Sync failure goes unnoticed for weeks**
GitHub cron failure emails may not reach the PI. Add `_meta: { synced_at, status }` to the JSON output. Log per-run delta ("X entries added, Y removed") to the Action summary. Document in the maintainer guide: if no new paper shows up after 2+ weeks, check Actions → sync-publications.

---

## Implications for Roadmap

### Phase A: Schema Extension (Atomic First Step)

**Rationale:** Every other v1.1 task imports updated schema types. The `z.strictObject` pitfalls (Pitfalls 1, 7) materialize if this is split across commits. Must be the first and atomic.

**Delivers:**
- `source: z.enum(["manual","inspirehep","arxiv"]).default("manual")` on `PublicationSchema`
- `arxiv_id?: string` and `inspirehep_id?: string` on `PersonSchema`
- Regenerated `content/publications.schema.json` and `content/people.schema.json`
- `pnpm check-content` passes on the existing 20 v1.0 entries without any JSON changes
- Decide fate of `publications_selected` (deprecate JSDoc or activate cross-file validator)
- Flag and decide the pre-2007 arXiv ID format question (`gr-qc/9209007` vs. schema regex)

**Avoids:** Pitfalls 1, 4 (schema migration), 7 (JSON Schema staleness), 8 (`publications_selected`)

**Research flag:** None — exact Zod syntax and file locations are fully specified in ARCHITECTURE.md.

---

### Phase B: Accessor Extension

**Rationale:** The `/people/[slug]` page needs `getPublicationsByAuthor` before it can render per-person publications. Clean additive export — no risk of breaking existing behavior.

**Delivers:**
- `getPublicationsByAuthor(nameVariants: string[], { lastNYears?: number })` in `src/content/accessors/publications.ts`
- Re-export from `src/content/index.ts`
- Unit tests: last-5-years cutoff, name-variant matching, no circular import

**Avoids:** Circular dependency between `publications.ts` and `people.ts` (plain string `nameVariants` avoids importing `Person`)

**Research flag:** None — signature and placement fully specified.

---

### Phase C: Sync Script (Core Logic)

**Rationale:** The largest phase. Must be validated locally (`pnpm exec tsx scripts/sync-publications.ts` with dry-run / small sample output) before wiring into CI. Building the Action before the script is stable wastes CI minutes and makes debugging harder.

**Delivers:**
- `scripts/sync-publications.ts` — production-quality from the first commit:
  - InspireHEP per-author BAI query with concurrency-limited queue (max 3–5 parallel), 2s pause, exponential backoff on 429
  - arXiv per-author query by claimed `arxiv_id` only — no name fallback; skip and log warning for members without `arxiv_id`
  - `fast-xml-parser` with `isArray` callback for Atom entries
  - Year extraction: `publication_info[0].year` for InspireHEP; `<published>` year for arXiv
  - Unicode normalization: `name.normalize('NFC')` on all author strings; BibTeX markup strip on titles
  - Intra-run dedup by arXiv ID (prevents Planck paper appearing 3×)
  - Deterministic sort before serialization (year desc, then arxiv ID alpha)
  - `PublicationsSchema.safeParse()` → write on success; `process.exit(1)` on failure; no partial writes
  - `_meta: { synced_at, status }` in output JSON
  - BAI format validation at startup — rejects `INSPIRE-00XXXXXX` with clear error message
  - Logging: per-author "fetched X of Y total" (surfaces pagination truncation)
  - Pagination: read `hits.total`, paginate until complete or configurable cap
- `pnpm add -D fast-xml-parser`
- `package.json` script: `"sync-publications": "tsx scripts/sync-publications.ts"`
- Migration decision documented in script comment: v1.0 placeholder data replaced on first run (Option C — clean replacement acceptable because all v1.0 entries are placeholder data)

**Human dependency (must be scheduled explicitly):** BAI identifiers and arXiv IDs populated in `people.json` for all current members before this phase can be tested end-to-end.

**Avoids:** Pitfalls 2 (rate limit), 3 (arXiv fallback), 4 (BAI format), 5 (deterministic sort), 6 (Planck dedup), 7 (wrong year field), 9 (pagination truncation), 17 (encoding corruption)

**Research flag:** None — all API behavior and implementation patterns are fully specified.

---

### Phase D: GitHub Action + CI Wiring

**Rationale:** Wire into CI only after the sync script is locally validated. Covers branch-protection gotcha, spurious-rebuild prevention, and failure visibility.

**Delivers:**
- `.github/workflows/sync-publications.yml`:
  - Schedule: `0 6 * * 1` (Monday 06:00 UTC)
  - `workflow_dispatch` for manual testing
  - `permissions: contents: write` (required)
  - Node 20 pinned; pnpm via `pnpm/action-setup@v5`
  - `pnpm install --frozen-lockfile`
  - `pnpm exec tsx scripts/sync-publications.ts`
  - `pnpm validate-content` (second validation gate)
  - `git diff --quiet content/publications.json || (git add ... && git commit -m "chore: sync publications [skip ci]" && git push)` — diff-check before commit; `[skip ci]` prevents loop
- Vercel "Ignored Build Step" configured: `git diff HEAD^ HEAD --quiet -- ./content/publications.json`
- First manual `workflow_dispatch` run to verify push to `main` actually lands (tests branch protection)
- Action summary logs "Changed: X added, Y removed" or "No changes — skipping commit"

**Research flag:** Verify whether `main` has branch protection rules before this phase. If yes, grant `github-actions[bot]` bypass in Settings → Branches, or use a fine-grained PAT stored as a repository secret.

**Avoids:** Pitfalls 5 (GITHUB_TOKEN permissions), 5/6 (spurious rebuild), 10 (failure visibility), 11 (tsx path aliases in CI)

---

### Phase E: Display Layer Integration

**Rationale:** With schema, accessor, and sync script in place, display changes are additive and isolated. Can be developed in parallel with Phase D once Phases A and B are committed.

**Delivers:**
- `/people/[slug]/page.tsx`: last-5-years section using `getPublicationsByAuthor(nameVariants, { lastNYears: 5 })`; author count subtitle; source badge per entry
- `/publications/page.tsx` + `publications-filter.tsx`: source filter toggle ("Todos / InspireHEP / arXiv / Manual"); "Actualizado el [date]" staleness indicator from `_meta.synced_at`
- `publication-row.tsx`: source badge component (small pill, text-xs); preprint vs. published status indicator
- Bilingual i18n strings in `messages/{es,en}.json` for all new UI labels: source badges, status indicators, filter labels, "last updated" string, footnote
- Footnote on `/publications` (bilingual): explains two-source design and why duplicates may appear
- `display_name_normalized` added to `people.json` schema for author highlighting (optional; activate only if time allows)

**Avoids:** Pitfall 15 (author names indistinguishable from external collaborators)

**Research flag:** None for core display. Author highlighting (bold group member names) is a nice-to-have differentiator — implement only after Phases C and D are green.

---

### Phase Ordering Rationale

The A → B → C → D → E sequence is driven by concrete dependencies:
- Schema (A) must be committed before any code that imports updated schema types
- Accessor (B) must exist before the page component that calls it (E)
- Sync script (C) must be locally validated before CI wiring (D) — CI debugging is slower
- Phases C and E can run in parallel once A and B are committed (if two developers are available)
- The human dependency (populating `people.json` with BAI/arXiv IDs) is not a code task but must be scheduled at the start of Phase C — without it, Phase C cannot be tested against real data

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `fast-xml-parser` 5.7.x confirmed at npm; `tsx` and native fetch already in project; GitHub Action actions verified against official docs; arXiv HTTP base URL confirmed from official manual |
| Features | HIGH (API fields) / MEDIUM (UX conventions) | InspireHEP fields verified against live API call; last-5-years cutoff and source badge design are reasoned inference from domain practice, not documented norms from authoritative sources |
| Architecture | HIGH | Derived from direct inspection of v1.0 codebase; relative import pattern confirmed in existing scripts; two-environment separation and `z.strictObject` + `.default()` interaction verified |
| Pitfalls | HIGH | Rate limits from official docs + live verification; Zod strictObject behavior from v4 changelog + code inspection; GITHUB_TOKEN branch-protection limit from GitHub community discussions and official docs |

**Overall confidence:** HIGH for implementation decisions. MEDIUM for UX display conventions (last-5-years cutoff, source badge visual design, author highlighting).

### Gaps to Address

- **`people.json` BAI population** — Not a code gap. A human action that must be scheduled explicitly as a prerequisite milestone item for Phase C testing. The roadmap should surface this as a named human-action item.
- **Pre-2007 arXiv ID format** — InspireHEP records for older papers use `gr-qc/9209007` format, which fails the current `PublicationSchema` regex `^\d{4}\.\d{4,5}(v\d+)?$`. Decide in Phase A: either extend the regex to accept both formats (`^(\d{4}\.\d{4,5}|[a-z-]+/\d{7})(v\d+)?$`) or omit old-format IDs from the `arxiv` field. Both are valid; the choice must be explicit.
- **`actions/setup-node` v6** — One search result claimed v6 released 2026-03-04. Recommendations pin to v4 (confirmed stable). Verify from the GitHub releases page during Phase D and upgrade if confirmed.
- **`stefanzweifel/git-auto-commit-action` pinned version** — STACK.md uses v5 in the YAML example but notes v7.1.0 may be the latest. Verify and pin to the current stable major during Phase D.
- **`publications_selected` fate** — Decide in Phase A: deprecated (JSDoc warning), removed from schema, or cross-file validator activated. Any of the three is acceptable; the decision must be explicit and documented.

---

## Sources

### Primary (HIGH confidence)
- Live InspireHEP API: `https://inspirehep.net/api/literature?q=a%20E.Calzetta.1&size=1` — response shape, BAI format, field names confirmed (2026-04-18)
- [inspirehep/rest-api-doc README](https://github.com/inspirehep/rest-api-doc) — rate limits, BAI query syntax, pagination
- [arXiv API User's Manual](https://info.arxiv.org/help/api/user-manual.html) — Atom XML shape, `<published>` semantics, HTTP base URL, rate limits
- [arXiv Author Identifiers](https://info.arxiv.org/help/author_identifiers.html) — opt-in claiming, no fallback disambiguation
- [fast-xml-parser GitHub](https://github.com/NaturalIntelligence/fast-xml-parser) — v5.7.1, `isArray` callback, `ignoreAttributes`
- Direct codebase inspection: `scripts/validate-content.mjs`, `scripts/generate-schemas.mjs`, `src/content/schemas/publications.schema.ts`, `src/content/schemas/people.schema.ts`, `tsconfig.json`, `package.json` (2026-04-18)
- [GitHub GITHUB_TOKEN documentation](https://docs.github.com/en/actions/concepts/security/github_token) — `contents: write` vs. branch protection bypass
- [Vercel Ignored Build Step](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel) — `git diff HEAD^ HEAD --quiet` syntax

### Secondary (MEDIUM confidence)
- Peer cosmology group sites: UCL Cosmoparticle, IRIS-HEP, KIPAC, CCAPP — publication display conventions (survey 2026-04-18)
- [Zod v4 changelog](https://zod.dev/v4/changelog) — `z.strictObject` and `.default()` on optional fields
- [InspireHEP search tips](https://help.inspirehep.net/knowledge-base/inspire-paper-search/) — BAI vs. INSPIRE-ID format
- [GitHub Actions branch protection community discussion](https://github.com/orgs/community/discussions/25305) — GITHUB_TOKEN cannot push to protected branches

### Tertiary (LOW confidence)
- `actions/setup-node` v6 existence — one search result; recommendations pin to v4
- `next-image-export-optimizer` — static-export fallback suggestion only; not needed for primary Vercel deployment

---

*Research completed: 2026-04-18*
*Milestone: v1.1 — arXiv + InspireHEP publication sync*
*Ready for roadmap: yes*
