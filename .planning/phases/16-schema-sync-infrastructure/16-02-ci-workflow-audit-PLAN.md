---
phase: 16-schema-sync-infrastructure
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/sync-publications.yml
autonomous: true

must_haves:
  truths:
    - ".github/workflows/sync-publications.yml runs all three sources (inspirehep, arxiv, orcid) by default with no --no-* flags passed"
    - "The workflow YAML documents the three-source behaviour in a comment near the sync step (traceability for CI-01)"
    - "The jq-based diff-guard keyed on '.publications' continues to ignore _meta drift"
    - "No secrets (ORCID_CLIENT_*) are added in Phase 16 — Phase 17 scope"
  artifacts:
    - path: ".github/workflows/sync-publications.yml"
      provides: "CI workflow for weekly three-source sync with traceability comment"
      contains: "sync-publications"
  key_links:
    - from: ".github/workflows/sync-publications.yml Run sync script step"
      to: "scripts/sync-publications.ts main()"
      via: "pnpm sync-publications (no flags → all sources enabled)"
      pattern: "pnpm sync-publications"
---

<objective>
Audit the CI workflow and add a traceability comment documenting that all three sources run by default. The workflow already runs `pnpm sync-publications` with no flags (research confirmed), which is functionally correct for CI-01. This plan only adds a short comment to make the Phase 16 contract explicit for future operators.

Purpose: CI-01 is a correctness requirement ("workflow runs all three sources by default"). The YAML today already satisfies it. Without a comment, a future reader cannot distinguish "correct by coincidence" from "correct by design". A one-line comment closes the traceability gap without introducing new logic.

Output: `.github/workflows/sync-publications.yml` with a traceability comment on/above the `Run sync script` step. No functional YAML change.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/16-schema-sync-infrastructure/16-RESEARCH.md

@.github/workflows/sync-publications.yml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add three-source traceability comment to sync workflow</name>
  <files>.github/workflows/sync-publications.yml</files>
  <action>
Open `.github/workflows/sync-publications.yml`.

Confirm the workflow currently invokes `pnpm sync-publications` with NO `--no-*` flags (lines 38–42 in research). If any `--no-arxiv` / `--no-inspire` / `--no-orcid` flag is already present, STOP and surface the discrepancy — research said no flags are passed.

Edit the `Run sync script` step (starts around line 38) to add a clarifying comment ABOVE the `run:` block documenting the three-source default. Example (adjust indentation to match existing YAML):

```yaml
      # CI-01: no --no-* flags passed → InspireHEP + arXiv + ORCID all run by default.
      # To skip a source in a workflow_dispatch run, add --no-inspire / --no-arxiv / --no-orcid.
      # ORCID is a Phase 16 stub returning []; Phase 17 wires the real ORCID fetch.
      - name: Run sync script
        run: |
          pnpm sync-publications > /tmp/sync-stdout.txt 2>/tmp/sync-stderr.txt
          cat /tmp/sync-stdout.txt
          cat /tmp/sync-stderr.txt >&2
```

Do NOT:
- Add `--no-orcid` to the command (CI-01 requires all three on by default).
- Add any env vars or secrets (Phase 17 scope).
- Change the diff-guard step (`jq -cS '.publications'`) — it already ignores `_meta` drift including the new `counts.orcid` and `counts.deduped`.
- Change the step summary `tail -1` command — the extended summary line still fits on one line.

Keep the edit to a pure comment addition. Run a YAML lint (or simply open in an editor that parses YAML) to confirm the file still parses.
  </action>
  <verify>
- Comment block appears above the `Run sync script` step mentioning CI-01, the three sources, and the Phase 16 stub.
- `grep -n 'no-arxiv\|no-inspire\|no-orcid' .github/workflows/sync-publications.yml` — matches should only appear inside the new comment (the `run:` line itself has no flags).
- The rest of the file is byte-identical outside the new comment lines.
- Optional: `yq '.jobs.sync.steps[] | select(.name == "Run sync script").run' .github/workflows/sync-publications.yml` still outputs the original three-line shell script unchanged.
  </verify>
  <done>
- Traceability comment added above `Run sync script`.
- No functional YAML changes.
- Workflow still valid YAML.
  </done>
</task>

</tasks>

<verification>
Phase-level gates satisfied after this plan:
- Success criterion 5 (CI): workflow runs all three sources by default; Phase 16 stub returns `[]` so no ORCID API calls fire.

No build or test changes. This plan is pure documentation inside YAML.
</verification>

<success_criteria>
- `.github/workflows/sync-publications.yml` has a `CI-01` traceability comment above the sync step.
- No functional change to the workflow (no new flags, no secrets, no new steps).
- File still parses as valid YAML.
</success_criteria>

<output>
After completion, create `.planning/phases/16-schema-sync-infrastructure/16-02-SUMMARY.md`
</output>
