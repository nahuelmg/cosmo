---
phase: quick-001-code-cleanup-sweep
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/content/schemas/people.schema.ts
  - src/content/accessors/publications.ts
  - content/people.json
  - content/people.schema.json
  - content/SYNC.md
  - messages/en.json
  - messages/es.json
  - src/lib/schemas.ts
  - .planning/milestones/v1.1-REQUIREMENTS.md
  - design-system/cosmology-group-uba/MASTER.md
  - design-system/cosmology-group-uba/OVERRIDES.md
autonomous: true
quick_mode: true

must_haves:
  truths:
    - "The Zod `publications_selected` field, three orphaned accessors (`getPublicationById`, `getPublicationsByTopic`, `getAllTopics`), and dead `people.selectedPublications` i18n key are all gone from the runtime source tree"
    - "`pnpm validate-content` still passes — content/people.json no longer carries `publications_selected`; content/people.schema.json is regenerated to match"
    - "`pnpm tsc --noEmit`, `pnpm test`, and `pnpm build` still pass end-to-end"
    - "JSON-LD ScholarlyArticle.identifier.value emits the URL form `https://doi.org/{doi}` instead of the bare DOI"
    - "v1.1-REQUIREMENTS.md no longer carries the 'Update REQUIREMENTS.md description to reflect direct-to-main push' deferral bullet — the spec already reflects CI-06/CI-08 direct-push semantics"
    - "design-system MASTER.md + OVERRIDES.md reflect post-Phase-15 NavLink changes (text-lg + max-w-6xl), confirm HeroCarousel recipe is tagline-free, and record the Desktop NavLink intentional no-ring decision"
  artifacts:
    - path: "src/content/schemas/people.schema.ts"
      provides: "PersonSchema without publications_selected field"
      contains_not: "publications_selected"
    - path: "src/content/accessors/publications.ts"
      provides: "4 accessors only (getPublications, getPublicationsByYear, getPublicationsMeta, getPublicationsByAuthor)"
      contains_not: "getPublicationById|getPublicationsByTopic|getAllTopics"
    - path: "content/people.json"
      provides: "14 member records without publications_selected key"
      contains_not: "publications_selected"
    - path: "content/people.schema.json"
      provides: "Regenerated JSON Schema (no publications_selected property, not in required array)"
      contains_not: "publications_selected"
    - path: "messages/en.json"
      provides: "people namespace without selectedPublications key"
      contains_not: "selectedPublications"
    - path: "messages/es.json"
      provides: "people namespace without selectedPublications key"
      contains_not: "selectedPublications"
    - path: "src/lib/schemas.ts"
      provides: "ScholarlyArticle identifier.value as https://doi.org/{doi}"
      contains: "https://doi.org/\\$\\{pub.doi\\}"
    - path: "design-system/cosmology-group-uba/MASTER.md"
      provides: "Nav Link recipe updated to text-lg + max-w-6xl state"
      contains: "text-lg"
    - path: "design-system/cosmology-group-uba/OVERRIDES.md"
      provides: "v1.2 overrides table with new post-Phase-15 NavLink row + decision note on intentional Desktop NavLink UA focus ring"
      contains: "text-lg"
  key_links:
    - from: "src/content/schemas/people.schema.ts"
      to: "content/people.schema.json"
      via: "pnpm generate-schemas"
      pattern: "publications_selected"
    - from: "src/content/schemas/people.schema.ts"
      to: "content/people.json"
      via: "PeopleSchema.parse at module load (strictObject)"
      pattern: "publications_selected"
    - from: "src/lib/schemas.ts"
      to: "JSON-LD emitted HTML"
      via: "JsonLd server component"
      pattern: "https://doi.org/"
---

<objective>
v1.4 code cleanup sweep — resolve all carried-forward deferrals from v1.1/v1.2/v1.3 milestones in one focused pass.

Purpose: Close the tech-debt backlog flagged in `.planning/STATE.md` "Open Items Carried Forward" and `.planning/PROJECT.md` Key Decisions before opening the next capability milestone. Nothing here is urgent individually, but letting them sit longer compounds doc drift and orphaned-code risk.

Output: A cleaner source tree (one dead Zod field + three orphaned accessors + one dead i18n key gone), a one-line JSON-LD spec alignment (`identifier.value` → URL form), and design-system docs that match the post-Phase-15 reality (NavLink text-lg/max-w-6xl + intentional UA focus-ring decision recorded).
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@src/content/schemas/people.schema.ts
@src/content/accessors/publications.ts
@src/content/index.ts
@src/lib/schemas.ts
@content/people.schema.json
@design-system/cosmology-group-uba/MASTER.md
@design-system/cosmology-group-uba/OVERRIDES.md
</context>

<preflight_sanity_check>
Before touching any file, the executor MUST re-verify these five facts (they held at plan-time; if drift has occurred since, STOP and flag):

1. Zero runtime references to the three orphaned accessors:
   ```bash
   grep -rn "getPublicationById\|getPublicationsByTopic\|getAllTopics" src/ content/ scripts/ messages/
   # Expected: ONLY the definitions in src/content/accessors/publications.ts
   #   (lines 13/15/17 JSDoc, 52/53 comments, 55/62/70 definitions).
   # Zero matches in src/app/, src/components/, src/lib/, scripts/, or any test file.
   ```

2. Zero runtime references to `publications_selected` outside the schema/content plumbing:
   ```bash
   grep -rn "publications_selected" src/ scripts/ messages/
   # Expected: ONLY src/content/schemas/people.schema.ts:81.
   # Zero matches in src/components/, src/app/, src/lib/, or scripts/.
   ```

3. Zero runtime references to the `selectedPublications` i18n key:
   ```bash
   grep -rn "selectedPublications" src/
   # Expected: zero matches in src/ (the key is dead after Phase 11-03).
   # Only matches will be in messages/{en,es}.json line 49.
   ```

4. Barrel (`src/content/index.ts`) re-exports via `export *` — no per-name list to prune:
   ```bash
   grep -n "export \*\|getPublicationById\|getPublicationsByTopic\|getAllTopics" src/content/index.ts
   # Expected: `export * from "./accessors/publications";` on line 20, zero explicit name matches.
   ```

5. `PersonSchema` is `z.strictObject` (line 49) — so leaving `publications_selected: []` in `content/people.json` AFTER removing the Zod field will cause `.parse()` to throw (extra key). Therefore the Zod removal MUST be applied together with JSON data removal + JSON Schema regeneration in the same task.

If any of 1–4 fails, STOP and report. Do NOT proceed with deletion.
</preflight_sanity_check>

<tasks>

<task type="auto">
  <name>Task 1: Remove dead code — publications_selected Zod field, three orphaned accessors, selectedPublications i18n key</name>
  <files>
    src/content/schemas/people.schema.ts
    src/content/accessors/publications.ts
    content/people.json
    content/people.schema.json
    content/SYNC.md
    messages/en.json
    messages/es.json
  </files>
  <action>
Run the preflight sanity checks above first. If all five pass, proceed.

**1a. Remove `publications_selected` from Zod schema**

In `src/content/schemas/people.schema.ts`:
- Delete the entire JSDoc block + field definition at lines 74–81 (the block starting `/** References to publication IDs ... */` through `publications_selected: z.array(z.string()).optional().default([]),`).
- Leave every other field untouched.

**1b. Strip `"publications_selected": []` from all 14 entries in `content/people.json`**

Use a single-pass edit or a short `node -e` one-liner — either approach is fine, but verify the file stays valid JSON:
```bash
node -e 'const fs=require("fs");const p="content/people.json";const d=JSON.parse(fs.readFileSync(p,"utf8"));for(const m of d){delete m.publications_selected;}fs.writeFileSync(p,JSON.stringify(d,null,2)+"\n");'
```
Then `git diff content/people.json` should show 14 deleted lines (one per member), no other changes. `jq . content/people.json >/dev/null` should exit 0.

**1c. Strip the `"publications_selected": [],` line from the JSON example in `content/SYNC.md`**

Single Edit call on line 284 — remove that line from the paste-ready snippet. No other changes to SYNC.md.

**1d. Regenerate JSON Schemas**

```bash
pnpm generate-schemas
```
Expected: `content/people.schema.json` no longer has the `publications_selected` property block (old lines 104–110) and no longer lists `"publications_selected"` in the `required` array (old line 240). The other four schema files should be byte-identical (verify with `git diff content/*.schema.json` — only `people.schema.json` should change).

**1e. Remove the three orphaned accessors from `src/content/accessors/publications.ts`**

Delete:
- `getPublicationsByTopic` function (lines 50–57, including its JSDoc block)
- `getPublicationById` function (lines 59–64, including its JSDoc block)
- `getAllTopics` function (lines 66–74, including its JSDoc block)
- Corresponding bullets from the module-level JSDoc `@example` block at lines 13/15/17 (keep the header + `getPublicationsByYear`/`getPublicationsByAuthor` examples intact; the block must remain coherent prose).
- The cross-reference in the `getPublicationsByTopic` JSDoc at lines 52–53 goes with the function.

The barrel (`src/content/index.ts`) uses `export *` so NO barrel changes are needed — the removed symbols simply stop being re-exported.

**1f. Remove dead `people.selectedPublications` i18n key**

In `messages/en.json` line 49: delete the `"selectedPublications": "Selected Publications",` entry from the `people` object.
In `messages/es.json` line 49: delete the `"selectedPublications": "Publicaciones seleccionadas",` entry from the `people` object.
Make sure the preceding entry keeps/drops its trailing comma as valid JSON requires (inspect the adjacent lines before editing).

**1g. Verify the full toolchain**

```bash
pnpm tsc --noEmit
pnpm test
pnpm validate-content
pnpm check-translations
pnpm build
```

All five MUST pass. If any fails:
- `tsc` / `test` failure → likely a missed consumer of the removed exports (preflight was wrong; surface the grep location and STOP).
- `validate-content` failure → either `content/people.json` still has stray `publications_selected` entries, or the regenerated `people.schema.json` wasn't committed. Re-run `pnpm generate-schemas`.
- `check-translations` failure → asymmetric i18n key removal (only one locale edited). Fix and retry.

**Commit message (atomic, after all verifications green):**
```
chore(quick-001-1): remove publications_selected, orphaned accessors, dead i18n key

- src/content/schemas/people.schema.ts: drop @deprecated publications_selected field
- src/content/accessors/publications.ts: drop orphaned getPublicationById / getPublicationsByTopic / getAllTopics exports (zero runtime callers since Phase 11-03)
- content/people.json: strip `"publications_selected": []` from all 14 members
- content/people.schema.json: regenerated via pnpm generate-schemas
- content/SYNC.md: remove publications_selected line from paste-ready example
- messages/{en,es}.json: remove dead people.selectedPublications i18n key (render path stripped in Phase 11-03)

Verified: tsc, test, validate-content, check-translations, build all green.
Carries forward: v1.1 deferrals (publications_selected field + orphaned accessors + dead i18n key) and v1.2 carry-forward.
```
  </action>
  <verify>
- `grep -rn "publications_selected" src/ scripts/ messages/ content/` returns zero hits.
- `grep -rn "getPublicationById\|getPublicationsByTopic\|getAllTopics" src/ scripts/` returns zero hits.
- `grep -rn "selectedPublications" src/ messages/` returns zero hits.
- `pnpm tsc --noEmit` — no errors.
- `pnpm test` — full suite passes.
- `pnpm validate-content` — passes.
- `pnpm check-translations` — passes (no asymmetric keys).
- `pnpm build` — clean SSG build, 45 static routes emitted.
  </verify>
  <done>
All three dead-code categories are gone from the runtime source tree AND their content/schema/docs echoes. The full toolchain (tsc + test + validate-content + check-translations + build) passes. One atomic commit with scope `chore(quick-001-1):`.
  </done>
</task>

<task type="auto">
  <name>Task 2: JSON-LD ScholarlyArticle identifier emits URL form (v1.3 deferral)</name>
  <files>
    src/lib/schemas.ts
  </files>
  <action>
In `src/lib/schemas.ts`, at line 132 inside `buildScholarlyArticleSchema`, change:

```ts
schema.identifier = {
  "@type": "PropertyValue",
  propertyID: "DOI",
  value: pub.doi,
};
```

to:

```ts
schema.identifier = {
  "@type": "PropertyValue",
  propertyID: "DOI",
  value: `https://doi.org/${pub.doi}`,
};
```

That is the entire change — one line (`value:`). The URL form already exists in `sameAs[]` (line 117), so this alignment is purely about `identifier.value` matching the v1.3 milestone spec.

Also update the JSDoc on `buildScholarlyArticleSchema` (lines 110–113) if it mentions the old bare-DOI form — a quick scan shows it does NOT (just "arXiv + DOI populate sameAs / identifier when present"), so the comment stays as-is.

**Verify the toolchain:**
```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```

If any test asserts the old bare-DOI shape, update the test expectation to the URL form in the same commit — `grep -rn "identifier.*DOI\|PropertyValue" src/` to find any such test. At plan-time no such test exists (accessors + schemas tests don't hit this builder), but verify.

**Commit message:**
```
fix(quick-001-2): JSON-LD ScholarlyArticle.identifier.value emits URL form

`identifier.value` now outputs `https://doi.org/{doi}` instead of the bare DOI,
matching the v1.3 milestone spec. `sameAs[]` already carried the URL form; this
aligns the two surfaces. Zero SEO impact either way — this closes the v1.3
carried-forward deferral noted in STATE.md.

One-line change in src/lib/schemas.ts buildScholarlyArticleSchema.
```
  </action>
  <verify>
- `grep -n "https://doi.org/\\\${pub.doi}" src/lib/schemas.ts` → exactly one hit inside `identifier`.
- `grep -n "value: pub.doi" src/lib/schemas.ts` → zero hits.
- `pnpm tsc --noEmit`, `pnpm test`, `pnpm build` all pass.
- Optional sanity: render a sample publication in dev (`pnpm dev` → `/en/publications`) and view page source — `<script type="application/ld+json">` containing the updated `identifier.value`.
  </verify>
  <done>
`identifier.value` emits `https://doi.org/{doi}` URL form on every ScholarlyArticle JSON-LD block. Toolchain green. One atomic commit scoped `fix(quick-001-2):`.
  </done>
</task>

<task type="auto">
  <name>Task 3: Documentation amendments — REQUIREMENTS deferral resolution + design-system drift</name>
  <files>
    .planning/milestones/v1.1-REQUIREMENTS.md
    design-system/cosmology-group-uba/MASTER.md
    design-system/cosmology-group-uba/OVERRIDES.md
  </files>
  <action>

**3a. Resolve the `.planning/milestones/v1.1-REQUIREMENTS.md` PR-flow deferral**

Context: v1.1-REQUIREMENTS.md line 131 reads `- Update REQUIREMENTS.md description to reflect direct-to-main push (not PR flow)` under the "Deferred to v1.2" section. The *body* of that file (CI-01…CI-08 at lines 68–77 and line 75 "Workflow commits with message including `[skip ci]`") already correctly describes direct-to-main push. The only drift is the self-referential "TODO" bullet itself, which was carried forward and never resolved. Resolve by either:
- Deleting line 131 outright, OR
- Marking it resolved in place: replace with `- ~~Update REQUIREMENTS.md description to reflect direct-to-main push (not PR flow)~~ — resolved v1.4: body already reflects direct-to-main per CI-06/CI-08; deferral was a no-op.`

Pick the strikethrough-in-place option (preserves archive auditability; this file is a `milestones/` archive, not live spec). Apply a single Edit.

Do NOT touch line 144 ("PR-based sync (human review step)") — that's in the "intentionally out of scope" comparison table and is correct as-is (it describes a *rejected* alternative, not the shipped flow).

**3b. MASTER.md Nav Link recipe update (post-Phase-15 commit `1cf9cf8`)**

In `design-system/cosmology-group-uba/MASTER.md`, in the "Nav Link" section (around lines 203–215):

- The Desktop NavLink code block (lines 206–212) currently shows `text-sm`-equivalent (no explicit text size class → inherits parent). Current `src/components/layout/NavLink.tsx` delegates sizing to the caller (no `text-*` class in `base` at line 45). The size bump to `text-lg` happens in `src/components/layout/SiteHeader.tsx` callers. So the MASTER.md snippet is *technically* still accurate at the component level.

  Instead, update the "Visible chrome" line at 214 — currently reads:
  ```
  - Visible chrome: text-sm + py-1.5 (~32 px text row).
  ```
  Change to:
  ```
  - Visible chrome: text-lg + py-1.5 (~36 px text row) as applied by SiteHeader (post-Phase-15 adjustment, commit 1cf9cf8). The NavLink component itself is size-agnostic; parent passes the text-* class.
  ```

- Verify the HeroCarousel recipe block is NOT describing tagline text. At plan-time `grep -i 'HeroCarousel\|tagline' design-system/cosmology-group-uba/MASTER.md` returns only lines 53, 82, 115, 124, 140, 152, 190, 262, 278, 293 — none describe a tagline string inside a HeroCarousel recipe. Nothing to update for post-Phase-15 commit `b3f697c` (the tagline only existed in live `src/` code; MASTER never carried it in a recipe). Confirm this in the SUMMARY.

**3c. OVERRIDES.md — add new v1.2+post-seal row + decision note for Desktop NavLink UA focus ring**

In `design-system/cosmology-group-uba/OVERRIDES.md`, in the "v1.2 Overrides (Phases 13–15)" table (starting at line 135):

1. Add a new row AFTER the existing NavLink row (current line 151), preserving table alignment:
```
| NavLink visible text (post-seal) | `text-sm` (inherited) | `text-lg` applied by SiteHeader + container `max-w-5xl` → `max-w-6xl` | Post-Phase-15 readability / logo positioning (commit `1cf9cf8`, 2026-04-20) |
```

2. Add a new "Decisions recorded post-seal" subsection AFTER the "Drift gate:" line (currently line 159), documenting the intentional UA focus ring on Desktop NavLink:

```markdown

---

## Post-seal decisions (v1.2 → v1.4)

**Desktop NavLink — intentional UA focus ring (no `focus-visible:ring-*`)**
The Desktop NavLink in `src/components/layout/NavLink.tsx` deliberately has no `focus-visible:ring-*` classes and inherits the user-agent default focus ring. BTN-02's scope ("focus ring unification") applies to interactive buttons and non-inline links receiving a padding-based hit target; the NavLink's active-state styling already relies on `font-weight` + `color` changes (per 01-02 no-border policy + Phase 15-02 MICRO-01 spec), so a ring would be redundant visual noise in the header chrome row. If a future audit flags it, revisit on the live site before changing — the intentional choice is: rely on UA ring as a fallback for keyboard users while keeping the header chrome minimal.

**MASTER.md Nav Link recipe — text-lg / max-w-6xl (commit `1cf9cf8`)**
Captured in the v1.2 overrides table row above. SiteHeader caller applies `text-lg` + `max-w-6xl`; NavLink component itself remains size-agnostic.

**HeroCarousel tagline removal (commit `b3f697c`)**
No MASTER.md update required — the tagline string only existed in live `HeroCarousel.tsx` JSX, never in a MASTER recipe block. `siteConfig.tagline` is retained for SEO `<meta>` description in `src/app/[locale]/layout.tsx`. No design-system drift.
```

**Commit message (single commit for all three doc changes):**
```
docs(quick-001-3): resolve v1.1/v1.2 carried-forward doc drift

- .planning/milestones/v1.1-REQUIREMENTS.md: strike through the "update REQUIREMENTS PR-flow description" deferral as resolved (body already reflects direct-to-main push per CI-06/CI-08; deferral was self-referential no-op)
- design-system/.../MASTER.md: Nav Link "Visible chrome" now records text-lg + py-1.5 (~36 px) post-Phase-15 state, attributes to commit 1cf9cf8 and SiteHeader caller
- design-system/.../OVERRIDES.md: new v1.2 table row for post-seal NavLink text-lg + max-w-6xl change; new "Post-seal decisions" subsection documenting (1) intentional Desktop NavLink UA focus ring, (2) NavLink recipe update rationale, (3) HeroCarousel tagline removal has no design-system impact

No source code changes. Closes STATE.md "Open Items Carried Forward" v1.1-post-seal and v1.2-post-seal doc-drift bullets.
```
  </action>
  <verify>
- `grep -n "resolved v1.4" .planning/milestones/v1.1-REQUIREMENTS.md` → one hit on the struck-through PR-flow deferral line.
- `grep -n "text-lg" design-system/cosmology-group-uba/MASTER.md` → at least one new hit in the Nav Link "Visible chrome" bullet.
- `grep -n "text-lg" design-system/cosmology-group-uba/OVERRIDES.md` → at least one hit in the new v1.2 table row.
- `grep -n "Post-seal decisions\|UA focus ring\|intentional" design-system/cosmology-group-uba/OVERRIDES.md` → hits in the new subsection.
- No source-code changes: `git diff --stat src/ content/ messages/` on this commit → zero lines.
- No toolchain re-run needed (docs-only), but a final `pnpm tsc --noEmit && pnpm test && pnpm build` is cheap insurance after the full sweep; run once at end of Task 3 to confirm nothing regressed cumulatively across the three tasks.
  </verify>
  <done>
All three doc-drift items resolved in a single atomic `docs(quick-001-3):` commit. OVERRIDES.md now records the post-seal NavLink change + the Desktop NavLink intentional-no-ring decision + the HeroCarousel-no-drift verification. Cumulative final `pnpm build` green.
  </done>
</task>

</tasks>

<verification>
After all three tasks complete, run one final sanity sweep:

```bash
# 1. Dead code truly gone from runtime
grep -rn "publications_selected" src/ scripts/ messages/ content/ # expected: 0 hits
grep -rn "getPublicationById\|getPublicationsByTopic\|getAllTopics" src/ scripts/ # expected: 0 hits
grep -rn "selectedPublications" src/ messages/ # expected: 0 hits

# 2. JSON-LD URL form shipped
grep -n "https://doi.org/\\\${pub.doi}" src/lib/schemas.ts # expected: exactly 1 hit inside identifier block

# 3. Full toolchain green (authoritative — run all of these)
pnpm tsc --noEmit
pnpm test
pnpm validate-content
pnpm check-translations
pnpm build

# 4. Git log shows three atomic commits with correct scopes
git log --oneline -3
# Expected order (newest first):
#   docs(quick-001-3): resolve v1.1/v1.2 carried-forward doc drift
#   fix(quick-001-2): JSON-LD ScholarlyArticle.identifier.value emits URL form
#   chore(quick-001-1): remove publications_selected, orphaned accessors, dead i18n key
```
</verification>

<success_criteria>
- All five preflight sanity checks held before Task 1 ran (or the plan was halted and flagged if any failed).
- Three atomic commits land in order on `main` (chore → fix → docs), each with the exact scope prefix specified above.
- `pnpm tsc --noEmit`, `pnpm test`, `pnpm validate-content`, `pnpm check-translations`, `pnpm build` all pass on the final HEAD.
- `content/people.json` no longer carries `publications_selected` on any of its 14 members; `content/people.schema.json` has been regenerated to match (no `publications_selected` property, not in `required`).
- `src/lib/schemas.ts` emits `https://doi.org/{doi}` in ScholarlyArticle `identifier.value`.
- `v1.1-REQUIREMENTS.md` PR-flow deferral is marked resolved in-place (strikethrough + "resolved v1.4" note).
- `design-system/.../MASTER.md` Nav Link "Visible chrome" records text-lg / ~36 px, attributing to commit `1cf9cf8` + SiteHeader caller.
- `design-system/.../OVERRIDES.md` v1.2 table has one new row for post-seal NavLink text-lg + max-w-6xl; a new "Post-seal decisions" subsection documents (1) intentional Desktop NavLink UA focus ring, (2) Nav Link recipe rationale, (3) HeroCarousel tagline is no-op for design system.
- STATE.md "Open Items Carried Forward" v1.1 code cleanup + v1.2 post-milestone doc drift + v1.3 `schemas.ts:132` deferral bullets are all actionable to strike through in the next milestone's STATE update (this plan does NOT edit STATE.md — that's a separate post-completion task).
</success_criteria>

<output>
After completion, create `.planning/quick/001-code-cleanup-sweep/001-SUMMARY.md` with:
- Files modified per task (git diff --stat between task commits)
- Toolchain verification results (tsc/test/validate-content/check-translations/build all green)
- Grep-proofs that dead code is gone (the three `grep -rn` commands from `<verification>` above, zero hits confirmed)
- Note for the next `/gsd:new-milestone` or `/gsd:audit-milestone`: STATE.md "Open Items Carried Forward" can now strike through the five v1.1-code-cleanup bullets, the three v1.2 post-seal doc-drift bullets, and the v1.3 `schemas.ts:132` bullet.
</output>
