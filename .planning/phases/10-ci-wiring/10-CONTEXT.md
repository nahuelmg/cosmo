# Phase 10: CI Wiring - Context

**Gathered:** 2026-04-19
**Status:** Ready for research / planning

<domain>
## Phase Boundary

A GitHub Actions workflow (`.github/workflows/sync-publications.yml`) that:
1. Runs on a weekly Monday cron (`0 6 * * 1` UTC) and on manual `workflow_dispatch`
2. Invokes `pnpm sync-publications`, then `pnpm validate-content` as a schema gate
3. Uses `git diff --quiet content/publications.json` to decide whether to commit
4. When content changed: commits only `content/publications.json` as `github-actions[bot]` with message `chore(publications): sync weekly feed [skip ci]`, and pushes to `main`
5. When nothing changed: logs "No changes — skipping commit" in the step summary
6. Emits a one-line delta + `_meta.synced_at` footer to `$GITHUB_STEP_SUMMARY` on success; warnings (if any) listed in the same summary; exit-1 runs show up as red-X in the Actions tab and trigger GitHub's default email-to-owner

**In scope:** the workflow YAML, its trigger config, permissions block, step ordering, commit identity/message/skip-marker, step summary shape, and the first manual `workflow_dispatch` to prove the mechanics (including any branch-protection handling).

**Out of scope:** changes to `scripts/sync-publications.ts` (Phase 9 artifact), UI consumption of `_meta.synced_at` (Phase 11 PUBS-08), auto-issue creation / external notifications (deferred), retry-on-consecutive-failure escalation (deferred).

</domain>

<decisions>
## Implementation Decisions

### Commit style

- **Committer identity:** `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>`. Standard GitHub Actions committer — no PAT, no custom bot account to maintain, clearly machine-authored in `git log`.
- **Commit message:** `chore(publications): sync weekly feed [skip ci]` — plain and consistent. No delta counts in the subject (those live in the step summary where they're richer and don't clutter git history).
- **`[skip ci]` marker:** **yes**, included in the commit message to prevent the push from re-triggering other push-based workflows (lint, build). Vercel deploys are unaffected — Vercel listens to the GitHub push event, not to CI status.
- **Files committed:** **only `content/publications.json`**. The sync script must never touch lockfiles, schemas, or other content files in the same run. If incidental drift appears in `git status`, it's a bug — the workflow fails loud rather than auto-reconciling.

### Failure notification

- **Primary channel:** GitHub-native only. Failed runs show as red X in the Actions tab; GitHub's default behavior emails the repo owner on workflow failure. Zero extra infrastructure.
- **Consecutive-failure escalation:** none. Every failure looks the same. Rationale: weekly cron means "2 consecutive fails" = 14 days of staleness, which the site's PUBS-08 staleness indicator (Phase 11) already surfaces to visitors.
- **Warnings:** non-fatal, listed inside the step summary on otherwise-green runs. No commit comments, no warning-threshold that turns warnings into errors (one member's typo must never block the whole group's sync).
- **Schema failure (`PublicationsFileSchema.safeParse` rejects output):** fail loud with exit 1, **preserve last-good `content/publications.json` in the repo**. The sync script's write-gate already enforces this; the workflow just surfaces the exit code. Maintainer investigates via workflow logs (Zod errors printed to stderr by the script).

### Step summary shape

- **Success line:** the SYNC-15 summary from the sync script, one line. Shape:
  ```
  Sync: +3 -1 ≡283 (2 warnings)
  ```
  `+added -removed ≡unchanged (W warnings)`. No per-member breakdown in the summary (already available in stdout logs).
- **No-change run:** summary shows literally `No changes — skipping commit` on a single line. Matches SC1.
- **Warnings section:** when `W > 0`, a `## Warnings` heading followed by bulleted warnings (from sync stderr). No grouping, no filtering — flat list.
- **Diff preview (titles of added/removed papers):** not included. Counts only — maintainer clicks through to the commit diff for titles.
- **Footer:** `Synced at 2026-04-19T06:00:00Z` — the `_meta.synced_at` value. Disambiguates re-runs of identical-content data (same delta, different timestamp) and mirrors what users see via PUBS-08.

### Push strategy

- **Branch protection (current state):** user confirmed `main` has **no** protection — direct push works. The workflow pushes to `main` with no intermediate branch, no PR.
- **If branch protection is introduced later:** add `github-actions[bot]` to the bypass allowlist in repo settings → Branches → [rule for `main`]. PR flow is explicitly **not** chosen (stale-PR pileup is the failure mode, not a feature).
- **First-run validation:** trigger a manual `workflow_dispatch` immediately after the workflow YAML is merged — watch logs, verify push lands on `main`, iterate on config if the push is rejected (permission, token scope, or branch-protection issues). No staging branch, no dry-run-first.
- **Permissions block:** `permissions: { contents: write }` only. No `issues: write` (we chose not to auto-open issues on failure). Least-privilege is enforced by GitHub's default `permissions: read-all` at the workflow-trigger level — the job-level override is the only thing granting write access.

### Claude's Discretion

- Exact step ordering within the workflow (checkout / setup-node / setup-pnpm / install / sync / validate / diff / commit / push / summary) — planner/researcher picks a canonical ordering.
- Whether to use `actions/checkout@v4` vs `v5`, `pnpm/action-setup` version, `setup-node` version — pick current stable at plan time.
- How `_meta.synced_at` is extracted into the step summary footer (jq? node inline script? separate step?) — any approach that doesn't add a dependency.
- Concurrency group shape (if any) — reasonable default: `group: sync-publications`, `cancel-in-progress: false` so a manual dispatch never aborts a cron mid-run.
- Timeout on the sync job — reasonable default: `timeout-minutes: 15` (sync takes <2 min per member × 14 members with concurrency=5, plus retries).
- Emoji / styling in step summary headings — light touch at planner's discretion.

</decisions>

<specifics>
## Specific Ideas

- **Phase 9 latent bug flagged during verification:** `inspireHitToPublication` in `scripts/sync-publications.ts` produces `journal: ""` when `publication_info[0]` has all-null fields (e.g., a member with only preprint-stage papers). The write-gate correctly refuses such output, but in CI this means red X instead of green on the first full-group run. **Phase 10 should include a preflight fix as task zero** — one-line change: `|| "Preprint"` fallback. Not a scope expansion — this is Phase 9 polish surfaced too late to fold in cleanly. Decision on the fallback string (`"Preprint"` vs `"Unpublished"` vs `undefined` + schema `.optional()`) is a data decision the planner should propose a default on.

- **DATA-09/10 still partial:** only `tomas-ferreira-chase` has `inspirehep_id` + `orcid_id` populated today. 13 members remain without sync IDs. First `workflow_dispatch` will run with the current (minimal) dataset — this is intentional. The full-group E2E stress test (pagination, concurrency limits, larger warning list) happens on a follow-up after the data commit lands. Phase 10 must not wait on DATA-09/10 completion — CI wiring is independent of data breadth.

- **First-run push validation is the real test of this phase.** Cron on a Monday happens on its own schedule; the maintainer triggers `workflow_dispatch` *today* and watches it end-to-end. If it lands on `main` and Vercel deploys once (on content change) or skips (on no-change), CI-01 through CI-04 are satisfied by observation. Any push rejection → back to Push strategy to work around.

- **Vercel deploy behavior is a silent SC:** SC4 asks to "confirm by reviewing Vercel deploy history after two consecutive workflow runs." This is observational, not a workflow task — no Vercel integration code to write.

</specifics>

<deferred>
## Deferred Ideas

- **Auto-open GitHub Issue on failure** — nice for traceability but adds `issues: write` scope + state tracking (avoid duplicate issues per persistent outage). Revisit if GitHub's email-on-failure proves insufficient in practice (e.g., maintainer misses failures).
- **External notification (Slack / webhook)** — zero value until someone is actually on-call for sync failures. Out of scope for v1.1.
- **Consecutive-failure escalation (`@-mention` after 2 fails)** — requires state persistence between runs (issue lookup, label tracking). Low-urgency given the weekly cadence and the visitor-facing staleness indicator.
- **Warnings-threshold-as-error** — risky: one member's ID typo could block the whole group. Deferred permanently unless a specific failure mode motivates it.
- **Collapsible `<details>` diff preview with paper titles** — the commit diff is already one click away; this would duplicate that view inside the step summary at the cost of extra parsing in the workflow.
- **PR-based sync flow (instead of direct push)** — only reconsidered if direct-push breaks because of future branch protection, and the bypass allowlist is also unavailable.
- **Staging branch / dry-run-first push validation** — the actual-push-to-main iteration loop is fast enough; the extra indirection isn't worth the setup.
- **Deploy gating** (e.g., only deploy Vercel on content change via custom webhook) — Vercel's default push-based trigger already matches our commit-only-on-change behavior; no custom gating needed.

</deferred>

---

*Phase: 10-ci-wiring*
*Context gathered: 2026-04-19*
