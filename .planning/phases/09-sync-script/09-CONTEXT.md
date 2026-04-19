# Phase 9: Sync Script - Context

**Gathered:** 2026-04-19
**Status:** Ready for research / planning

<domain>
## Phase Boundary

A local Node script (`pnpm sync-publications`) that:
1. Reads `content/people.json` for each current PI, postdoc, and PhD with `inspirehep_id` and/or `orcid_id` populated
2. Queries InspireHEP (BAI via `inspirehep_id`) and arXiv (ORCID via `orcid_id`)
3. Extracts, normalizes, deduplicates, and sorts the combined result
4. Validates the final array with `PublicationsSchema.safeParse` in memory
5. On success: writes `content/publications.json` with `_meta` block
6. On upstream network failure: exits 1 without writing (last-good preserved)

**In scope:** the script's CLI surface, runtime behavior, logging, failure semantics, and the `_meta` block shape it produces.

**Out of scope:** GitHub Actions wiring (Phase 10), UI changes that consume `_meta` (Phase 11), per-person exclude lists (v1.2), cross-source DOI dedup (explicitly ruled out in v1.1 locked decisions).

</domain>

<decisions>
## Implementation Decisions

### CLI surface

- **Default invocation is flagless:** `pnpm sync-publications`. This is the CI path — zero flags, one behavior.
- **Human escape hatches (opt-in only):**
  - `--dry-run` — fetches, parses, validates, logs what *would* be written, exits 0 without touching `content/publications.json`. Useful for CI pre-flight and local debugging.
  - `--member <slug>` — only fetch for that one person. **Must not write to `content/publications.json`** (corruption risk). Writes to `scripts/tmp/sync-<slug>.json` (git-ignored) or stdout — planner picks.
  - `--no-arxiv` / `--no-inspire` — skip that source for this run. Entries from the skipped source are **absent** from the new file — no "carry over last-good" merge. This aligns with the "fatal on network failure, no write" rule: partial data by source-skip is an explicit operator decision, not an implicit failure mode. `_meta.sources` reflects what actually ran.
  - `--verbose` — adds HTTP-request-level logging on top of the default output.
- **Flag parser:** Claude's discretion. `node:util`'s `parseArgs` is likely sufficient (zero dependency). A heavier library (commander/yargs) is overkill for ≤5 flags.

### Logging & output

- **Default verbosity:** per-member progress line as each member completes. Example shape:
  ```
  Syncing 14 members…
  ✓ Acuña — InspireHEP: 42, arXiv: 38, merged: 45
  ✓ Calzetta — InspireHEP: 120, arXiv: skipped (no orcid_id), merged: 120
  …
  Sync complete: 287 publications (3 added, 1 removed, 283 unchanged, 2 warnings)
  ```
- **`--verbose`** adds per-HTTP-request logs (URL, status, timing) interleaved.
- **Summary line format:** `counts + warnings`. Shape: `Sync complete: <N> publications (<X> added, <Y> removed, <Z> unchanged, <W> warnings)`. Timing and per-source breakdown are `--verbose`-only.
- **Stream split:** progress lines and summary on **stdout**; warnings on **stderr** (`console.warn`). CI logs interleave both by timestamp.
- **No color/emoji requirements** — Claude's discretion on visual polish. The `✓` above is illustrative, not prescriptive.

### Failure granularity

The locked rule from v1.1 decisions: **"exits 1 without writing anything if any upstream request fails"** — file-level atomicity, no per-member last-good merge. Within that rule:

| Scenario | Treatment | Writes? |
|----------|-----------|---------|
| InspireHEP returns 404 or empty for one member's BAI | **Warning** — "No InspireHEP results for [name]", skip contribution, continue | Yes (if rest of run succeeds) |
| arXiv returns 404 or empty for one member's ORCID | **Warning** — same as above | Yes (if rest of run succeeds) |
| Member has `inspirehep_id` but no `orcid_id` | **Warning** — "skipping arXiv for [name]: no orcid_id", query Inspire only | Yes (if rest of run succeeds) |
| Member has neither ID | **Warning** — "skipping [name]: no sync IDs", no queries issued | Yes (if rest of run succeeds) |
| Network timeout / 5xx after exhausting `AbortSignal.timeout(10_000)` + 429 exp-backoff retries | **Fatal** — exit 1, no write | No |
| `PublicationsSchema.safeParse(result)` returns `success: false` | **Fatal** — print Zod errors, exit 1, no write | No |
| Startup-time BAI format validation fails (e.g., `INSPIRE-00XXXXXX` passed instead of BAI) | **Fatal** — exit 1 before any network request | No |

**Rationale for 404=warning:** a 404 on a BAI *could* be a typo, but it could also legitimately mean "this member has no papers yet" or "this member is new to InspireHEP". Failing the run on one warning-worthy condition would block everyone else's publications. The cron runs weekly; a persistent 404 will show up in the warnings summary for the maintainer to investigate, but doesn't block the whole dataset.

**Rationale for network-failure=fatal:** preserves Pitfall 2 (file-level atomicity). A weekly cron retries naturally; no per-member reconciliation logic to maintain.

### `_meta` block shape

Stored as a top-level key inside `content/publications.json`. The current v1.0 shape is a bare array; Phase 9 changes the file shape to `{ _meta: {...}, publications: [...] }`. **This is a schema concern** — planner must decide whether to (a) extend `PublicationsSchema` to a file-level object, or (b) introduce a separate `PublicationsFileSchema` that wraps the existing array. Planner picks; either is acceptable.

**`_meta` fields:**

```ts
_meta: {
  synced_at: string   // ISO-8601 UTC, e.g. "2026-04-19T06:00:00Z" — drives PUBS-08 staleness indicator
  sources: ("inspirehep" | "arxiv")[]   // which sources actually ran this sync (respects --no-* flags)
  counts: {
    inspirehep: number
    arxiv: number
    manual: number   // entries with source="manual" carried from v1.0
  }
  warnings: string[]  // flat strings, stderr output captured verbatim (e.g. "skipped arXiv for E. Calzetta: no orcid_id")
}
```

**Explicitly excluded from `_meta`:**
- `total` — derive from `publications.length` at display time
- `synced_date` (human-readable) — Phase 11 formats `synced_at` into locale-aware text
- `script_sha` / version — not needed for v1.1; revisit if diagnosing extraction regressions
- Structured warnings (`{ code, member_slug, message }`) — start with flat strings; structure can be added in v1.2 if Phase 11 UI needs filtering

### Claude's Discretion

- `--member`'s exact output sink (`scripts/tmp/sync-<slug>.json` vs stdout vs both)
- Flag-parser choice (`node:util parseArgs` vs tiny third-party)
- Colour/emoji in progress lines
- Progress-line exact columns and spacing
- How `counts.manual` is computed (from source-tagged entries in the fetched+merged result, since manual entries are preserved pass-through in 09-02)
- Whether `_meta` lives in `PublicationsSchema` vs a wrapping `PublicationsFileSchema`

</decisions>

<specifics>
## Specific Ideas

- **"Feels like pg_dump"** (carried from Phase 8 / cosmo CLI sensibility): familiar to database people, works headless in CI, no interactive prompts, clean exit codes. Per-member progress lines ≈ pg_dump's `INFO:` lines.
- **Visible-in-CI-logs is the design axis** — the per-member progress line choice (over silent) is driven by "when CI fails, the logs should tell you *which member* broke it without `--verbose`".
- **Warnings on stderr, summary on stdout** lets a CI yaml step capture `stdout > summary.txt` for the step summary while stderr still renders inline — no awkward log splitting in the workflow file.

</specifics>

<deferred>
## Deferred Ideas

- **`--allow-partial` flag** (override fatal network-failure rule per-run) — would violate Pitfall 2; revisit only if a real multi-week outage forces the question.
- **Structured warnings** (`{ code, member_slug, message }`) — start with flat strings; Phase 11 UI or v1.2 audit tooling can motivate structure later.
- **`_meta.script_sha` / version** — defer until a regression forces the need for commit-level diagnostics.
- **Human-readable `synced_date`** — Phase 11's display layer formats the ISO timestamp; no need to bake a second representation into the JSON.
- **Per-member last-good merge on network failure** — would require reading existing `publications.json` and splicing unchanged members back in on partial failure. Adds reconciliation complexity and masks ongoing outages. Do not implement. (Override candidate only if a real outage scenario makes this unavoidable.)
- **Cross-source DOI dedup** — explicitly ruled out in v1.1 locked decisions; entries remain source-tagged. Phase 11 UI filter toggle is the escape hatch.
- **`--since <date>` incremental sync** — InspireHEP/arXiv don't guarantee stable modification stamps across their APIs; full-refresh is reliable. Revisit if query latency becomes a cron problem.

</deferred>

---

*Phase: 09-sync-script*
*Context gathered: 2026-04-19*
