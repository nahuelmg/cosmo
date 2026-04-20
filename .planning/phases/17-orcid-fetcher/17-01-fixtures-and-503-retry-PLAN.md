---
phase: 17-orcid-fetcher
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/fixtures/orcid-works-tomas.json
  - scripts/fixtures/orcid-work-sipm.json
  - scripts/sync-publications.ts
  - scripts/sync-publications.test.ts
autonomous: true

must_haves:
  truths:
    - "Unit tests can import real ORCID response fixtures from scripts/fixtures/"
    - "fetchWithRetry retries on HTTP 503 (ORCID burst-exceed) in addition to 429"
    - "Existing 76/76 unit tests still pass after the retry-condition change"
  artifacts:
    - path: "scripts/fixtures/orcid-works-tomas.json"
      provides: "Live works-list response for Tomas's ORCID — used by 17-02 extraction tests"
      contains: '"put-code":156875914'
    - path: "scripts/fixtures/orcid-work-sipm.json"
      provides: "Live per-work detail response for the SiPM paper — used by 17-03 enrichment tests"
      contains: '"10.1016/j.nima.2020.164490"'
    - path: "scripts/sync-publications.ts"
      provides: "fetchWithRetry with extended retry predicate (429 OR 503)"
      contains: "status === 429 || response.status === 503"
    - path: "scripts/sync-publications.test.ts"
      provides: "New vitest case proving 503 retry behaviour"
      contains: 'retries on 503'
  key_links:
    - from: "scripts/sync-publications.ts:fetchWithRetry"
      to: "HTTP 503 responses"
      via: "extended retry predicate"
      pattern: "status === 429 \\|\\| .*status === 503"
---

<objective>
Set up the two research-captured ORCID JSON fixtures inside the repo and extend
`fetchWithRetry` to also retry on HTTP 503 (ORCID's documented burst-exceed status).
This is independent utility work that unblocks plans 17-02 (needs fixtures for extraction
tests) and 17-03 (needs fixtures for enrichment tests + relies on retry handling ORCID's
503 burst response).

Purpose: Land the two small pieces of groundwork so the extraction plan (17-02) and
enrichment plan (17-03) can both treat ORCID's edge cases (real API shapes, 503 bursts)
as solved problems. Keeps each of those plans focused on one behaviour.

Output:
- `scripts/fixtures/orcid-works-tomas.json` — verbatim copy of `/tmp/orcid-tomas-works.json`
- `scripts/fixtures/orcid-work-sipm.json` — verbatim copy of `/tmp/orcid-tomas-sipm.json`
- One-line change to `fetchWithRetry` retry condition + new vitest case
- Existing full test suite still green
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/17-orcid-fetcher/17-RESEARCH.md
@scripts/sync-publications.ts
@scripts/sync-publications.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Copy ORCID fixtures into scripts/fixtures/</name>
  <files>
    scripts/fixtures/orcid-works-tomas.json
    scripts/fixtures/orcid-work-sipm.json
  </files>
  <action>
    Create directory `scripts/fixtures/` if it does not exist.

    Copy `/tmp/orcid-tomas-works.json` → `scripts/fixtures/orcid-works-tomas.json` verbatim.
    Copy `/tmp/orcid-tomas-sipm.json` → `scripts/fixtures/orcid-work-sipm.json` verbatim.

    DO NOT re-format, re-indent, or re-encode. These are real live responses captured
    during 17-RESEARCH.md and their byte-exact shape is what we want to test against.
    Use `cp` (Bash), not the Read/Write tools, to preserve encoding.

    Sanity check after copy:
    - `orcid-works-tomas.json` must contain `"put-code":156875914` and the DOI
      `10.1016/j.nima.2020.164490` (the SiPM paper).
    - `orcid-work-sipm.json` must contain `"contributors":{"contributor":[...]}` and
      the string `"Tomás Ferreira Chase"` somewhere in the contributor list.

    Rationale: research captured these as the ground-truth shapes; both 17-02
    (extraction) and 17-03 (enrichment) will import them in Vitest tests, avoiding
    the drift of hand-written fixtures.
  </action>
  <verify>
    `ls scripts/fixtures/` shows both files non-empty.

    `grep '"put-code":156875914' scripts/fixtures/orcid-works-tomas.json` returns a match.

    `grep '10.1016/j.nima.2020.164490' scripts/fixtures/orcid-work-sipm.json` returns a match.

    `grep 'Tomás Ferreira Chase' scripts/fixtures/orcid-work-sipm.json` returns a match
    (UTF-8 accented character intact).

    Both files parse as valid JSON:
    `node -e "JSON.parse(require('fs').readFileSync('scripts/fixtures/orcid-works-tomas.json'))"`
    exits 0.
    `node -e "JSON.parse(require('fs').readFileSync('scripts/fixtures/orcid-work-sipm.json'))"`
    exits 0.
  </verify>
  <done>
    Both fixture files exist under `scripts/fixtures/`, parse as JSON, and contain the
    expected ground-truth markers (SiPM put-code, DOI, and contributor name).
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend fetchWithRetry to also retry on HTTP 503</name>
  <files>scripts/sync-publications.ts</files>
  <action>
    In `scripts/sync-publications.ts`, locate `fetchWithRetry` at lines 161–185.

    The current retry condition (line 174) reads:
    ```typescript
    if (response.status === 429 && attempt < maxRetries) {
    ```

    Change it to retry on either 429 OR 503:
    ```typescript
    if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
    ```

    Update the verbose retry log message on line 177 so it names the status it's retrying:
    ```typescript
    process.stderr.write(`  ${response.status} — retry ${attempt + 1}/${maxRetries} in ${delay}ms\n`);
    ```
    (Replace the hard-coded `429` with `${response.status}`.)

    Update the JSDoc block above `fetchWithRetry` (lines 155–160) to mention 503:
    ```
     *  - Exponential backoff on HTTP 429 or 503 (2s → 4s → 8s, capped at 30s)
    ```

    Rationale (17-RESEARCH.md Pitfall 2): ORCID's anonymous API returns **503** on
    burst-exceed, not 429 like arXiv/InspireHEP. This one-line expansion of the retry
    predicate benefits all three services at zero risk — arXiv/InspireHEP emit 503 only
    on actual downtime, where a brief retry is exactly the right behaviour.

    Do NOT change the backoff schedule, max retries, or any other behaviour. Do NOT
    introduce a per-service retry config — keep the shared wrapper simple.

    Do NOT touch `fetchInspireHEP`, `fetchArXiv`, or the stub `fetchOrcid` in this plan.
  </action>
  <verify>
    `grep 'response.status === 429 || response.status === 503' scripts/sync-publications.ts`
    returns exactly one match (inside `fetchWithRetry`).

    `grep -n '429 — retry' scripts/sync-publications.ts` returns no matches (the
    hard-coded 429 in the log message is gone).

    `pnpm tsc --noEmit` passes cleanly.

    `pnpm vitest run scripts/sync-publications.test.ts` still passes the existing 76/76
    suite.
  </verify>
  <done>
    `fetchWithRetry` retries on both 429 and 503, type-checks cleanly, and existing
    tests still pass.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add vitest case proving 503 retry behaviour</name>
  <files>scripts/sync-publications.test.ts</files>
  <action>
    Add a new describe block to `scripts/sync-publications.test.ts` that exercises the
    503 retry path.

    Use `vi.spyOn(globalThis, 'fetch')` (Vitest's built-in) to mock fetch. The test
    should:
    1. Return a 503 Response on the first call and a 200 Response (`new Response('{}', { status: 200 })`)
       on the second call.
    2. Call `fetchWithRetry('https://example.test/any', undefined, /* maxRetries */ 2, /* baseDelayMs */ 1)`
       — use `baseDelayMs: 1` so the backoff doesn't slow the test.
    3. Assert the final response `.status === 200`.
    4. Assert `fetch` was called exactly twice (i.e., the 503 triggered exactly one retry).
    5. Restore the spy after the test.

    Also add a negative case: if 503 persists across all retries, `fetchWithRetry`
    returns the 503 Response (it does NOT throw — current contract). Assert
    `res.status === 503` and fetch was called `maxRetries + 1` times.

    Place the new describe block near the top of the file, between the existing
    `stripBibTeX` describe (around line 22) and `inspireHitToPublication` describe —
    i.e., grouped with other utility tests. Import `fetchWithRetry` from the existing
    import list at the top of the file (add it to the existing `import { ... } from "./sync-publications"`).

    Keep the tests minimal (these two cases). Do NOT re-test the 429 path — it is
    covered implicitly by the 429-or-503 predicate.

    Rationale: locks in the Pitfall 2 fix against regression. The cost is ~15 lines of
    test code for coverage of a class of failure that would otherwise only surface in
    live ORCID sync runs.
  </action>
  <verify>
    `grep "retries on 503" scripts/sync-publications.test.ts` returns at least one match.

    `pnpm vitest run scripts/sync-publications.test.ts` passes — total test count goes
    from 76 to at least 78 (two new cases added).

    Both new cases appear in the test output.
  </verify>
  <done>
    Two new vitest cases (happy-path retry + exhausted-retries fallthrough) prove
    `fetchWithRetry` handles 503 correctly. Full suite still green.
  </done>
</task>

</tasks>

<verification>
End-of-plan gates:
1. `ls scripts/fixtures/` — two non-empty JSON files present.
2. `pnpm tsc --noEmit` — zero errors.
3. `pnpm vitest run scripts/sync-publications.test.ts` — green; count ≥ 78.
4. `grep 'response.status === 429 || response.status === 503' scripts/sync-publications.ts` — exactly one match.
5. `git status` clean after the three atomic commits.
</verification>

<success_criteria>
- `scripts/fixtures/orcid-works-tomas.json` and `scripts/fixtures/orcid-work-sipm.json`
  exist and are parseable JSON carrying the SiPM ground-truth markers.
- `fetchWithRetry` in `scripts/sync-publications.ts` retries on both 429 and 503 with
  a single predicate expression.
- New vitest cases for the 503 retry (happy path + exhausted retries) pass.
- Existing test suite remains green (no behaviour regression for 429 path or other
  fetchers).
- Three atomic commits landed:
  1. `test(17-01): add scripts/fixtures/ with ORCID works + SiPM detail fixtures`
  2. `feat(17-01): retry on HTTP 503 in fetchWithRetry (ORCID burst-exceed)`
  3. `test(17-01): cover 503 retry path in fetchWithRetry`
</success_criteria>

<output>
After completion, create `.planning/phases/17-orcid-fetcher/17-01-SUMMARY.md` summarising:
- Which fixtures were copied and their byte sizes
- The exact 1-line change to `fetchWithRetry`
- New test count (before/after)
- Any incidental tweaks

Use the template at `/home/tomas/.claude/get-shit-done/templates/summary.md`.
</output>
