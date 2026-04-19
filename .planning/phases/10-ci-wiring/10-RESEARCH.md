# Phase 10: CI Wiring - Research

**Researched:** 2026-04-19
**Domain:** GitHub Actions — scheduled sync workflow with commit-on-change and step summary
**Confidence:** HIGH (all critical claims verified via official GitHub docs, action READMEs, and direct code inspection)

---

## Summary

Phase 10 wires a GitHub Actions workflow that runs `pnpm sync-publications`, validates output, commits `content/publications.json` only when it changes, and surfaces a delta summary in the Actions step summary UI. The workflow is entirely standard GHA idioms — no custom actions or external dependencies needed beyond the three action pins below.

The key finding is that **`GITHUB_TOKEN` push events do not trigger new workflow runs** (GitHub's built-in loop prevention), making `[skip ci]` belt-and-suspenders rather than strictly necessary — but it IS necessary to suppress Vercel rebuild on content-identical pushes (Vercel listens to push events directly, not to CI status, and does NOT natively respect `[skip ci]`). Our commit-only-on-change guard makes this a non-issue in practice.

A **task-zero preflight fix** is required: `inspireHitToPublication` in `scripts/sync-publications.ts` emits `journal: ""` when `publication_info[0]` exists but has all-null fields. `PublicationSchema` rejects empty strings (`z.string().min(1)`), causing the write gate to exit 1 on first full-group CI run.

**Primary recommendation:** Pin `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, Node 20 (matches project's `.nvmrc` and `engines`). Use `validate-content` (not `check-content`). Capture warnings to stderr file; tee sync stdout; use `jq` (pre-installed on `ubuntu-latest`) to extract `_meta.synced_at`. Step summary written via `>> $GITHUB_STEP_SUMMARY`.

---

## Standard Stack

### Core Actions
| Action | Tag | Purpose | Why This Version |
|--------|-----|---------|-----------------|
| `actions/checkout` | `@v4` | Checkout repo with auth token | v4 is widest-adopted stable; v5/v6 add Node 24 runtime and new credential storage but require runner ≥ v2.327.1/v2.329.0. v4 works everywhere, no breaking changes for this use case. |
| `pnpm/action-setup` | `@v4` | Install pnpm | v4 is current stable tag for `pnpm/action-setup`; v5.0.0 released March 2026 but ecosystem tooling (e.g. pnpm.io docs) still shows v4 examples. v4 supports `packageManager` auto-detection. Requirements says `@v5` — either works; v4 is safe. |
| `actions/setup-node` | `@v4` | Set Node version and pnpm cache | v4 stable (latest is v6.3.0 but v6.0.0 limited auto-cache to npm only, breaking pnpm cache in `setup-node` itself — use v4 where `cache: 'pnpm'` works reliably). |

### Node Version
Use **Node 20** (`.nvmrc` = `20`, `package.json engines.node` = `"20.x"`). REQUIREMENTS.md says "Node 22" but that was written before the project pinned Node 20. Using Node 22 in CI while the project runs on 20 locally is an unnecessary divergence. Do not change the Node version in this phase.

### pnpm Version
No `packageManager` field in `package.json` — must specify version explicitly in the action. Current project pnpm version: **10.33.0** (from local environment). Use `version: '10'` (major-range) in `pnpm/action-setup` so minor/patch auto-updates are safe; or pin to `10.33.0` for full reproducibility. Lockfile version is `9.0` which is compatible with pnpm 10.x.

**Installation:**
```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v4
  with:
    version: '10'
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
- run: pnpm install --frozen-lockfile
```

---

## Architecture Patterns

### Recommended Workflow Structure
```
.github/
└── workflows/
    └── sync-publications.yml
```

### Canonical Step Order

The order below reflects these constraints:
- pnpm must be installed before Node can cache the pnpm store (setup-node reads pnpm store path)
- Install must come before any `pnpm run` commands
- Sync runs before validate (validate checks the output of sync)
- Diff check runs after validate (no point diffing if validation failed)
- Commit/push only if diff detected
- Summary written last (with `if: always()` so it runs even on failure)

```
1. checkout          — fetch repo + configure GITHUB_TOKEN auth for git push
2. pnpm/action-setup — install pnpm CLI
3. setup-node        — set Node version, cache pnpm store
4. pnpm install      — restore/install dependencies
5. sync              — run pnpm sync-publications (tee stdout, capture stderr)
6. validate          — run pnpm validate-content (independent gate)
7. diff-check        — git diff --quiet content/publications.json → set output
8. git config        — set committer identity (only runs if changed=true)
9. git add + commit  — stage only publications.json, commit (only if changed=true)
10. git push         — push to main (only if changed=true)
11. summary          — write $GITHUB_STEP_SUMMARY (if: always())
```

### Complete Workflow YAML Pattern

```yaml
name: Sync Publications

on:
  schedule:
    - cron: '0 6 * * 1'   # Monday 06:00 UTC
  workflow_dispatch:

concurrency:
  group: sync-publications
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '10'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run sync script
        id: sync
        run: |
          pnpm sync-publications > /tmp/sync-stdout.txt 2>/tmp/sync-stderr.txt
          cat /tmp/sync-stdout.txt
          cat /tmp/sync-stderr.txt >&2

      - name: Validate content
        run: pnpm validate-content

      - name: Check for changes
        id: diff
        run: |
          if git diff --quiet content/publications.json; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Configure git identity
        if: steps.diff.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Commit changes
        if: steps.diff.outputs.changed == 'true'
        run: |
          git add content/publications.json
          git commit -m "chore(publications): sync weekly feed [skip ci]"

      - name: Push to main
        if: steps.diff.outputs.changed == 'true'
        run: git push origin main

      - name: Write step summary
        if: always()
        run: |
          if [ "${{ steps.diff.outputs.changed }}" = "true" ]; then
            SYNC_LINE=$(tail -1 /tmp/sync-stdout.txt)
            SYNCED_AT=$(jq -r '._meta.synced_at' content/publications.json 2>/dev/null || echo "unknown")
            echo "${SYNC_LINE}" >> $GITHUB_STEP_SUMMARY
            # Warnings section (from stderr, lines starting with "Warning:")
            WARNINGS=$(grep '^Warning:' /tmp/sync-stderr.txt 2>/dev/null || true)
            if [ -n "$WARNINGS" ]; then
              echo "" >> $GITHUB_STEP_SUMMARY
              echo "## Warnings" >> $GITHUB_STEP_SUMMARY
              while IFS= read -r line; do
                echo "- ${line#Warning: }" >> $GITHUB_STEP_SUMMARY
              done <<< "$WARNINGS"
            fi
            echo "" >> $GITHUB_STEP_SUMMARY
            echo "Synced at ${SYNCED_AT}" >> $GITHUB_STEP_SUMMARY
          elif [ "${{ steps.diff.outputs.changed }}" = "false" ]; then
            echo "No changes — skipping commit" >> $GITHUB_STEP_SUMMARY
            SYNCED_AT=$(jq -r '._meta.synced_at' content/publications.json 2>/dev/null || echo "unknown")
            echo "Synced at ${SYNCED_AT}" >> $GITHUB_STEP_SUMMARY
          else
            echo "Sync failed — see logs" >> $GITHUB_STEP_SUMMARY
          fi
```

### Step Ordering Rationale

**Why pnpm before setup-node:** `actions/setup-node` with `cache: 'pnpm'` needs pnpm installed first to compute the store path for the cache key. Installing pnpm after setup-node loses the cache benefit.

**Why `--frozen-lockfile`:** Prevents lockfile mutation in CI. If pnpm-lock.yaml is out of sync, fail loudly rather than silently updating and committing a modified lockfile.

**Why sync before validate:** Validate checks the file that sync writes. Running validate on stale data would be misleading.

**Why `if: always()` on summary:** Step failures (e.g. sync exits 1) must still emit a step summary so the maintainer sees "Sync failed — see logs" rather than an empty summary page.

### Anti-Patterns to Avoid

- **`git add .` instead of `git add content/publications.json`:** Would stage any incidental workspace drift (node_modules artifacts, temp files) alongside the JSON. Always stage only the specific file.
- **Setting `cancel-in-progress: true`:** Would cancel a running cron if a manual dispatch fires simultaneously. For an idempotent data sync this is fine, but for consistency (sync fully or not at all) use `false`.
- **Global git config (`--global`):** Unnecessary for this workflow and could affect other steps. Omit `--global`; local repo config is sufficient since the workflow only does one commit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| pnpm store caching | Custom `actions/cache` step with manual store path | `actions/setup-node@v4` with `cache: 'pnpm'` | setup-node handles store path discovery and cache key automatically |
| JSON field extraction | `node -e` inline or `grep`/`sed` | `jq` (pre-installed on ubuntu-latest) | Correct, readable, handles edge cases in JSON |
| Conditional step execution | Shell `if` inside a single step | Step `id:` + `outputs` + `if:` guards | Idiomatic GHA; each step has its own success/failure status in the UI |
| Bot commit attribution | Custom user name/email strings | Exact strings documented below | Wrong email breaks avatar display on GitHub UI |

**Key insight:** The entire workflow is orchestration of existing scripts — nothing new is computed in YAML. The sync script does the work; the workflow only captures its outputs and decides what to commit.

---

## Common Pitfalls

### Pitfall 1: `journal: ""` Write-Gate Failure (Task Zero)

**What goes wrong:** `inspireHitToPublication` in `scripts/sync-publications.ts` line 346 builds `journal` as:
```typescript
const journal: string = pi
  ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
      .filter(Boolean)
      .join(" ")
  : "Preprint";
```
When `pi` (i.e. `publication_info[0]`) exists but has all-null fields, `filter(Boolean)` returns `[]`, and `join(" ")` returns `""`. `PublicationSchema` enforces `journal: z.string().min(1)` — an empty string fails validation. The write gate catches this and exits 1. On first full-group CI run (all 14 members), any member whose InspireHEP records have preprint-only entries with a `publication_info` stub triggers this.

**Root cause:** The truthy-guard on `pi` is not sufficient — `pi` being defined is not the same as `pi` having any useful fields.

**Fix (one line, `scripts/sync-publications.ts`):**
```typescript
// Line 346 — change:
const journal: string = pi
  ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
      .filter(Boolean)
      .join(" ")
  : "Preprint";

// To:
const journal: string =
  (pi
    ? [pi.journal_title, pi.journal_volume, pi.year ? `(${pi.year})` : "", pi.artid]
        .filter(Boolean)
        .join(" ")
    : "") || "Preprint";
```

**Fallback string choice: `"Preprint"`**
- Rationale: The arXiv path (`arxivEntryToPublication`) already uses `"Preprint"` for the identical scenario (preprint-stage papers without journal info). Consistency is more important than the marginal distinction between "Preprint" and "Unpublished" — both are acceptable but "Preprint" aligns with arXiv path and with what Phase 11 will display.
- Do NOT make `journal` optional in the schema. The field is required for rendering in Phase 11 (card subtitle). Making it optional would require defensive rendering in UI code.

**Warning signs:** CI run red-X on first run, Zod error in logs: `journal: String must contain at least 1 character(s)`.

### Pitfall 2: `GITHUB_TOKEN` Push and `[skip ci]` Belt-and-Suspenders

**What goes wrong:** Misunderstanding what `[skip ci]` does vs what the token does.

**Actual behavior (HIGH confidence, GitHub official docs):**
- Pushes made with `GITHUB_TOKEN` do **not** trigger new workflow runs. GitHub's built-in loop prevention handles this without `[skip ci]`.
- `[skip ci]` in a commit message skips workflows that trigger on `push` events — but this only applies to workflow runs triggered by *human pushes*, not by `GITHUB_TOKEN` pushes (which already don't trigger).
- `[skip ci]` IS still useful here to suppress Vercel rebuild, but Vercel requires configuration in "Ignored Build Step" to respect any commit message pattern (see Pitfall 3).

**How to avoid:** Keep `[skip ci]` in the commit message as decided (belt-and-suspenders is fine), but understand it's not preventing recursive workflow runs — that's handled by the token itself.

### Pitfall 3: Vercel Deploys on Every Push Regardless of `[skip ci]`

**What goes wrong:** Vercel for GitHub "deploys every push by default" (official Vercel docs). It listens to the GitHub push event from its webhook, not to CI status. `[skip ci]` in the commit message does NOT prevent Vercel from deploying — Vercel does not natively understand `[skip ci]`.

**SC4 implication:** The success criterion "A Vercel deploy is triggered only when content/publications.json actually changes" is satisfied by our **commit-only-on-change guard** (`git diff --quiet`). If there are no changes, there is no push, so Vercel never gets a push event. When there IS a change, we DO want Vercel to deploy (the publications page should reflect the new data). This is correct behavior — no additional Vercel configuration is needed.

**If spurious Vercel deploys occur:** Configure `vercel.json` with `"ignoreCommand"` to check the commit message pattern. But this should not be necessary given commit-only-on-change.

**Warning signs:** Vercel dashboard shows two consecutive deploys after two workflow runs with identical upstream data (means the diff guard is not working).

### Pitfall 4: Staging Unintended Files in the Commit

**What goes wrong:** Using `git add .` or `git add -A` after the sync script runs can include workspace artifacts — for example, a modified `pnpm-lock.yaml` if a dependency was auto-updated, temp files written by `tsx`, or a modified `scripts/tmp/` file.

**How to avoid:** Always use `git add content/publications.json` explicitly. As a defensive measure, verify nothing else is staged before committing:
```bash
git add content/publications.json
# Defensive check: fail if anything other than publications.json is staged
git diff --cached --name-only | grep -v '^content/publications\.json$' | grep . && echo "ERROR: unexpected staged files" && exit 1 || true
```
This is optional but catches bugs early.

**Warning signs:** Commit in git log shows `package.json` or `pnpm-lock.yaml` alongside `content/publications.json`.

### Pitfall 5: `setup-node@v4` Cache Breaking Without pnpm Pre-Installed

**What goes wrong:** If `actions/setup-node` runs before `pnpm/action-setup`, the `cache: 'pnpm'` option cannot compute the pnpm store path (pnpm is not yet installed) and silently falls back to no caching, adding 30-60 seconds to install time on every run.

**How to avoid:** Always order: checkout → pnpm/action-setup → setup-node (with cache) → install.

---

## Code Examples

### Committer Identity (Exact Strings)

```bash
# Source: GitHub Community Discussion #26560 (community-verified, matches GitHub API)
# Verified: https://api.github.com/users/github-actions[bot] returns id: 41898282
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
```

These exact strings produce a commit attributed to the `github-actions[bot]` account with its bot avatar in the GitHub UI and `git log --oneline`.

### Step Summary Emission

```bash
# Write SYNC-15 line (last line of sync stdout) to summary:
SYNC_LINE=$(tail -1 /tmp/sync-stdout.txt)
echo "${SYNC_LINE}" >> $GITHUB_STEP_SUMMARY

# Extract _meta.synced_at via jq (pre-installed on ubuntu-latest as jq 1.7):
SYNCED_AT=$(jq -r '._meta.synced_at' content/publications.json)
echo "Synced at ${SYNCED_AT}" >> $GITHUB_STEP_SUMMARY

# Warnings from stderr (script emits "Warning: <message>" lines):
grep '^Warning:' /tmp/sync-stderr.txt | while IFS= read -r line; do
  echo "- ${line#Warning: }" >> $GITHUB_STEP_SUMMARY
done
```

The `$GITHUB_STEP_SUMMARY` file is append-only via `>>`. Each `>>` adds a newline automatically. Content is rendered as Markdown. Limit is 1 MiB per step.

### Diff Guard Pattern

```bash
# Sets step output "changed" to "true" or "false"
if git diff --quiet content/publications.json; then
  echo "changed=false" >> $GITHUB_OUTPUT
else
  echo "changed=true" >> $GITHUB_OUTPUT
fi
```

Subsequent steps use `if: steps.diff.outputs.changed == 'true'` as a guard. `git diff --quiet` exits 0 if no changes (skip commit), 1 if changes exist (commit).

### Sync Stdout/Stderr Capture

```bash
# Tee stdout to file for summary extraction, pass stderr to file for warning extraction
# Both streams also visible in GHA logs
pnpm sync-publications > /tmp/sync-stdout.txt 2>/tmp/sync-stderr.txt
cat /tmp/sync-stdout.txt        # echo to GHA log (stdout)
cat /tmp/sync-stderr.txt >&2   # echo to GHA log (stderr)
```

Note: With this pattern, if the script fails (`exit 1`), the step fails and subsequent steps with no `if:` guard are skipped. The `if: always()` on the summary step handles this correctly — `steps.diff.outputs.changed` will be empty on failure, triggering the fallback "Sync failed — see logs" branch.

---

## Naming Drift Resolution

| Source | Script Name Used | Correct Name |
|--------|-----------------|--------------|
| REQUIREMENTS.md (CI-04) | `pnpm check-content` | WRONG — stale |
| CONTEXT.md (step ordering) | `pnpm validate-content` | CORRECT |
| `package.json` `scripts` | `validate-content` | CORRECT |

**Decision: Use `pnpm validate-content` in the workflow YAML.** The `check-content` name never existed in `package.json` and is a requirements doc artifact.

---

## Node Version Resolution

| Source | Node Version |
|--------|-------------|
| REQUIREMENTS.md CI-03 | Node 22 (stale — written before project pinned Node 20) |
| `package.json engines` | `"20.x"` |
| `.nvmrc` | `20` |
| CONTEXT.md | No explicit version (Claude's discretion) |

**Decision: Use Node 20 in the workflow.** Running CI on a different Node than local development is a bug-hiding risk. Node 20 is LTS until April 2026 (end), still receiving security updates. Bump to Node 22 as a separate change after the project's `.nvmrc` and `engines` are updated.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual `actions/cache` with pnpm store path | `actions/setup-node@v4` with `cache: 'pnpm'` | Simpler, no manual cache key management |
| `set-output` echo format | `echo "key=value" >> $GITHUB_OUTPUT` | Old format deprecated 2022; new format required |
| `add-mask` workflow command | `>> $GITHUB_STEP_SUMMARY` | New in 2022, widely supported |
| `::set-output` | `$GITHUB_OUTPUT` env file | Old format throws warning, will be removed |

**Deprecated/outdated:**
- `::set-output name=...::value` — use `echo "name=value" >> $GITHUB_OUTPUT`
- `::add-path::` — use `echo "..." >> $GITHUB_PATH`

---

## Open Questions

1. **pnpm version pin vs range**
   - What we know: local pnpm is 10.33.0; no `packageManager` field in `package.json`
   - What's unclear: whether `version: '10'` (range) vs `version: '10.33.0'` (pin) is preferred
   - Recommendation: use `version: '10'` (major pin) — accepts patch updates without touching the workflow YAML. If reproducibility is critical, pin to `10.33.0` and update via Dependabot.

2. **First-run validation checklist**
   - Trigger `workflow_dispatch` immediately after merging the workflow YAML
   - Watch for: green checkmark on all steps, commit appearing in main branch, Vercel deploy triggered (or not if no data change)
   - Failure modes: `403 Permission denied` on push → `permissions: contents: write` missing or wrong scope; `remote: Permission to ... denied` → PAT needed (unlikely with no branch protection, but possible if GitHub App permissions are restricted at org level)

---

## Sources

### Primary (HIGH confidence)
- `scripts/sync-publications.ts` (direct code inspection) — SYNC-15 format, journal bug, warnings emission
- `src/content/schemas/publications.schema.ts` (direct code inspection) — `journal: z.string().min(1)` constraint
- `package.json` (direct code inspection) — Node 20, no `packageManager` field, `validate-content` script name
- GitHub community docs via WebFetch: https://github.com/orgs/community/discussions/25702 — GITHUB_TOKEN push does not trigger workflows
- Vercel official docs via WebFetch: https://vercel.com/docs/git/vercel-for-github — "deploys every push by default"
- GHA docs via WebFetch (workflow commands) — `$GITHUB_STEP_SUMMARY` append syntax, 1 MiB limit
- GitHub Actions runner image (ubuntu-latest): jq 1.7 pre-installed

### Secondary (MEDIUM confidence)
- GitHub Community Discussion #26560 — `41898282+github-actions[bot]@users.noreply.github.com` (community-verified, matches GitHub API)
- pnpm CI docs (pnpm.io/continuous-integration) — canonical step order: pnpm before setup-node
- actions/checkout releases page — v4 stable, v5/v6 runner version requirements
- actions/setup-node releases page — v4 stable, v6 broke pnpm cache in `setup-node` itself

### Tertiary (LOW confidence)
- WebSearch results on Vercel + `[skip ci]` — Vercel does not natively honor `[skip ci]`; requires `ignoreCommand` in vercel.json (multiple community sources agree, no official Vercel doc found explicitly confirming)

---

## Metadata

**Confidence breakdown:**
- Standard stack (action versions): HIGH — verified via release pages
- Step ordering: HIGH — verified against pnpm docs and GHA execution model
- Committer identity: MEDIUM — community-verified, API-confirmable but no single official doc
- Journal bug fix: HIGH — verified via direct code execution in bash
- Vercel behavior: MEDIUM — official docs confirm "deploys every push", `[skip ci]` behavior inferred

**Research date:** 2026-04-19
**Valid until:** 2026-07-19 (action versions move slowly; re-verify before next major CI change)
