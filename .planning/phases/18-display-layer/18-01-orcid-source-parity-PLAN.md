---
phase: 18-display-layer
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/publications/SourceFilter.tsx
  - src/components/publications/PublicationEntry.tsx
  - messages/es.json
  - messages/en.json
  - src/lib/publications-helpers.test.ts
autonomous: false

must_haves:
  truths:
    - "UI-01: /publications (both /en/publications and /es/publicaciones) renders a fifth filter pill labelled 'ORCID' between the 'arXiv' and 'Manual' pills"
    - "UI-01: Clicking the ORCID pill sets aria-pressed='true' on it and filters the publication list to entries with source === 'orcid' (15 entries currently in content/publications.json)"
    - "UI-02: Every publication with source === 'orcid' renders a source badge with label text 'ORCID' (not 'Manual'), using bg-[oklch(0.95_0.05_118)] and text-[oklch(0.40_0.12_118)] — visually distinct from the blue InspireHEP badge and the orange arXiv badge"
    - "UI-02: The ORCID badge renders as a non-link <span> (same branch shape as the Manual fallback) because getSourcePillHref returns null for source === 'orcid'; discoverability is provided by the existing DOI link row below"
    - "UI-03: messages/es.json and messages/en.json both contain a publications.filter.orcid key whose value is 'ORCID' (proper noun, same in both locales)"
    - "UI-04: publications.footnote in both locale files names three sources (InspireHEP, arXiv, ORCID) and includes a plain-language note about the DOI-based merge/precedence rule"
    - "UI-05: /publications emits one ScholarlyArticle JSON-LD block per publication via the existing buildScholarlyArticleSchema — the SiPM paper (DOI 10.1016/j.nima.2020.164490, source='orcid') produces valid JSON-LD with title, authors, year, journal, doi all populated (verified by viewing page source). /people/[slug] is explicitly out of scope — it only emits Person schema via buildPersonSchema and that is unchanged"
    - "SiPM integration: /people/tomas-ferreira-chase (both locales) shows the SiPM paper in the 'Publicaciones recientes' section with the ORCID badge, all 11 authors (truncated via the et-al rule but with Ferreira Chase visible), year 2020, journal 'Nuclear Instruments and Methods...', and the clickable DOI link to https://doi.org/10.1016/j.nima.2020.164490 — structurally identical to any InspireHEP/arXiv entry on the same page"
    - "Test: publications-helpers.test.ts has a new case asserting getSourcePillHref returns null for source === 'orcid' (explicit coverage of the defensive fallback)"
    - "Gates: pnpm tsc --noEmit passes; pnpm vitest run passes (test count rises by 1); pnpm build passes (static generation of all publications + people routes in both locales succeeds)"
  artifacts:
    - path: "src/components/publications/SourceFilter.tsx"
      provides: "SourceFilterValue union extended with 'orcid'; options array extended with { key: 'orcid', label: t('filter.orcid') } between 'arxiv' and 'manual'"
      contains: "'orcid'"
    - path: "src/components/publications/PublicationEntry.tsx"
      provides: "tone ternary extended with an 'orcid' branch (oklch hue 118 muted tint); label ternary extended with an 'orcid' branch returning 'ORCID'; no other structural change"
      contains: "publication.source === \"orcid\""
    - path: "messages/es.json"
      provides: "publications.filter.orcid key with value 'ORCID'; publications.footnote rewritten to three-source wording with DOI precedence note"
      contains: "\"orcid\": \"ORCID\""
    - path: "messages/en.json"
      provides: "publications.filter.orcid key with value 'ORCID'; publications.footnote rewritten to three-source wording with DOI precedence note"
      contains: "\"orcid\": \"ORCID\""
    - path: "src/lib/publications-helpers.test.ts"
      provides: "New test case in the getSourcePillHref describe block asserting the 'orcid → null' branch"
      contains: "orcid"
  key_links:
    - from: "src/components/publications/SourceFilter.tsx options array"
      to: "messages/{es,en}.json publications.filter.orcid"
      via: "t('filter.orcid') in useTranslations('publications')"
      pattern: "t\\('filter\\.orcid'\\)"
    - from: "src/components/publications/SourceFilter.tsx (SourceFilterValue type)"
      to: "src/components/publications/PublicationsClientShell.tsx (useState<SourceFilterValue>)"
      via: "exported type consumed across RSC → client boundary; filter comparison is p.source === source"
      pattern: "SourceFilterValue"
    - from: "src/components/publications/PublicationEntry.tsx (tone + label ternaries)"
      to: "Publication.source === 'orcid'"
      via: "explicit branch added BEFORE the fallback so ORCID entries no longer render as 'Manual'"
      pattern: "publication\\.source === \"orcid\""
    - from: "src/app/[locale]/publications/page.tsx (existing, unchanged)"
      to: "buildScholarlyArticleSchema(pub)"
      via: "already maps over allPublications — picks up ORCID entries with no code change because the schema builder only reads source-agnostic fields"
      pattern: "buildScholarlyArticleSchema"
---

<objective>
Extend the publications display layer so ORCID is a first-class source with parity to
InspireHEP and arXiv: a filter pill, a distinct source badge, bilingual strings,
updated footnote wording, and verified Schema.org JSON-LD coverage.

This is an extension-only phase. No new components, no new libraries, no schema
changes, no data mutations. All five touch points identified by 18-RESEARCH.md are
minimal edits to existing code: one type union extension, one ternary branch in two
places, one options-array entry, four i18n string edits across two locale files, one
new unit test case, and one live browser verification against the real 15-entry
ORCID dataset already present in content/publications.json (including Tomas's SiPM
paper with its 11-author list).

UI-05 is interpreted per 18-RESEARCH.md Open Question 1: the ScholarlyArticle JSON-LD
block is only emitted on /publications (via buildScholarlyArticleSchema), not on
/people/[slug] (which only emits Person schema). Because buildScholarlyArticleSchema
reads only source-agnostic fields (title, authors, year, journal, arxiv, doi), it
already handles ORCID entries correctly — UI-05 is a no-op verification, not a code
change. Do NOT add ScholarlyArticle emission to the people slug page; that would be
a scope expansion.

Purpose: Deliver UI-01, UI-02, UI-03, UI-04, UI-05 and the four Phase 18 ROADMAP
success criteria. This is the last implementation work before v1.3 ships — the
only remaining phase is Phase 19 (Docs & Verification).

Output:
- SourceFilter.tsx: SourceFilterValue union + one pill added
- PublicationEntry.tsx: one ternary branch added to `tone` and one to `label`
- messages/es.json + messages/en.json: filter.orcid key added, footnote rewritten
- publications-helpers.test.ts: one new test case for `getSourcePillHref("orcid") → null`
- Visual confirmation on the dev server in both locales that the filter pill, badge,
  footnote, Schema.org JSON-LD (via view-source), and SiPM paper on the people page
  all render correctly
</objective>

<execution_context>
@/home/tomas/.claude/get-shit-done/workflows/execute-plan.md
@/home/tomas/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/18-display-layer/18-RESEARCH.md
@src/components/publications/SourceFilter.tsx
@src/components/publications/PublicationEntry.tsx
@src/components/publications/PublicationsClientShell.tsx
@src/lib/publications-helpers.ts
@src/lib/publications-helpers.test.ts
@src/app/[locale]/publications/page.tsx
@src/lib/schemas.ts
@messages/es.json
@messages/en.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Filter pill — extend SourceFilterValue + options array + add filter.orcid i18n key</name>
  <files>
    src/components/publications/SourceFilter.tsx
    messages/es.json
    messages/en.json
  </files>
  <action>
    Extend the SourceFilter component and its i18n key set so an "ORCID" pill
    renders in the filter group.

    **Step 1.1 — Extend SourceFilterValue and options array (SourceFilter.tsx)**

    Edit `src/components/publications/SourceFilter.tsx`.

    Line 5 — update the exported type:
    ```typescript
    export type SourceFilterValue = 'all' | 'inspirehep' | 'arxiv' | 'orcid' | 'manual';
    ```

    Lines 15–20 — add the ORCID pill between arXiv and Manual (per research Open
    Question 3 — ordering locked as `all | inspirehep | arxiv | orcid | manual`):
    ```typescript
    const options: { key: SourceFilterValue; label: string }[] = [
      { key: 'all', label: t('filter.all') },
      { key: 'inspirehep', label: t('filter.inspirehep') },
      { key: 'arxiv', label: t('filter.arxiv') },
      { key: 'orcid', label: t('filter.orcid') },
      { key: 'manual', label: t('filter.manual') },
    ];
    ```

    No other changes in SourceFilter.tsx — the base classes, aria-pressed wiring,
    and the "non-'all' pills don't toggle off" behaviour all propagate automatically
    because they are keyed on the union type, not a hardcoded set.

    **Step 1.2 — Add the `filter.orcid` key to messages/en.json**

    Open `messages/en.json`. Locate the `publications.filter` object (around line 68).
    It currently reads:
    ```json
    "filter": {
      "all": "All",
      "inspirehep": "InspireHEP",
      "arxiv": "arXiv",
      "manual": "Manual"
    },
    ```

    Add `"orcid": "ORCID"` between `arxiv` and `manual` to match the pill order in
    SourceFilter.tsx:
    ```json
    "filter": {
      "all": "All",
      "inspirehep": "InspireHEP",
      "arxiv": "arXiv",
      "orcid": "ORCID",
      "manual": "Manual"
    },
    ```

    **Step 1.3 — Add the `filter.orcid` key to messages/es.json**

    Open `messages/es.json`. Locate the `publications.filter` object (around line 68).
    It currently reads:
    ```json
    "filter": {
      "all": "Todos",
      "inspirehep": "InspireHEP",
      "arxiv": "arXiv",
      "manual": "Manual"
    },
    ```

    Add `"orcid": "ORCID"` in the same position (ORCID is a proper noun — same label
    in both locales):
    ```json
    "filter": {
      "all": "Todos",
      "inspirehep": "InspireHEP",
      "arxiv": "arXiv",
      "orcid": "ORCID",
      "manual": "Manual"
    },
    ```

    **Do NOT** add a tooltip key, a description key, or a `publications.source.orcid`
    key. REQUIREMENTS.md UI-03 mentions `publications.source.orcid` loosely, but the
    existing component uses `publications.filter.*` (not `publications.source.*`) and
    there is no `publications.source` namespace in either locale file today. The pill
    and badge both derive their labels from `filter.*` / hardcoded `"ORCID"` string —
    no new namespace is needed. Adding an unused namespace would be dead code.

    **Do NOT** reorder other keys in the filter object or elsewhere in the JSON
    files. Add the `orcid` key specifically between `arxiv` and `manual` so the JSON
    diff is surgical and the pill order in the UI matches the JSON key order
    (aesthetically — next-intl doesn't care about JSON order, but readability does).

    **Pitfall guard (research Pitfall 1):** TypeScript will NOT error if you forget
    to update SourceFilter.tsx's options array but do update the union type — the
    compile passes because the union just widens. The pill only shows up if BOTH
    edits (type + options array) land. Similarly, if you add the pill but forget
    the i18n key, `t('filter.orcid')` will resolve to the string `"publications.filter.orcid"`
    (the raw key) at runtime — not a crash, just visible as wrong label. Guard by
    grepping for both after the edits (see verify block).
  </action>
  <verify>
    `grep -n "'orcid'" src/components/publications/SourceFilter.tsx` returns at
    least two matches: one in the `SourceFilterValue` union on line 5 and one in
    the options array on lines 15–21.

    `grep -n '"orcid": "ORCID"' messages/en.json` returns exactly one match.
    `grep -n '"orcid": "ORCID"' messages/es.json` returns exactly one match.

    Both i18n keys are inside the `publications.filter` object — verify with:
    ```bash
    jq '.publications.filter.orcid' messages/en.json
    jq '.publications.filter.orcid' messages/es.json
    ```
    Both must print `"ORCID"` (with quotes, as jq stringifies).

    `pnpm tsc --noEmit` passes (the union widening must not break any consumer).

    JSON validity:
    ```bash
    jq '.' messages/en.json > /dev/null
    jq '.' messages/es.json > /dev/null
    ```
    Both exit 0 (no trailing comma or syntax error from the edit).
  </verify>
  <done>
    SourceFilter.tsx declares `'orcid'` in the SourceFilterValue union and renders a
    fifth pill between arXiv and Manual that reads its label from `t('filter.orcid')`.
    Both locale files contain the `publications.filter.orcid` key with value `"ORCID"`.
    The project type-checks cleanly.
  </done>
</task>

<task type="auto">
  <name>Task 2: Source badge + footnote i18n + helper test coverage</name>
  <files>
    src/components/publications/PublicationEntry.tsx
    messages/es.json
    messages/en.json
    src/lib/publications-helpers.test.ts
  </files>
  <action>
    Make ORCID entries render with a distinct badge tone and label, rewrite the
    publications footnote for three-source wording with DOI precedence, and add
    the explicit `"orcid" → null` test case for `getSourcePillHref`.

    **Step 2.1 — Extend the tone ternary in PublicationEntry.tsx**

    Edit `src/components/publications/PublicationEntry.tsx`, lines 47–52.

    Current code:
    ```typescript
    const tone =
      publication.source === "inspirehep"
        ? "bg-[oklch(0.95_0.04_235)] text-[oklch(0.38_0.10_235)]"
        : publication.source === "arxiv"
          ? "bg-[oklch(0.95_0.05_30)] text-[oklch(0.42_0.12_30)]"
          : "bg-surface-alt text-ink-muted";
    ```

    Replace with:
    ```typescript
    const tone =
      publication.source === "inspirehep"
        ? "bg-[oklch(0.95_0.04_235)] text-[oklch(0.38_0.10_235)]"
        : publication.source === "arxiv"
          ? "bg-[oklch(0.95_0.05_30)] text-[oklch(0.42_0.12_30)]"
          : publication.source === "orcid"
            ? "bg-[oklch(0.95_0.05_118)] text-[oklch(0.40_0.12_118)]"
            : "bg-surface-alt text-ink-muted";
    ```

    **Color values locked (research Section "ORCID Brand Color — OKLCH Tradeoff",
    Option B):** hue 118 (olive-green, derived from ORCID brand `#A6CE39`), muted to
    match the existing badge visual grammar (lightness 0.95 bg / 0.40 text, chroma
    0.05 bg / 0.12 text). Do NOT use the ORCID brand chroma 0.171 — it would be
    visually loud against the warm academic palette and inconsistent with the
    InspireHEP and arXiv badge lightness convention.

    **Step 2.2 — Extend the label ternary in PublicationEntry.tsx**

    Still in `src/components/publications/PublicationEntry.tsx`, lines 53–58.

    Current code:
    ```typescript
    const label =
      publication.source === "inspirehep"
        ? "InspireHEP"
        : publication.source === "arxiv"
          ? "arXiv"
          : "Manual";
    ```

    Replace with:
    ```typescript
    const label =
      publication.source === "inspirehep"
        ? "InspireHEP"
        : publication.source === "arxiv"
          ? "arXiv"
          : publication.source === "orcid"
            ? "ORCID"
            : "Manual";
    ```

    Hardcoded strings are fine here — this matches the existing pattern for
    "InspireHEP" and "arXiv" (also hardcoded, also proper nouns, also identical
    across locales). Do NOT introduce a new `publications.source.*` i18n namespace
    just for ORCID; that would break the established pattern.

    No other structural change to PublicationEntry.tsx. The `getSourcePillHref(publication)`
    call on line 44 already returns `null` for `source === 'orcid'` (falls through the
    current function body), so the `href ? <a> : <span>` ternary on lines 59–70
    correctly renders ORCID badges as non-link `<span>` elements — matching the
    Manual badge's non-link behaviour, per research Open Question 2. Discoverability
    is provided by the DOI link row on lines 80–102 (every ORCID entry has a DOI
    except one preprint, which correctly suppresses the DOI row via the existing
    `(publication.arxiv || publication.doi) && (…)` guard — research Pitfall 4).

    **Step 2.3 — Rewrite publications.footnote in messages/en.json**

    Open `messages/en.json`. Replace the current footnote (line 75):
    ```json
    "footnote": "Publications are sourced from InspireHEP and arXiv. The same paper may appear twice if indexed by both sources."
    ```

    With:
    ```json
    "footnote": "Publications are sourced from InspireHEP, arXiv, and ORCID. When the same paper is indexed by more than one source, entries are merged by DOI into a single record (precedence: InspireHEP, then ORCID, then arXiv)."
    ```

    **Step 2.4 — Rewrite publications.footnote in messages/es.json**

    Open `messages/es.json`. Replace the current footnote (line 75):
    ```json
    "footnote": "Las publicaciones provienen de InspireHEP y arXiv. Un mismo trabajo puede aparecer duplicado si fue indexado por ambas fuentes."
    ```

    With:
    ```json
    "footnote": "Las publicaciones provienen de InspireHEP, arXiv y ORCID. Cuando un mismo trabajo aparece en más de una fuente, las entradas se fusionan por DOI en un único registro (precedencia: InspireHEP, luego ORCID, luego arXiv)."
    ```

    Both strings:
    - Name three sources (satisfies UI-04 "three-source wording")
    - State the DOI merge rule in plain language (satisfies UI-04 "plain-language
      note about the DOI precedence rule")
    - Preserve the original sentence shape (no newlines, no markdown — these are
      rendered as-is inside a `<p>` with `text-sm text-ink-subtle`)

    **Pitfall guard (research Pitfall 2):** Both locale footnotes must be updated
    in the SAME task — missing one leaves Spanish-speaking readers seeing stale
    "dos fuentes" wording while English readers see the correct three-source
    version. Do both edits in Step 2.3 + Step 2.4 before moving on.

    **Step 2.5 — Add the `getSourcePillHref("orcid") → null` test case**

    Edit `src/lib/publications-helpers.test.ts`. Add a new `it(...)` block inside
    the existing `describe("getSourcePillHref", ...)` (starts at line 229), after
    the existing `branch 4 — manual → null` case (line 249). Use the existing
    `makePub(...)` helper (line 216) — no new helper needed.

    Add:
    ```typescript
      it("branch — orcid → null (non-link badge, DOI link row handles discoverability)", () => {
        const pub = makePub({
          source: "orcid",
          doi: "10.1016/j.nima.2020.164490",
        });
        expect(getSourcePillHref(pub)).toBeNull();
      });
    ```

    This test documents the locked decision (research Open Question 2): ORCID
    badges render as non-link spans because the DOI link row below already provides
    the canonical external link to `https://doi.org/{doi}`. If a future maintainer
    adds an `orcid` branch to `getSourcePillHref` that returns a URL, this test
    will fail — forcing them to delete or rewrite it, which surfaces the decision.

    **Do NOT** modify `src/lib/publications-helpers.ts` itself. The function's
    current behaviour (fall through to `return null` for any non-inspirehep,
    non-arxiv source) is exactly correct for ORCID. Adding an explicit `if
    (pub.source === "orcid") return null;` branch would be dead code — the existing
    fallthrough handles it.

    **Do NOT** add tests beyond the single "orcid → null" case. The pattern in this
    file is one assertion per branch; mirroring it keeps the suite style consistent.
  </action>
  <verify>
    `grep -n 'publication.source === "orcid"' src/components/publications/PublicationEntry.tsx`
    returns exactly two matches (one inside the tone ternary, one inside the label
    ternary).

    `grep -n 'oklch(0.95_0.05_118)' src/components/publications/PublicationEntry.tsx`
    returns exactly one match (the ORCID background tone).
    `grep -n 'oklch(0.40_0.12_118)' src/components/publications/PublicationEntry.tsx`
    returns exactly one match (the ORCID text tone).

    `grep -n '"ORCID"' src/components/publications/PublicationEntry.tsx` returns
    exactly one match (the label branch).

    Footnote wording in both locales:
    ```bash
    jq -r '.publications.footnote' messages/en.json
    ```
    Output must contain "InspireHEP, arXiv, and ORCID" AND "DOI" AND "precedence".
    ```bash
    jq -r '.publications.footnote' messages/es.json
    ```
    Output must contain "InspireHEP, arXiv y ORCID" AND "DOI" AND "precedencia".

    `grep -n 'orcid → null' src/lib/publications-helpers.test.ts` returns exactly
    one match.

    `pnpm tsc --noEmit` passes.

    `pnpm vitest run src/lib/publications-helpers.test.ts` passes, and the reported
    test count in that file rises by exactly 1 (from 5 to 6 in the getSourcePillHref
    describe block).

    JSON validity gates (same as Task 1):
    ```bash
    jq '.' messages/en.json > /dev/null
    jq '.' messages/es.json > /dev/null
    ```
    Both exit 0.
  </verify>
  <done>
    PublicationEntry.tsx renders ORCID entries with a muted olive-green badge
    labelled "ORCID"; the publications footnote in both locales describes three
    sources and states the DOI precedence rule in plain language;
    publications-helpers.test.ts has an explicit `orcid → null` case that passes.
    The project type-checks and the full helpers test file is green.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Build gates + manual browser verification on both locales</name>
  <what-built>
    Full ORCID display-layer parity: filter pill, source badge with distinct olive-
    green tone, bilingual strings, three-source footnote with DOI precedence note,
    explicit test coverage for the non-link ORCID badge, and verified Schema.org
    JSON-LD for ORCID entries on /publications.

    Claude will first run the automated gate battery (typecheck, tests, build, lint
    if present, and a content-validation sanity check), then hand off to you for a
    visual verification on the dev server. The automated gates must all be green
    before this checkpoint block is presented.
  </what-built>
  <how-to-verify>
    **Step 3a — Automated gates (Claude runs these before surfacing this checkpoint):**

    1. `pnpm tsc --noEmit` — exits 0.
    2. `pnpm vitest run` — all tests green; total count should be exactly 1 higher
       than end of Phase 17 (the `orcid → null` case added in Task 2).
    3. `pnpm build` — completes successfully; static generation emits both
       `/en/publications` and `/es/publicaciones` and all `/people/[slug]` routes
       in both locales with no errors or warnings about the ORCID entries or the
       Schema.org blocks.
    4. `pnpm validate-content` (if the script exists in package.json) — exits 0
       (defensive — no content files should have changed, but the Zod pipeline
       parsing `content/publications.json` against the schema confirms the 15 ORCID
       entries still validate cleanly with the updated UI code paths).
    5. Count assertion: `jq '[.publications[] | select(.source == "orcid")] | length'
       content/publications.json` prints `15` (sanity — no data mutation in this
       phase).

    If any automated gate fails, Claude stops and diagnoses BEFORE surfacing this
    checkpoint. When you see this checkpoint, all gates are green.

    **Step 3b — Manual browser verification (human — you):**

    Start the dev server in a terminal:
    ```bash
    pnpm dev
    ```

    Open the dev URL (typically http://localhost:3000) in a browser and visit each
    of the four surfaces below. All must behave as described. If any item fails,
    describe the failure when resuming.

    **(1) /en/publications — English publications page**

    Visit http://localhost:3000/en/publications

    Expected:
    - Filter pill group shows FIVE pills in order: `All | InspireHEP | arXiv | ORCID | Manual`.
    - Click the `ORCID` pill. It becomes visually active (same accent-color fill as
      the other active states) and `aria-pressed="true"`. The publication list now
      shows only ORCID entries (≥ 1 entry; 15 total exist).
    - Each visible publication has a green-tinted badge reading `ORCID` in the
      two-chip cluster just below the title/authors line. The badge is a non-link
      `<span>` (hover reveals no pointer cursor change toward link affordance). The
      DOI link row below (e.g., "DOI:10.1016/j.nima.2020.164490") is clickable and
      opens doi.org in a new tab.
    - The `Manual` pill still appears to the right of `ORCID`.
    - Scroll to the footer of the list. The footnote reads: "Publications are
      sourced from InspireHEP, arXiv, and ORCID. When the same paper is indexed by
      more than one source, entries are merged by DOI into a single record
      (precedence: InspireHEP, then ORCID, then arXiv)."
    - Click `All` — the list returns to showing all entries; InspireHEP badges are
      blue, arXiv badges are orange, ORCID badges are olive-green — all three are
      visually distinct at a glance.

    **(2) /es/publicaciones — Spanish publications page**

    Visit http://localhost:3000/es/publicaciones

    Expected:
    - Filter pills: `Todos | InspireHEP | arXiv | ORCID | Manual` (only the "Todos"
      pill changes across locales; proper nouns stay identical).
    - Click `ORCID`. Same behaviour as English: aria-pressed true, list filters to
      ORCID-only.
    - Badge label is still `ORCID` (proper noun, unchanged).
    - Footnote reads (exactly): "Las publicaciones provienen de InspireHEP, arXiv y
      ORCID. Cuando un mismo trabajo aparece en más de una fuente, las entradas se
      fusionan por DOI en un único registro (precedencia: InspireHEP, luego ORCID,
      luego arXiv)."
    - No English strings leak into the Spanish page.

    **(3) /en/people/tomas-ferreira-chase — SiPM paper on the people page**

    Visit http://localhost:3000/en/people/tomas-ferreira-chase

    Expected:
    - In the publications section, the 2020 SiPM paper appears: title "Silicon
      photomultiplier characterization on board a satellite in Low Earth Orbit";
      journal "Nuclear Instruments and Methods in Physics Research Section A:
      Accelerators, Spectrometers, Detectors and Associated Equipment"; year 2020.
    - The author list renders correctly — all 11 authors (or, if the author list
      uses the et-al truncation because the member is at index 4, the first three
      authors + ellipsis + Tomás Ferreira Chase with member highlighting). Either
      rendering is acceptable; the point is that the entry is structurally
      identical to the InspireHEP/arXiv entries on the same page.
    - The source badge on the SiPM entry reads `ORCID` with the olive-green tone —
      matching the /publications page.
    - The DOI link row below reads `DOI:10.1016/j.nima.2020.164490` and is
      clickable.

    **(4) /es/personas/tomas-ferreira-chase — Spanish people page**

    Visit http://localhost:3000/es/personas/tomas-ferreira-chase

    Expected:
    - Same entry as (3), same badge, same author list, same DOI. Spanish section
      heading ("Publicaciones recientes") is unchanged from prior phases.

    **(5) Schema.org JSON-LD verification (UI-05)**

    Still on /en/publications, open the page source (Ctrl+U or Cmd+Opt+U) — NOT
    devtools, the raw HTML. Search for `ScholarlyArticle` in the source. Expected:
    - Multiple `<script type="application/ld+json">` blocks, one per publication.
    - Locate the block for the SiPM paper (search for `10.1016/j.nima.2020.164490`
      or `Silicon photomultiplier`). It should be a well-formed JSON object with
      `@context: "https://schema.org"`, `@type: "ScholarlyArticle"`, `headline` (or
      `name`), `author` array with 11 entries, `datePublished: "2020"`,
      `isPartOf`/`publisher` (journal string), and `sameAs` (DOI URL).
    - The JSON validates — no truncated strings, no escaped quote errors. If you
      want to be thorough, copy the block into https://validator.schema.org/ and
      confirm no errors or warnings about required fields.
    - There are NO `ScholarlyArticle` blocks on /en/people/tomas-ferreira-chase
      (people page only emits `Person` schema — this is correct per research Open
      Question 1).

    **Resume signal:**

    Type `approved` if all five checks pass, or describe any failure (which item,
    what you saw vs what was expected). If the failure is a typo in a string or a
    missed tone branch, Claude will fix it and re-run the gates; if the failure is
    more structural, Claude will diagnose before touching anything.
  </how-to-verify>
  <resume-signal>Type "approved" if all five manual checks pass, or describe issues (which check, what was wrong)</resume-signal>
</task>

</tasks>

<verification>
End-of-plan gates (ALL must pass before Phase 18 is declared complete):

1. **UI-01 — Filter pill:** `grep -c "'orcid'" src/components/publications/SourceFilter.tsx` ≥ 2; both locales have `publications.filter.orcid === "ORCID"`; manual click on the pill on both locales shows only ORCID entries with `aria-pressed="true"`.
2. **UI-02 — Source badge:** `grep -c 'publication.source === "orcid"' src/components/publications/PublicationEntry.tsx` returns 2 (tone + label); ORCID entries on both locales render with olive-green tone and `"ORCID"` label, visually distinct from InspireHEP (blue) and arXiv (orange).
3. **UI-03 — i18n keys:** `jq '.publications.filter.orcid' messages/en.json messages/es.json` both print `"ORCID"`.
4. **UI-04 — Footnote:** `jq -r '.publications.footnote' messages/en.json` contains "InspireHEP, arXiv, and ORCID" AND "DOI" AND "precedence"; `jq -r '.publications.footnote' messages/es.json` contains "InspireHEP, arXiv y ORCID" AND "DOI" AND "precedencia"; footnote visible on /en/publications and /es/publicaciones.
5. **UI-05 — Schema.org:** Page source of /en/publications contains a `ScholarlyArticle` JSON-LD block for the SiPM paper with title, 11 authors, year 2020, journal string, and DOI `10.1016/j.nima.2020.164490`; people slug page emits only `Person` schema (unchanged).
6. **SiPM paper end-to-end:** /en/people/tomas-ferreira-chase and /es/personas/tomas-ferreira-chase both show the SiPM paper with ORCID badge, full author list, year, journal, clickable DOI link.
7. **Type safety:** `pnpm tsc --noEmit` exits 0.
8. **Tests:** `pnpm vitest run` exits 0; total test count rises by exactly 1 vs end of Phase 17 (the `orcid → null` case in publications-helpers.test.ts).
9. **Build:** `pnpm build` exits 0; all static routes generate.
10. **Content validation (sanity):** `pnpm validate-content` exits 0; `jq '[.publications[] | select(.source == "orcid")] | length' content/publications.json` prints `15` (no data mutation).
11. **Git:** Final commit(s) use `feat(18):` / `test(18):` / `docs(18):` prefix per project convention.
</verification>

<success_criteria>
All four Phase 18 ROADMAP success criteria are satisfied:

1. On /publications (both `/es/publicaciones` and `/en/publications`), an "ORCID"
   filter pill appears in the SourceFilter group; clicking it shows only
   ORCID-sourced entries and the pill renders as active (`aria-pressed="true"`).
2. Each ORCID publication entry on /publications displays a source badge labelled
   "ORCID" (visually distinct from "InspireHEP" and "arXiv" badges) that uses the
   same PublicationEntry component with a new source variant — no new badge
   component.
3. The footnote below the publication list reads as a three-source description in
   both Spanish and English and includes a plain-language note about the DOI
   precedence rule.
4. On /people/tomas-ferreira-chase, the SiPM paper appears in the "Publicaciones
   recientes" section with its full author list, rendered identically in structure
   to InspireHEP- and arXiv-sourced papers (DOI link, year, journal string).

All five v1.3 display-layer requirements (UI-01 through UI-05) are complete. UI-05
is interpreted as a no-op verification per 18-RESEARCH.md Open Question 1 —
buildScholarlyArticleSchema on /publications already handles ORCID entries because
it reads only source-agnostic fields; the people slug page only emits Person
schema and that is unchanged.
</success_criteria>

<output>
After completion, create `.planning/phases/18-display-layer/18-01-SUMMARY.md`
summarising:
- Files changed with LOC deltas (SourceFilter.tsx ±N, PublicationEntry.tsx ±N,
  messages/en.json ±N, messages/es.json ±N, publications-helpers.test.ts +1 case)
- The exact OKLCH tone pair used for the ORCID badge (lock the decision)
- The exact final English + Spanish footnote strings (so Phase 19 docs can quote
  them verbatim)
- Test count delta (should be exactly +1)
- Browser verification outcome: screenshots or text notes on all five manual
  checks (filter pill on /en, filter pill on /es, SiPM on people page EN, SiPM on
  people page ES, Schema.org JSON-LD in page source)
- SiPM paper render confirmation (badge + 11 authors + DOI link + journal + year)
- Any deviations from the plan (none expected)
- Final state: Phase 18 is DONE; all five UI-0x requirements complete; ready for
  `/gsd:verify-phase 18` and then Phase 19 (Docs & Verification — the final v1.3
  phase).

Use the template at `/home/tomas/.claude/get-shit-done/templates/summary.md`.
</output>
