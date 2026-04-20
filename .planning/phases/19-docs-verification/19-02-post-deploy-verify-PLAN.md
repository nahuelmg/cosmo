---
phase: 19-docs-verification
plan: 02
type: execute
wave: 2
depends_on: ["19-01"]
files_modified:
  - .planning/phases/19-docs-verification/19-02-VERIFY-RESULT.md
autonomous: false

must_haves:
  truths:
    - "The live production site is deployed with Phase 18's display-layer changes (ORCID filter pill, source badge, author-link pill, three-source footnote)"
    - "On the live /people/tomas-ferreira-chase page, the SiPM paper (DOI 10.1016/j.nima.2020.164490) is visible with title, year 2020, journal string, and full 11-author list (not just Tomas's name)"
    - "A post-deploy workflow_dispatch sync run has been triggered as a smoke test and its outcome is documented (expected: 'No changes' since the paper is already in publications.json)"
    - "VERIFY-01 result is captured in a written artifact so the milestone audit can reference it"
  artifacts:
    - path: ".planning/phases/19-docs-verification/19-02-VERIFY-RESULT.md"
      provides: "Written record of the live-site verification — deploy URL, paper visibility screenshot or prose confirmation, sync run conclusion"
      contains:
        - "10.1016/j.nima.2020.164490"
        - "tomas-ferreira-chase"
        - "VERIFY-01"
  key_links:
    - from: "Live Vercel deployment"
      to: "Phase 18 frontend code"
      via: "push-to-main auto-deploy"
      pattern: "git log main -1 (should be ≥ Phase 18 seal commit)"
    - from: "content/publications.json"
      to: "live /people/tomas-ferreira-chase render"
      via: "Next.js SSG"
      pattern: "SiPM paper DOI visible in rendered page HTML"
---

<objective>
Close VERIFY-01 by confirming the SiPM paper renders correctly on the live deployed site and capturing the result in writing. This is the last gate on v1.3 — after this plan the milestone is fully verified and ready for `/gsd:audit-milestone` + `/gsd:complete-milestone`.

Purpose: VERIFY-01 is the end-to-end proof that the ORCID pipeline works in production, not just in local dev. The research found that the data (SiPM paper + Tomas's orcid_id) is already in the committed `content/publications.json` and `content/people.json`. So "verification" here is a visual confirmation on the live site plus an optional `workflow_dispatch` smoke run.

Output: `.planning/phases/19-docs-verification/19-02-VERIFY-RESULT.md` recording the verification outcome (deploy URL, paper visibility confirmation, sync run result, any anomalies).

**Autonomy note:** `autonomous: false`. Task 2 requires a human to visit the live site in a browser and visually confirm the paper renders. Claude can drive the automation (deploy check, workflow trigger, log reading) but cannot observe the rendered page pixels. The checkpoint is intentionally minimal — it's the single unavoidable human-in-the-loop step in the entire v1.3 milestone.
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/19-docs-verification/19-RESEARCH.md
@content/publications.json
@content/people.json
@.github/workflows/sync-publications.yml
</context>

<tasks>

<task type="auto">
  <name>Task 1: Confirm live deployment state and trigger workflow_dispatch smoke test</name>
  <files>none (read-only observations logged into memory for Task 2)</files>
  <action>
Gather the signals needed to drive the human checkpoint. Do NOT wait on anything or sleep — just collect data.

1. **Identify the production URL.** Check Vercel deployment: run `git remote -v` to find the GitHub repo slug, then check `references/deployment/vercel.md` or `.planning/STATE.md` decisions for the deployed domain. If there is no explicit domain recorded, run `gh api repos/{owner}/{repo} --jq '.homepage'` as a fallback, or look for a `vercel.json` / README hint. Record the resolved URL (e.g. `https://cosmologia-uba.vercel.app` or the custom domain).

2. **Confirm the deploy is current.** Run `git log main -1 --format='%h %s %ci'` and compare the timestamp to the last Vercel deployment. If there is a Vercel CLI authenticated, `vercel ls --meta` can list recent deploys. Otherwise surface the most recent main commit hash and trust Vercel auto-deploy (per STATE.md: Vercel deploys on push to main). The Phase 18 seal commit (per recent `git log`: `a13c779 feat(18-01): show ORCID link pill on publications with ORCID-having author` and earlier 18-01 commits) must be included — verify with `git log --oneline -20` and note the Phase 18 commits are visible.

3. **Trigger the workflow_dispatch sync as a smoke test.** Run:

   ```bash
   gh workflow run sync-publications.yml --ref main
   ```

   If this succeeds, poll the run with `gh run list --workflow=sync-publications.yml --limit=1` and then `gh run view <id>` until it completes. Expected outcome: "No changes — skipping commit" because `content/publications.json` already contains the SiPM paper and the 2026-04-20 sync state is current. Record the run ID and conclusion (success / no-op) for Task 2.

4. **Verify the SiPM paper is still in the committed data** (cheap sanity check):
   ```bash
   grep -l "10.1016/j.nima.2020.164490" content/publications.json
   grep -l "tomas-ferreira-chase" content/people.json
   ```
   Both greps must return a file path. Also confirm the paper entry in `content/publications.json` has `"source": "orcid"` and a `contributors` array of length ≥11.

Collect all outputs (production URL, latest main commit, workflow run ID + conclusion, grep confirmations) into a scratchpad for Task 2 — do not yet write the verify result file.

If the `gh workflow run` step fails because of auth, STOP and surface the error — this is a legitimate authentication gate; the human will need to re-auth `gh` and re-run. Do NOT fabricate a run result.
  </action>
  <verify>
    - Production URL identified and written down for Task 2
    - `git log main -1` shows the Phase 18 seal commits in history (not older than 18-01 merge)
    - `gh workflow run sync-publications.yml` returned 0; run ID captured; run completed (success, with "No changes" in summary OR an actual commit delta — both are acceptable outcomes for the verification; the purpose is to confirm the workflow still executes)
    - `grep` confirms SiPM paper + Tomas's entry are both in their JSON files
  </verify>
  <done>
All data needed for the human-verify checkpoint in Task 2 is gathered: deploy URL, most-recent main commit, workflow_dispatch run conclusion, data-presence confirmation.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human visual verification of SiPM paper on live /people/tomas-ferreira-chase + record result</name>
  <what-built>
Phase 18 shipped the ORCID display layer (source filter pill, source badge, three-source footnote, author-link ORCID pill). Phase 19 Plan 01 extended content/SYNC.md with ORCID docs. All three v1.3 publication sources (InspireHEP + ORCID + arXiv) are in `content/publications.json` and the SiPM paper is verified present with `source: "orcid"` and a full 11-author list.

Task 1 above gathered:
- Production URL: {{ recorded in Task 1 output }}
- Workflow_dispatch run conclusion: {{ recorded in Task 1 output }}
- Most recent main commit: {{ recorded in Task 1 output }}
  </what-built>
  <how-to-verify>
Visit the live site in your browser:

1. Navigate to `<PRODUCTION_URL>/en/people/tomas-ferreira-chase` (or the Spanish-locale equivalent `/es/personas/tomas-ferreira-chase`; pick whichever path is live — 404-check the other if unsure).

2. Scroll to the "Publications" / "Publicaciones recientes" section.

3. Confirm the SiPM paper appears with ALL of:
   - **Title:** "Silicon photomultiplier characterization on board a satellite in Low Earth Orbit"
   - **Year:** 2020
   - **Journal:** Nuclear Instruments and Methods in Physics Research Section A (or the slightly longer official journal string — a substring match is fine)
   - **Author list:** Contains ALL of Barella, Burroni, Carsen, Far (or Far Brusatti), Ferreira Chase (Tomas), Finazzi, Golmar, Gomez Marlasca, Izraelevitch, Levy, Sanca — 11 names. If the author list shows ONLY "Tomas Ferreira Chase" or has fewer than 5 authors, the ORCID-06 per-work detail enrichment is broken on the live deploy — report this.
   - **Source badge:** "ORCID" (proper-noun; same visual style as InspireHEP/arXiv badges)

4. ALSO visit `<PRODUCTION_URL>/en/publications`:
   - Confirm the "ORCID" filter pill appears in the source filter group alongside InspireHEP and arXiv.
   - Click it — verify the list collapses to ORCID-only entries and the pill reads `aria-pressed="true"` (inspect element if needed).
   - Confirm the footnote below the list mentions all THREE sources (not the old two-source wording).

5. (Optional sanity) View page source on the Tomas page — search for the DOI string `10.1016/j.nima.2020.164490`. It should appear in the rendered HTML and likely inside the `ScholarlyArticle` JSON-LD block (UI-05).

6. **After the browser check, write the result file:**

   Create `.planning/phases/19-docs-verification/19-02-VERIFY-RESULT.md` with these sections:
   - `## Deploy Info` — production URL, main commit verified, workflow_dispatch run ID + conclusion (from Task 1)
   - `## VERIFY-01 Confirmation` — yes/no for SiPM paper visible; yes/no for full author list (with author count); yes/no for ORCID source badge; yes/no for ORCID filter pill on /publications; yes/no for three-source footnote
   - `## Anomalies` — anything unexpected (missing author, badge styling off, deploy lagging, etc.); if none, write "None."
   - `## Status` — `VERIFY-01: Satisfied` or `VERIFY-01: Gap — <summary>` with link to a gap-closure plan if needed

If all checks pass cleanly, say so and the phase is done. If any check fails, capture the specific failure in the result file — that becomes the input to a Phase 19 gap-closure plan via `/gsd:plan-phase 19 --gaps`.
  </how-to-verify>
  <resume-signal>
After writing `19-02-VERIFY-RESULT.md`, reply with either:
- `verified` (all live-site checks passed, VERIFY-01 satisfied)
- `gaps: <short description>` (one or more checks failed — describe the gap so a closure plan can be created)
- `blocked: <reason>` (cannot verify — e.g. site not deployed, can't reach browser)
  </resume-signal>
</task>

</tasks>

<verification>
Phase-level:
1. `.planning/phases/19-docs-verification/19-02-VERIFY-RESULT.md` exists and contains the four required sections (Deploy Info, VERIFY-01 Confirmation, Anomalies, Status).
2. If Status = "Satisfied", REQUIREMENTS.md line 55 VERIFY-01 can be checked off and v1.3 is ready for milestone audit.
3. If Status = "Gap", a follow-up plan via `/gsd:plan-phase 19 --gaps` is required before v1.3 ships.
</verification>

<success_criteria>
Measurable:
- Task 1 produced a workflow_dispatch run ID and a deploy URL.
- Task 2 produced `19-02-VERIFY-RESULT.md` with a definitive status line.
- VERIFY-01 status is explicit (Satisfied, Gap, or Blocked) — no ambiguity.
</success_criteria>

<output>
After completion, create `.planning/phases/19-docs-verification/19-02-SUMMARY.md` with:
- Deploy URL + main commit hash verified against
- Workflow_dispatch run link + conclusion
- Link to `19-02-VERIFY-RESULT.md`
- Final VERIFY-01 status (matching the result file)
- If gaps found, list them so the orchestrator can route to `/gsd:plan-phase 19 --gaps`
</output>
