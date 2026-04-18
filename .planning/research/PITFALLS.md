# Pitfalls Research — v1.1 arXiv + InspireHEP Publication Sync

**Domain:** Adding API-driven content sync to an existing fully-static academic site (Next.js 16 + Zod v4 + GitHub Actions → Vercel)
**Researched:** 2026-04-18
**Confidence:** HIGH for API behavior (verified against InspireHEP live API + official docs), HIGH for GitHub Actions/Vercel mechanics (official docs), MEDIUM for schema migration pitfalls (Zod v4 changelog + code inspection of existing schemas).

Scope note: These pitfalls are specific to *integrating* arXiv + InspireHEP sync into the *existing* v1.0 codebase — not greenfield API consumption. Generic "handle your errors" advice is omitted. Pitfalls from the v1.0 PITFALLS.md (i18n, carousel, email harvesting, etc.) carry forward unchanged and are not duplicated here.

---

## Critical Pitfalls

### Pitfall 1: `z.strictObject` on `PublicationSchema` rejects `source` field on first build — silently nukes v1.0 data

**What goes wrong:**
`PublicationSchema` is declared with `z.strictObject(...)`. The v1.0 hand-curated `content/publications.json` does NOT contain a `source` field. The moment the sync script writes entries with `source: "inspirehep"` or `source: "arxiv"`, the new field is valid for fresh entries. But the deeper problem is the reverse: if `source` is added as a required field to the schema before the migration of the 20 v1.0 entries, `pnpm check-content` fails at build time with "Unrecognized key(s): none" for the fresh entries, OR "Required" for the old entries, depending on implementation order. Either way the build is broken.

The existing `z.strictObject` also means any field the sync script adds that wasn't explicitly listed in the schema (e.g., `inspirehep_id`, `raw_authors`, debug fields left in by accident) causes a parse failure on the entire array.

**Why it happens:**
`z.strictObject` strips unknown keys at parse time, but also **throws** if the schema uses `parseStrict` (the Zod v4 default for strict objects). Developers add `source` to the Zod schema without migrating the existing 20 JSON records at the same time, creating a window where old data fails validation.

**How to avoid:**
- Add `source` to the schema as `.optional()` with a `.default("manual")` fallback: `source: z.enum(["inspirehep", "arxiv", "manual"]).optional().default("manual")`. This is backward compatible — existing entries parse without a `source` field and get tagged `"manual"`.
- Never add a required field to the schema before all existing data has been migrated. The migration must be atomic: schema change + JSON backfill in the same commit.
- After the sync script is stable, do a one-time migration pass that adds `source: "manual"` to the 20 v1.0 entries and commits. After that commit, the `.default()` fallback becomes redundant but harmless.
- Run `pnpm check-content` locally before committing schema changes, not just in CI — the feedback loop is tighter.

**Warning signs:**
- `pnpm check-content` passes before the schema change but fails immediately after adding `source` without migrating the JSON.
- VS Code shows red squigglies on v1.0 entries after regenerating `publications.schema.json` without backfilling.
- Build log shows `ZodError: Required at [0].source` for the first entry (which is a v1.0 curated entry, not a sync-generated one).

**Phase to address:**
Schema migration phase (whichever plan extends `PublicationSchema`) — schema change and JSON backfill must ship in the same plan, not two separate plans.

---

### Pitfall 2: InspireHEP rate limit hits exactly at the 15-author parallel-fetch point

**What goes wrong:**
InspireHEP enforces **15 requests per 5-second window per IP**. A sync script that fires one request per author for 15 group members in parallel (`Promise.all([...])`) exhausts the entire window in a single burst. Every request from person #1 to #15 fires simultaneously. CI's shared IP may already have partial quota burned by previous steps or by another job running concurrently in the same Actions runner pool. The result is a mix of 200s and 429s in the first run, with no retry logic.

The compounding failure: when using `size=1000` (the InspireHEP max page size) to get all papers in one request per author, a senior PI with 100+ papers produces a large response body. If the sync script also queries both InspireHEP and arXiv per author, that is 30 parallel requests for 15 authors — double the rate limit.

**Why it happens:**
Developers reach for `Promise.all()` as the idiomatic "fetch in parallel" pattern. The InspireHEP limit (15 req / 5s) is exactly the size of a typical HEP cosmology group, so there is no safety margin if all fire at once.

**How to avoid:**
- Use a concurrency-limited queue: fetch at most 3–5 authors in parallel, not all 15. Libraries like `p-limit` (Node.js) implement this in ~5 lines.
- Between batches, add a 2-second pause. arXiv's own manual suggests "a 3 second delay in your code" for sequential calls; apply the same discipline to InspireHEP.
- Implement exponential backoff on 429: wait `Math.min(5000 * 2^attempt, 60000)` ms, retry up to 3 times. Count the retry as consuming the next slot in the queue.
- Log per-author fetch timing to the Action summary so 429 storms are visible in the run log.
- Query InspireHEP for all authors sequentially first, then arXiv sequentially — do not interleave the two APIs in the same queue, as they share the same egress IP.

**Warning signs:**
- First Action run succeeds but subsequent runs fail with `FetchError: 429` for author #N onward.
- Action logs show some authors with 0 publications when they have many (silent 429 drops).
- Re-running the Action manually (same time, same IP) fails more frequently than the scheduled 3am run (when CI load is lower).

**Phase to address:**
Sync script implementation — the rate-limit strategy must be baked into the fetcher from the first iteration, not retrofitted after the first CI failure.

---

### Pitfall 3: InspireHEP author BAI vs. `INSPIRE-XXXXXXXX` ID confusion in query syntax

**What goes wrong:**
InspireHEP exposes two author identifier types: the **BAI** (Bibliographic Author Identifier, format `E.Calzetta.1`) and the **INSPIRE ID** (format `INSPIRE-00140145`). These require different query syntaxes:

- Authors endpoint: `https://inspirehep.net/api/authors?q=ids.value:INSPIRE-00140145`
- Literature search by BAI: `https://inspirehep.net/api/literature?q=a+E.Calzetta.1`
- Literature search by INSPIRE ID: syntax varies, often requires the author recid from the authors endpoint first

A maintainer who pastes their `INSPIRE-00140145` into `people.json` as `inspirehep_id` will produce a different query than one who pastes their BAI `E.Calzetta.1`. If the sync script treats both formats identically, one format returns correct results and the other returns 0 papers or wrong papers.

Furthermore, the InspireHEP API live query returned BAI-format IDs (`E.Calzetta.1`, `G.Perna.2`) in author records, not the `INSPIRE-00XXXXXX` format — meaning a user who looks up their own INSPIRE profile sees one format in the URL bar and another in the API response.

**Why it happens:**
The InspireHEP author profile URL uses the `recid` (a number like `1274671`). The API documentation describes `INSPIRE-00140145` as the "INSPIRE ID." The BAI (`E.Calzetta.1`) is what appears in literature `authors[].ids.value`. These three identifiers serve different purposes and are not interchangeable in query syntax.

**How to avoid:**
- Standardize on **BAI format** (`E.Calzetta.1`) as the value stored in `people.json` as `inspirehep_id`. BAI is the format found in literature records' `authors[].ids.value` and is the most direct key for `q=a+BAI` literature searches.
- Document clearly in the maintainer guide: "The BAI looks like `E.Calzetta.1` — find it on your INSPIRE profile under 'Author IDs'." Add an example screenshot.
- The sync script should validate `inspirehep_id` format at startup: if the value matches `/^INSPIRE-\d+$/` (i.e., a user accidentally pasted their INSPIRE-ID rather than their BAI), log a clear error and skip that person rather than producing empty results silently.
- If supporting both formats: detect format by regex, then use the appropriate query path (INSPIRE-ID → fetch author record to get BAI → query literature by BAI).

**Warning signs:**
- A person is in `people.json` with an `inspirehep_id` but the sync produces 0 publications for them when their INSPIRE profile shows 50.
- The value in `people.json` starts with `INSPIRE-` (all uppercase, numeric suffix) vs. the BAI form (Last.Initial.N).
- No format validation in the sync script — any string passes through silently.

**Phase to address:**
Sync script foundation — the ID format decision and validation must be made before any fetching logic is written. Document the accepted format in the person schema's JSDoc comment.

---

### Pitfall 4: The `z.strictObject` on `PersonSchema` will reject `arxiv_id` and `inspirehep_id` until schema is updated first

**What goes wrong:**
`PersonSchema` is `z.strictObject(...)`. If a maintainer adds `arxiv_id: "garcia_m_1"` to `people.json` before the schema is updated to include that field, `pnpm check-content` fails at CI with "Unrecognized key: arxiv_id" — blocking all builds, not just the sync-related ones. The maintainer sees a cryptic Zod error and panics.

Conversely, if the schema is updated to add `arxiv_id` and `inspirehep_id` but both are `z.string().optional()`, the JSON Schema file (`content/people.schema.json`) used for VS Code IntelliSense is NOT automatically regenerated — old schema shows red squigglies on valid new fields (see Pitfall 14).

**Why it happens:**
Schema-first development discipline breaks down at schema boundaries: the Zod schema, the JSON Schema file, and the JSON data file are three separate artifacts that must stay in sync. Updating one without the others creates a state where tooling lies to maintainers.

**How to avoid:**
- The plan that extends `PersonSchema` with `arxiv_id` and `inspirehep_id` must also regenerate `content/people.schema.json` in the same commit. Run `pnpm generate-schemas` (or equivalent) as part of that plan's acceptance criteria.
- Add a CI check that `pnpm generate-schemas` produces no diff from the committed `.schema.json` files. Drift between Zod schema and JSON Schema becomes a CI failure.
- Add JSDoc on both new fields explaining the format: `/** BAI format, e.g. "E.Calzetta.1". Find on your INSPIRE profile under Author IDs. */`

**Warning signs:**
- `pnpm check-content` passes but VS Code shows red squigglies on `arxiv_id` fields.
- `pnpm check-content` fails for a person who added `arxiv_id` before a developer updated the Zod schema.
- `git diff` on `content/people.schema.json` after running the schema generator shows non-empty diff.

**Phase to address:**
First plan of v1.1 that touches schemas — the schema + JSON Schema file + JSDoc must be one atomic commit.

---

### Pitfall 5: GitHub Actions `GITHUB_TOKEN` cannot push to a protected main branch by default

**What goes wrong:**
The weekly cron Action needs to commit the refreshed `content/publications.json` and push to `main`. The default `GITHUB_TOKEN` has `contents: read` by default (or `write` if the repo setting is permissive), but **even with `contents: write`, the default `GITHUB_TOKEN` cannot push to a branch protected by branch protection rules** (e.g., "Require status checks to pass", "Require pull request reviews"). If main has any protection rule, the push returns `403 Permission denied` or `remote: error: GH006: Protected branch update failed`.

Furthermore, a commit made by the Action with `contents: write` GITHUB_TOKEN does NOT trigger other workflows (to prevent infinite loops) — so a push from the Action won't trigger the `pnpm check-content` CI run that would normally guard a push. This means a bug in the sync script could commit invalid JSON that bypasses all guards.

**Why it happens:**
Developers assume the bot token is equivalent to a repo admin push. The distinction between `contents: write` (which the GITHUB_TOKEN can be granted) and bypass of branch protection rules (which only PATs or GitHub Apps can do) is easy to miss until the first 403 in CI.

**How to avoid:**
- **Option A (simplest):** Keep main unprotected or add a bypass rule for `github-actions[bot]`. This is appropriate for a small private academic repo where all writers are trusted. Document this as a deliberate choice.
- **Option B (belt-and-suspenders):** The Action creates a branch (`sync/publications-YYYY-MM-DD`), commits the updated JSON there, opens a PR, and auto-merges if CI passes. More CI minutes, but the guard works.
- **Option C:** Use a fine-grained PAT with `contents: write` stored as a repository secret. Only necessary if branch protection is needed.
- In the workflow, always set `permissions: { contents: write }` explicitly — relying on the repo default is fragile across repo settings changes.
- The sync Action should also run `pnpm check-content` on the generated JSON before committing. This restores the guard that the GITHUB_TOKEN push would bypass.

**Warning signs:**
- First cron run fails with `remote: error: GH006` or `error: failed to push some refs`.
- Action logs show `Successfully committed` but the commit never appears in `main` history.
- Branch protection was added after the workflow was written and tested.

**Phase to address:**
GitHub Action implementation — test the push step in a separate branch before relying on the cron.

---

### Pitfall 6: Empty-diff push triggers unnecessary Vercel rebuild every week

**What goes wrong:**
The weekly Action runs, fetches publications, and writes `content/publications.json`. If the upstream data is identical to what was committed last week (no new papers, no corrections), the file content is byte-for-byte the same. The Action still runs `git commit` — which creates a commit if there's no `--allow-empty` guard. If there IS a diff (even whitespace from JSON serialization order differences), Vercel rebuilds the entire site. Over a year this is 52 unnecessary builds.

More subtly: if the JSON serializer outputs keys in a different order than last week (because `Object.keys()` iteration order changed across Node.js versions, or InspireHEP response ordering shifted), every weekly run produces a non-empty diff even with zero data changes, causing a rebuild every time.

**Why it happens:**
JSON serialization is not deterministic across environments unless explicitly sorted. `JSON.stringify(obj)` outputs keys in V8's insertion-order, which varies based on how the object was constructed. InspireHEP pagination order may shift slightly between runs.

**How to avoid:**
- Before committing, check for an actual diff: `git diff --quiet content/publications.json || git commit -m "..."`. If no diff, skip the commit entirely and log "No changes — skipping commit" to the Action summary.
- Sort the output JSON deterministically: sort the publications array by year descending, then by ID alphabetically. Serialize with `JSON.stringify(sorted, null, 2)` and a fixed 2-space indent. This makes the output byte-stable across runs for identical data.
- Use Vercel's "Ignored Build Step" to skip builds when `content/publications.json` hasn't changed: `git diff HEAD^ HEAD --quiet -- ./content/publications.json` (exit 0 = skip, exit 1 = build). This is a safety net even if the Action commits a no-op.
- In the Action summary, always log: "Changed: X entries added, Y removed, Z modified" — makes the delta human-readable for maintainers.

**Warning signs:**
- Vercel deployment history shows a build every week at the same time, even during long academic breaks when no papers are published.
- `git log --oneline content/publications.json` shows weekly commits with no substantive change to the content.
- JSON diff shows only key-ordering changes between adjacent weeks.

**Phase to address:**
GitHub Action implementation — the diff-check and sort must be in the initial implementation. Retrofitting later means weeks of spurious builds have already burned Vercel minutes.

---

### Pitfall 7: arXiv `<published>` vs. InspireHEP `preprint_date` — year-grouping produces wrong year for some papers

**What goes wrong:**
`<published>` in the arXiv Atom feed is "the date that version 1 was submitted." For a paper submitted in late December and published in January, this is December of the previous year. InspireHEP's `preprint_date` is the same date (arXiv submission). Neither is the "publication year" on the journal record — that may differ by 6–18 months (cosmology papers often appear on arXiv well before formal publication).

The `/publications` page groups by `year`. If year is derived from `preprint_date`, a paper submitted 2024-12-28 but published in JCAP in 2025 appears under 2024 in the academic list — which reads as wrong to researchers who cite it as "Smith et al., JCAP 2025."

**Why it happens:**
The sync script uses the most readily available date (the preprint date, which is always present) rather than the published date (which is in `publication_info[].year` in InspireHEP but may be absent for recent preprints).

**How to avoid:**
- For InspireHEP records: use `publication_info[0].year` if present (this is the journal publication year); fall back to `parseInt(preprint_date.slice(0,4))` for preprints without a published year.
- For arXiv records: parse year from `<published>` (version 1 submission date). Accept that preprint-only records will use submission year — this is the convention on arXiv author pages.
- The `source` tag already differentiates the two — render arXiv-source entries with a "Preprint" label in the journal column, which makes the year ambiguity explicit to the reader.
- Document this decision in a code comment in the sync script: "Year = published year if available, else submission year. Preprint-only records use submission year."

**Warning signs:**
- A recent paper appears under the wrong year on the publications page.
- `publication_info` is not being read from InspireHEP records — only `preprint_date` is used.
- A paper with an InspireHEP record shows `journal: "Preprint"` when it was actually published in Phys. Rev. D.

**Phase to address:**
Sync script implementation — year extraction logic must handle both sources consistently. Include a test case with a paper that spans a December submission / January publication.

---

### Pitfall 8: arXiv author-name collision — "M. Rodríguez" on 200 papers is not all the same person

**What goes wrong:**
The v1.1 design uses explicit `arxiv_id` (an arXiv author identifier like `garcia_m_1`) to fetch papers via the arXiv API's author search. However, arXiv author IDs require the author to have **opted in** to the arXiv author claiming system. For group members who have NOT claimed their papers on arXiv, the sync script falls back to name-based search (`au:Rodriguez_M`), which matches all 347 papers by anyone named "M. Rodriguez" on arXiv — including other researchers at other institutions.

The result: the publications list for María Rodríguez includes papers by a Meteorología professor in Mexico City and a condensed matter physicist in Spain. All have `au:Rodriguez_M` matching.

**Why it happens:**
arXiv's legacy API search uses last name + first initial with no institutional disambiguation. The author claiming system is opt-in and has low adoption. Name-based fallback sounds safe but is systematically over-inclusive for common Spanish surnames.

**How to avoid:**
- Make `arxiv_id` (the claimed author ID like `garcia_m_1`) the *required* path for arXiv queries. If a member has no claimed arXiv ID, skip arXiv for that member — do not fall back to name-based search. Log a clear warning: "No arXiv ID for [person] — skipping arXiv fetch. Add arxiv_id to people.json."
- For the initial rollout, add arXiv IDs only for members who have them. The list will be incomplete, but correct. An incomplete list is better than a polluted one.
- For members where only InspireHEP is available (because they haven't claimed arXiv), their papers still appear via InspireHEP — InspireHEP's author profile deduplication is more rigorous and curator-assisted.
- Document in the maintainer guide: "How to find your arXiv author ID" — it's at `https://arxiv.org/a/[surname]_[initial]_[N]`.

**Warning signs:**
- The publications list for any person contains papers from obvious wrong institutions or wrong subfields.
- The sync script uses `au:` search without checking whether `arxiv_id` is present.
- Author counts on the publications page are implausibly high (>50 papers/year for a PhD student).

**Phase to address:**
Sync script foundation — the no-fallback policy must be enforced from the start, not discovered after the first erroneous sync contaminates the JSON.

---

### Pitfall 9: InspireHEP pagination truncation — senior PI with 120+ papers gets silently capped

**What goes wrong:**
InspireHEP defaults to 10 results per page. A naive script that requests without `size=` or with `size=25` will silently truncate a senior PI's publication list. Esteban Calzetta has 80+ papers; a request with `size=25&page=1` returns 25; the script stores 25. The publications page shows "25 publications" for the PI — which looks wrong and is professionally embarrassing.

Conversely: requesting `size=1000` (the max) for every author and paginating through all results regardless of age pulls 30 years of papers for a senior PI. For a group of 15, that's 15 × potentially 500–1000 papers. The Action takes 5 minutes and the resulting JSON is enormous — which slows the Next.js build.

**Why it happens:**
Developers set a page size that feels "big enough" and don't verify completeness against the author's actual profile count. The total is in the response (`hits.total` in InspireHEP), but it's easy to miss.

**How to avoid:**
- Always read `hits.total` from the first InspireHEP response and compare to the number of results received. If `total > size`, page until all results are fetched or the configured cap is reached.
- Set a **configurable cap** in the sync script (e.g., `MAX_PAPERS_PER_AUTHOR = 200`). For a cosmology group website, papers older than 20 years rarely need to appear. Fetch only papers from the current year minus N years (e.g., `q=... AND date:2000--2026`).
- For the `/publications` page, the intent is a group archive — a sane limit is the last 10–15 years, not the PI's full career. Make this the default and document it.
- Log the per-author totals to the Action summary: "Calzetta: fetched 87 of 87 papers." An unexpected "fetched 25 of 87" surfaces the truncation problem.

**Warning signs:**
- A PI's publications count on the site is lower than their InspireHEP profile count by a factor of 2 or more.
- The sync script has a fixed `size=25` or similar without pagination logic.
- `hits.total` is not read or logged anywhere in the script.

**Phase to address:**
Sync script implementation — pagination + cap + logging must be in the initial version.

---

### Pitfall 10: "Planck Collaboration" paper appears in every PI's publication list

**What goes wrong:**
Several cosmology researchers have papers authored as "Planck Collaboration: Smith, A.; García, M.; ..." where hundreds of authors are listed. ArXiv and InspireHEP include the individual author in the author list, so any query by `au:Garcia_M` returns the Planck Collaboration paper as a genuine match.

When synced, this paper appears in the publications list for EVERY group member who was a Planck collaborator — three or four people — and appears three or four times in the combined list. Even with source-tagging (no DOI dedup in v1.1), the same paper with the same title appears multiple times with the same year. The `/publications` page lists "Planck 2018 Results: Cosmological Parameters" three times.

This is not an arXiv/InspireHEP error — the paper genuinely belongs to each person's publication record. But the UX reads as a bug.

**Why it happens:**
Multi-hundred-author collaboration papers are standard in experimental HEP/cosmology but unusual in software development. Publication sync scripts designed for individual researchers don't account for papers that are legitimately on multiple group-member records.

**How to avoid:**
- Even without DOI dedup (v1.1 constraint), implement **title-and-year dedup** as a post-processing step before writing the JSON. A paper with an identical title and year that appears multiple times (from different author queries) is merged into a single entry. The `source` field becomes an array: `["inspirehep", "arxiv"]` if needed, or remains the first source encountered.
- The simplest signal: if `arxiv_eprints[].value` (the arXiv ID) is identical across two entries, they are the same paper regardless of which author query returned them.
- Alternatively: accept the duplication but collapse it in the UI — the `/publications` page de-duplicates by arXiv ID or DOI when rendering, so the JSON may have duplicates but the page doesn't show them.
- Log a warning in the Action summary when duplicates are detected: "Detected 3 duplicate entries by arXiv ID — merged into 1."

**Warning signs:**
- The publications list shows the same paper title 2–4 times in the same year.
- Large collaboration papers (Planck, Euclid, LSST) are repeated.
- `publications.json` has two entries with identical `arxiv` field values.

**Phase to address:**
Sync script implementation — dedup by arXiv ID is a cheap O(n) pass and should be in the first version. This is distinct from the deferred "cross-source DOI dedup" — it's within-run dedup, not cross-source semantic dedup.

---

## Moderate Pitfalls

### Pitfall 11: tsx path aliases work inside Next.js but break in the standalone sync CLI

**What goes wrong:**
The sync script imports from `@/content/schemas/publications.schema` (using the `@/` path alias defined in `tsconfig.json`). Running the script with `tsx scripts/sync-publications.ts` works locally because `tsx` reads `tsconfig.json` paths. Running it in a bare `node` invocation (e.g., if the Action calls `node dist/sync.js` after compiling) fails with `Cannot find module '@/content/schemas/publications.schema'`.

More subtly: the Action's Node.js version may differ from the local dev version. If the sync script uses Node.js 20 features (e.g., native `fetch`) but the Action runner defaults to Node.js 18, the script crashes with no clear error.

**Why it happens:**
`tsx` handles path aliases at runtime by reading `tsconfig.json`. Compiled output does not — `tsc` does not rewrite alias paths in output files by default. This works invisibly in the Next.js build (handled by webpack) but breaks for standalone Node.js scripts.

**How to avoid:**
- Use `tsx` directly in the Action: `npx tsx scripts/sync-publications.ts`. This is the simplest approach and avoids the compiled-output path problem.
- Set `node-version: '20'` explicitly in the Action's `setup-node` step. Do not rely on the runner default.
- Keep the sync script's imports of project schemas minimal: import only the Zod schema type and the schema object — not Next.js-specific modules, client components, or anything that requires the full webpack build graph.
- Validate in CI (not just locally): the Action should fail with a clear error if the import fails, not a silent `undefined`.

**Warning signs:**
- Script works with `pnpm tsx scripts/sync.ts` locally but the Action shows `Cannot find module '@/...'`.
- Action uses `node scripts/sync.js` instead of `tsx scripts/sync.ts`.
- The Action's Node.js version is not pinned.

**Phase to address:**
GitHub Action implementation — the `run:` step invocation command and Node.js version must be tested in CI from the first commit.

---

### Pitfall 12: v1.0's `publications_selected` references break when `publications.json` is rewritten

**What goes wrong:**
`content/people.json` has `publications_selected: []` on every person (currently empty arrays in the v1.0 data, but the field exists). The v1.0 schema treats this as `z.array(z.string()).optional().default([])` — IDs referencing `content/publications.json`. If the sync script completely replaces `publications.json` with auto-generated entries, the IDs in `publications_selected` (if any maintainer has populated them before the sync) become stale references to entries that no longer exist.

The locked decision says v1.1 profile pages use author-match filtering, not a `publications_selected` list. But the field remains in the schema and JSON. If a future maintainer adds an entry to `publications_selected` (e.g., before fully reading the docs), the prebuild validator may silently pass a reference to a non-existent ID.

**Why it happens:**
The field is vestigial but not removed. The cross-file ID validation in the prebuild script (`scripts/validate-content.ts`) does not currently validate `publications_selected` references against the publication ID list (this was deferred in Plan 02-05). The v1.1 sync replaces the ID space, breaking any existing references without warning.

**How to avoid:**
- At v1.1 launch, remove or deprecate `publications_selected` from `PersonSchema` — or rename it to `publications_pinned` with a clear JSDoc saying "IDs from the auto-synced publications.json — use the INSPIRE BAI search to find the correct ID."
- If keeping the field, activate the cross-file ID validation in the prebuild script at v1.1 launch. A stale reference should be a build failure, not a silent miss.
- Update the maintainer guide to say: "Do not manually populate `publications_selected` until you know the auto-generated ID for your paper."

**Warning signs:**
- `publications_selected` contains non-empty arrays in `people.json` before the sync migration is complete.
- The prebuild script skips cross-file ID validation (the deferred `// TODO:` comment from Plan 02-05).
- A person's profile page renders an empty publications section despite `publications_selected` being populated.

**Phase to address:**
Migration plan — remove or deprecate `publications_selected` OR activate the cross-file validator in the same plan that rewrites `publications.json`.

---

### Pitfall 13: JSON Schema for VS Code goes stale after Zod schema changes

**What goes wrong:**
`content/publications.schema.json` and `content/people.schema.json` are generated from the Zod schemas via `pnpm generate-schemas`. After adding `source`, `arxiv_id`, and `inspirehep_id` to the Zod schemas, the JSON Schema files are not regenerated. VS Code IntelliSense:
- Shows red squigglies on valid `source: "inspirehep"` fields (not in old JSON Schema).
- Autocompletes the old field list — no suggestions for the new fields.
- Maintainers conclude the data format is wrong and revert their edits.

This is a developer experience failure, not a build failure — the build passes fine (Zod is the authoritative validator). But it breaks the "editors get CMS-level IntelliSense" guarantee from v1.0.

**Why it happens:**
The JSON Schema files are generated artifacts that require a manual regeneration step. Developers making schema changes focus on the TypeScript/Zod side and forget to regenerate.

**How to avoid:**
- Add `pnpm generate-schemas` as a required step in the plan checklist for every schema change. Make it the first step, before writing any test data.
- Add CI check: `pnpm generate-schemas && git diff --exit-code content/*.schema.json`. If the JSON Schema files differ from what the generator produces, fail the build. This catches stale schemas on every PR.
- Commit the regenerated JSON Schema files in the same commit as the Zod schema change — never in a separate "fix schema" follow-up commit.

**Warning signs:**
- VS Code shows red squigglies on `source: "inspirehep"` entries in `publications.json`.
- `git diff content/publications.schema.json` shows no change after a Zod schema modification.
- A maintainer reports "the file says my data is wrong but it looks right."

**Phase to address:**
Same plan as the schema changes — not a follow-up.

---

### Pitfall 14: Sync failure goes unnoticed for weeks — site serves stale data silently

**What goes wrong:**
The weekly cron Action fails (API downtime, rate limit cascade, Node.js error). The fallback behavior is correct: `content/publications.json` is not updated, the site deploys with last-good data. But if the Action continues failing for 4 weeks in a row, the site is serving January data in April with no visible indicator to maintainers or end users.

GitHub sends cron failure emails to the repo owner only if the `on.schedule` workflow fails — but the default notification setting for many repos is "off" or routed to a generic email the PI rarely checks.

**Why it happens:**
"Fail gracefully" is implemented (last-good JSON), but "fail visibly" is not. Academic maintainers are not monitoring CI dashboards.

**How to avoid:**
- In the Action workflow, after a failure, write a `SYNC_FAILED` marker file or GitHub Actions summary with a clear timestamp. On the next run, if the marker is older than 14 days, escalate to an issue: use `gh issue create` with the label `sync-failure` and tag the repo maintainer.
- Add a "last synced" timestamp to the JSON (as a top-level comment or a `_meta` field): `{ "_meta": { "synced_at": "2026-04-14T03:00:00Z", "status": "ok" }, "publications": [...] }`. The build step can read this and log a warning if `synced_at` is more than 21 days old.
- Configure GitHub Actions notification settings: Settings → Notifications → "Notify me via email when a workflow run fails for workflows I have access to."
- Document in the maintainer guide: "If you haven't seen a new publication in 4+ weeks and you know one was submitted, check Actions → weekly-sync for recent failures."

**Warning signs:**
- The Actions tab shows red for multiple consecutive weeks.
- The `_meta.synced_at` timestamp in `publications.json` is more than 3 weeks old.
- A group member asks "why isn't my new paper showing up?" more than 2 weeks after submission.

**Phase to address:**
GitHub Action implementation — failure visibility must be designed in from the start, not added as a post-launch patch.

---

### Pitfall 15: Author display doesn't link group members to their `/people/[slug]` profiles

**What goes wrong:**
The publications list renders author strings like "Rodríguez, M." and "Gómez, L." as plain text. A visitor to the publications page cannot tell which of these are group members vs. external collaborators. Clicking "Rodríguez, M." does nothing. The `/people/[slug]` pages exist and are linked from the People nav, but there is no cross-link from Publications to People.

The subtler failure: the v1.0 people data uses placeholder names that don't match the exact author strings returned by InspireHEP/arXiv (e.g., `people.json` has "Esteban Calzetta" but InspireHEP returns "E. Calzetta" or "Calzetta, E."). The author-linking logic needs a fuzzy match between the normalized name in `people.json` and the format returned by the API.

**Why it happens:**
The initial UI design renders authors as a flat string. Adding hyperlinking requires cross-referencing the author list against `people.json` at render time, which was not in scope for v1.0 publications rendering.

**How to avoid:**
- On the person record in `people.json`, add a field `author_names: string[]` — the canonical forms of the author's name as they appear in publication records (e.g., `["E. Calzetta", "Calzetta, E.", "Esteban Calzetta"]`). This is maintainer-controlled and avoids fuzzy matching.
- At build time (not runtime), generate a lookup table `{ "E. Calzetta": "esteban-calzetta", "Calzetta, E.": "esteban-calzetta" }` from `people.json`. The publications page uses this to wrap known author names in `<Link href="/people/esteban-calzetta">`.
- Alternatively, accept the simpler MVP: bold group member names (the maintainer controls `author_names`) without hyperlinking. Hyperlinking is a later enhancement.
- The `author_names` field should be optional in the schema — people without it just don't get their name linked.

**Warning signs:**
- Publications page renders all author names as plain text with no visual distinction between group members and external collaborators.
- The `/people/[slug]` page exists but is reachable only via the People nav, not from publication author lists.
- No cross-reference between `people.json` name variants and `publications.json` author strings exists in the codebase.

**Phase to address:**
Integration phase (connecting sync output to the existing publications page component) — design the cross-reference before the publications page is updated to consume the new data.

---

### Pitfall 16: v1.0's 20 curated entries disappear on first sync without an archive decision

**What goes wrong:**
The v1.0 `content/publications.json` contains 20 carefully chosen placeholder publications that shaped the page layout and design. The sync script overwrites this file entirely on first successful run. The 20 entries are:
- Gone from the live site immediately.
- Still in git history (recoverable, but requires a developer).
- No longer "curated" — the sync pulls everything the APIs return.

If a maintainer had manually edited any of these entries (adjusted topic tags, corrected an abstract, added a non-arXiv paper), those edits are lost.

**Why it happens:**
"Replace publications.json with the API output" is the natural implementation of a sync script. The question of what happens to the existing data is not answered until the first run destroys it.

**How to avoid:**
- Decide the migration strategy before writing the sync script:
  - **Option A (recommended for this group):** Archive `content/publications.json` as `content/publications-v10-archive.json` before the first sync. The sync script writes a fresh `content/publications.json`. The old file is preserved in git for reference but not used by the build.
  - **Option B:** The sync script merges API-fetched entries with a `source: "manual"` allow-list in `content/publications-manual.json`. Both files are read at build time. Manual entries are never overwritten.
  - **Option C:** Accept the loss — the 20 v1.0 entries were placeholder data anyway, and the sync replaces them with real data. This is correct only if NO v1.0 entries have been manually edited with real content.
- For this project's context (all v1.0 entries are placeholder data), Option C (clean replacement) is acceptable. Document the decision explicitly in a comment in the sync script.
- In the Action commit message, include "Replaces v1.0 placeholder data on first run" so the git history documents the migration.

**Warning signs:**
- The sync script is written before the migration strategy is decided.
- No backup of `content/publications.json` exists before the first Action run.
- A maintainer asks "where did the old publications go?" after the first successful sync.

**Phase to address:**
Pre-migration planning — the migration decision must be documented in the sync plan before any code is written.

---

### Pitfall 17: Character encoding and Unicode math symbols corrupt in the JSON output

**What goes wrong:**
InspireHEP and arXiv return titles containing Unicode math: "Constraints on σ₈ from CMB-lensing", "The H₀ tension", "f_NL parameter". Some of these use Unicode subscripts (`₈` = U+2088, `₀` = U+2080) which are correctly encoded in the API response. However:
- If the sync script passes through a BibTeX-formatted title that uses `{$\sigma_8$}` instead of `σ₈`, the JSON will contain the LaTeX markup literally.
- If the script serializes with `JSON.stringify` without an explicit `ensureAscii=false` equivalent (Node.js `JSON.stringify` is Unicode-safe by default, but intermediate processing with string slicing/regex on byte buffers can corrupt multi-byte sequences).
- Author names with diacritics (`García`, `López`, `Martínez`) from arXiv's Atom XML may arrive as either pre-composed NFC (`é` = U+00E9) or decomposed NFD (`e` + combining acute). If the existing `people.json` uses NFC and the author-name matching uses string equality, `García` (NFC) ≠ `García` (NFD) — author links break.

**Why it happens:**
The existing v1.0 codebase was written with carefully hand-crafted JSON where encoding is controlled by the editor. API-sourced data introduces external encoding decisions that the sync script may not normalize.

**How to avoid:**
- Always normalize author name strings to NFC before storing: `name.normalize('NFC')`.
- Strip BibTeX markup from titles: a simple regex `title.replace(/\{([^}]+)\}/g, '$1').replace(/\\/g, '')` handles the most common cases. Log titles containing `{` or `\` for manual review.
- Use `JSON.stringify(data, null, 2)` — Node.js serializes Unicode correctly. Avoid any intermediate `Buffer.toString('ascii')` or similar that would corrupt non-ASCII bytes.
- After writing the JSON, run it through `JSON.parse` to verify it round-trips cleanly. A malformed JSON file from encoding corruption will fail the next `pnpm check-content` run — at least the guard catches it.

**Warning signs:**
- A paper title appears as "Constraints on {$\sigma_8$}" in the published site.
- An author name appears as "Garc\u00eda" or with replacement character `?` in the JSON file.
- Two entries for the same person appear with different Unicode normalization forms.

**Phase to address:**
Sync script implementation — encoding normalization must be in the output-writing step, not an afterthought.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Name-based arXiv fallback (no arXiv author ID) | Sync works for all members from day 1 | Contaminates publications list with wrong papers; UX embarrassment | Never — require explicit author IDs |
| Skip InspireHEP pagination (cap at first page) | Simpler script | Senior PI shows 25 of 120 papers; reads as incomplete | Never for PIs; acceptable for students |
| No deterministic JSON sort before committing | Simpler code | Weekly spurious diffs → weekly Vercel rebuilds | Never — 5 lines to sort |
| Leave `publications_selected` field in `PersonSchema` | No migration needed | Vestigial field confuses maintainers; stale references if populated | Acceptable short-term if clearly documented as deprecated |
| Use GITHUB_TOKEN without checking branch protection | Works if no protection exists | Silent 403 on first cron run if protection is added later | Acceptable for private repos with no branch protection |
| Omit `_meta.synced_at` timestamp | Simpler JSON schema | No signal when sync is silently stale for weeks | Never — one extra field |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| InspireHEP author query | Using `INSPIRE-00XXXXX` format in literature search query | Use BAI format (`E.Calzetta.1`) for `q=a+BAI` literature search |
| InspireHEP pagination | Reading only first page (`hits.hits` without checking `hits.total`) | Read `hits.total`, paginate until all fetched or cap reached |
| arXiv author search | Falling back to `au:LastName_F` when no claimed arXiv ID | Skip arXiv for members without a claimed arXiv ID — do not name-search |
| arXiv date field | Using `<updated>` (latest version date) for year grouping | Use `<published>` (version 1 submission date) for arXiv records |
| InspireHEP date field | Using `preprint_date` for journal publications | Prefer `publication_info[0].year` for published papers; fall back to `preprint_date` |
| GitHub Action push | Forgetting `permissions: contents: write` in workflow YAML | Explicit `permissions:` block on the job |
| Vercel unnecessary builds | Pushing even when JSON is byte-identical | `git diff --quiet` check before commit; Vercel Ignored Build Step as backup |
| JSON encoding | Mixing NFC/NFD Unicode in author names | `name.normalize('NFC')` before storing; `JSON.stringify` is Unicode-safe |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `Promise.all` over 15 authors × 2 APIs | 429 errors in CI; partial sync (some authors succeed, some fail) | Concurrency-limited queue (3–5 parallel), 2s inter-batch pause | First Action run |
| `size=1000` for every author | 15 × 500KB responses; slow Action; large `publications.json` | Date-bounded query (last N years) + cap; paginate only if needed | Groups with senior PIs (80+ papers) |
| Loading all 200+ publications for client-side filtering | Slow hydration on `/publications` | Keep publications page server-rendered and grouped by year (already the v1.0 pattern) | At ~100+ publications |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Same Planck paper listed 3× | Publications page looks buggy; peer reviewers notice | Title+arXiv-ID dedup in sync script post-processing |
| All author names are plain text | No way to distinguish group members from external authors | Bold (or link) names that match `author_names[]` from `people.json` |
| ArXiv preprint and InspireHEP published record for same paper both shown | Visitor sees "Preprint" and "Phys. Rev. D" as two separate entries for the identical work | Label clearly; implement arXiv-ID dedup even before full DOI dedup |
| Stale data silently for 4+ weeks | Trust in the website erodes; members assume it's broken | `_meta.synced_at` logged to Action summary; automated issue on multi-week failure |
| 200+ publications dumped without year grouping | Page is an unreadable wall | Year-grouped rendering (already in v1.0 accessor) + "last N years" default |

## "Looks Done But Isn't" Checklist

- [ ] **Sync script rate limit:** Does the script pause between requests? What happens when a 429 is returned — silent drop or retry?
- [ ] **Pagination completeness:** Does the sync log "fetched X of Y total" per author? Does it page correctly for a PI with 100+ papers?
- [ ] **Author ID format validation:** Does the script reject `INSPIRE-00XXXXX` format at startup rather than silently returning wrong results?
- [ ] **arXiv no-fallback policy:** Does the script skip `au:` name search for members without a claimed arXiv ID, or does it use name-based fallback?
- [ ] **Dedup by arXiv ID:** Does a paper fetched for two different group members appear once or twice in the output JSON?
- [ ] **Empty-diff skip:** Does the Action skip the commit when JSON content is byte-identical? Check the diff-check step in the workflow YAML.
- [ ] **Year extraction:** Is `publication_info[0].year` used for InspireHEP journal records, not just `preprint_date`?
- [ ] **Schema backfill:** Do all 20 v1.0 curated entries survive `pnpm check-content` after adding the `source` field?
- [ ] **JSON Schema regenerated:** Does VS Code show no squigglies on `source: "inspirehep"` entries after schema update?
- [ ] **Branch protection / GITHUB_TOKEN:** Did the first manual Action run actually push to main? Check git log.
- [ ] **Encoding:** Does any entry in `publications.json` contain `{$\sigma` or `\\` — BibTeX leakage?
- [ ] **Failure visibility:** If the Action fails, does it create a GitHub issue or send a notification within 2 weeks?
- [ ] **Vercel Ignored Build Step:** Is `git diff HEAD^ HEAD --quiet -- ./content/publications.json` configured in Vercel project settings?
- [ ] **`publications_selected` fate documented:** Is the field deprecated or still referenced from any component?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bad JSON committed to main (encoding corruption) | LOW | `git revert` the sync commit; fix encoding normalization in script; re-run |
| Publications list contaminated with wrong-author papers | MEDIUM | `git revert` sync commit; add author ID validation; require all group members to claim arXiv ID before re-enabling |
| Stale publications.json (sync failing silently for weeks) | LOW | Manually trigger Action via `workflow_dispatch`; if API is down, no action needed; if script is broken, fix and re-trigger |
| Schema + JSON Schema drift (squigglies in VS Code) | LOW | Run `pnpm generate-schemas`; commit regenerated `.schema.json` files |
| Rate limit cascade broke first sync | LOW | Add concurrency limit + retry; re-trigger Action manually |
| GITHUB_TOKEN push blocked by branch protection | LOW | Grant bypass for `github-actions[bot]` in branch protection settings; or switch to PAT secret |
| Senior PI showing 25 of 120 papers | LOW | Add `hits.total` check + pagination loop; re-trigger sync |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 `z.strictObject` rejects `source` on old entries | Schema extension plan | `pnpm check-content` passes on old + new entries |
| #2 Rate limit 429 cascade | Sync script foundation | Action CI run with all 15 authors completes with 0 errors |
| #3 BAI vs INSPIRE-ID format confusion | Sync script foundation (ID validation) | Invalid format logged and skipped, not passed to API |
| #4 `PersonSchema` rejects new fields | Schema extension plan | `pnpm check-content` passes after adding `arxiv_id` + `inspirehep_id` |
| #5 GITHUB_TOKEN push blocked | GitHub Action implementation | Manual Action run pushes commit to main |
| #6 Empty-diff spurious Vercel rebuild | GitHub Action implementation | Two consecutive Action runs with no API change produce no Vercel build |
| #7 Wrong year from preprint_date | Sync script implementation | Published journal paper shows journal year, not arXiv submission year |
| #8 Name-based arXiv returns wrong-author papers | Sync script foundation | Members without `arxiv_id` produce 0 arXiv entries (not polluted list) |
| #9 Pagination truncation | Sync script implementation | Senior PI shows correct full count; Action summary logs "X of Y" |
| #10 Collaboration paper duplicated per-author | Sync script implementation | Planck paper appears once in output JSON |
| #11 tsx path aliases break in Action | GitHub Action implementation | Action `run:` step succeeds with `npx tsx` |
| #12 `publications_selected` stale references | Migration plan | Field deprecated or validator active |
| #13 JSON Schema stale after Zod change | Schema extension plan (CI check) | `pnpm generate-schemas && git diff --exit-code` passes in CI |
| #14 Sync failure unnoticed | GitHub Action implementation | Failure creates issue or Action summary after 14-day silence |
| #15 Author names not linked to profiles | Integration plan (publications page update) | Group member names visually distinct on `/publications` |
| #16 v1.0 entries deleted without archive decision | Pre-migration plan | Migration strategy documented and committed before first sync |
| #17 Unicode encoding corruption | Sync script implementation | No `{$\` patterns in output JSON; round-trip JSON.parse succeeds |

## Sources

**HIGH confidence (live API verification + official docs):**
- [InspireHEP REST API documentation](https://github.com/inspirehep/rest-api-doc/blob/master/README.md) — rate limits (15 req/5s window), max size 1000, 10,000 total result cap
- [InspireHEP live API query](https://inspirehep.net/api/literature?sort=mostrecent&size=3&q=a+E.Calzetta.1) — verified BAI format, `preprint_date` and `earliest_date` field names, `publication_info`, pagination `links.next` structure
- [arXiv API User's Manual](https://info.arxiv.org/help/api/user-manual.html) — `<published>` = v1 submission date, `<updated>` = latest version date, max 30,000 results, "3 second delay" recommendation
- [arXiv Author Identifiers](https://info.arxiv.org/help/author_identifiers.html) — accents stripped to ASCII in IDs; opt-in claiming system; `garcía` → `garcia`
- [arXiv blog: Search v0.2 and names](https://blog.arxiv.org/2018/05/04/release-search-v0-2-some-notes-on-names/) — name disambiguation limitations, false positive risk with initial-only search
- [Vercel Ignored Build Step](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel) — `git diff HEAD^ HEAD --quiet` syntax, shallow clone depth 10
- [GitHub GITHUB_TOKEN documentation](https://docs.github.com/en/actions/concepts/security/github_token) — `contents: write` vs branch protection bypass distinction
- [GitHub Actions branch protection discussion](https://github.com/orgs/community/discussions/25305) — GITHUB_TOKEN cannot push to protected branches

**MEDIUM confidence (community + official adjacent):**
- [Zod v4 changelog](https://zod.dev/v4/changelog) — `z.strictObject` behavior, optional field migration
- [InspireHEP INSPIRE ID vs BAI format](https://help.inspirehep.net/knowledge-base/inspire-paper-search/) — BAI format `M.Smith.1` for literature search; INSPIRE-00XXXXXX for author endpoint

---
*Pitfalls research for: v1.1 arXiv + InspireHEP publication sync added to existing Next.js 16 bilingual academic site*
*Researched: 2026-04-18*
