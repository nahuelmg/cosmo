# Phase 7: Schema Extension - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend PersonSchema with sync-enabling fields (`inspirehep_id`, `arxiv_id`, `display_name_normalized`) and extend PublicationSchema with `source` + arXiv ID fields. Ship supporting maintainer docs and deprecate `publications_selected`. Populate real IDs for all current investigators + postdocs.

Scope anchor: schema + JSON Schema regen + content migration + maintainer lookup guide. All four ship atomically so later phases have a trustable foundation.

**Out of scope for Phase 7:** sync script (Phase 9), publications page flip (Phase 11), author highlighting *logic* (Phase 11 — this phase only ships the `display_name_normalized` field it will consume).

</domain>

<decisions>
## Implementation Decisions

### `display_name_normalized` field

- Ships on PersonSchema in **Phase 7**, not Phase 11 — one atomic maintainer migration pass (IDs + normalized name filled together in Plan 07-02).
- Normalization rule: **ASCII-fold + lowercase**. `"Núñez, María"` → `"nunez, maria"`, `"Calzetta, Esteban"` → `"calzetta, esteban"`. Deterministic, simple, covers accents.
- Zod type: **required string, `.min(1)`**. CI fails fast if maintainer forgets to populate. Matches "populate everything in one pass" intent.
- Maintainer fills **manually** in Plan 07-02 (no preprocessor auto-derivation — wrong for compound surnames / particles).
- Phase 11 consumption (already decided, noted for planner awareness): substring match between normalized incoming author string and `display_name_normalized`.

### `inspirehep_id` and `arxiv_id` fields

- Zod regex validation (from milestone lockdown, restated for planner):
  - `inspirehep_id`: BAI format `/^[A-Z]\.[A-Za-z-]+\.\d+$/` (e.g., `E.Calzetta.1`)
  - `arxiv_id`: **extended regex** `^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$` — accepts both modern (`2401.12345`) and pre-2007 (`gr-qc/9209007`) formats.
- Both **optional** at schema level for students who don't publish yet (see Student population rule below).
- Each field gets JSDoc with **`@see content/SYNC.md`** pointer — editor hover surfaces lookup instructions where maintainer types the value.

### Maintainer docs (`content/SYNC.md`)

- Ships in **Phase 7** as a new file. Scope: **lookup instructions only** (~1 screen):
  - How to find your InspireHEP BAI.
  - How to find your arXiv claimed-author ID (or note "skip if no claimed-author profile").
  - Format reminder for `display_name_normalized` (ASCII-fold + lowercase, "Lastname, Firstname" style).
- **Roadmap update consequence:** Plan 11-04 (Maintainer docs) is **dropped** from Phase 11. SYNC.md is complete after Phase 7. Phase 11 shrinks to 3 plans (11-01..03).
- JSDoc pointer format on schema fields: `@see content/SYNC.md`.

### `publications_selected` deprecation

- Field remains on PublicationSchema / Person export — **inert** in v1.1. Accessor ignores it; `/people/[slug]` reads only from auto-synced publications in Phase 11.
- Annotated `@deprecated` in JSDoc, with note "remove after v1.2".
- **Warning surface:** `scripts/sync-publications.ts` only (not build-time, not silent). Per-person one-liner log format:
  > `⚠  <slug>: publications_selected has N entries (deprecated — remove after v1.2). Auto-sync will populate from inspirehep_id.`
- Removal scheduled for **v1.2** milestone — carried forward in STATE.md.
- Sync script does **not** auto-clear the field. Maintainer cleans manually on their own schedule. (Keeps sync commits focused on generated publications JSON; never mutates people.json.)

### Plan 07-02 (DATA-09/10 population) scheduling

- **Blocks Phase 9 E2E test only** (not Phase 7 completion, not Phases 8 accessor work). Phase 7 completes when Plan 07-01 (schema + JSDoc + SYNC.md) passes verification. Plan 07-02 runs as async human task in parallel with Phases 8–9 code work.
- **Coverage requirement:** 100% of current investigators + postdocs. Students deferred — they add IDs when they publish (JSDoc note on field).
- **Missing-ID policy:** skip silently + log INFO in sync script. `"INFO: <slug> has no inspirehep_id/arxiv_id, skipping"`. Profile shows empty publications. Consistent with locked "no name-based fallback" decision.
- **Deadline:** soft — "before Phase 9 E2E test". No calendar date. Maintainer sees the pressure because Phase 9 can't test without real data.
- **Phase 9 E2E verification approach** (noted for Phase 9 planner, not scope here):
  - Maintainer runs sync locally against 2–3 known people, reviews output.
  - Automated: script validates each populated ID returns ≥1 paper from InspireHEP/arXiv (catches typos).

### Claude's discretion

- Exact Plan 07-01 vs Plan 07-03 split (schema code and SYNC.md may be one plan or two — planner decides based on size).
- JSDoc phrasing beyond the `@see` pointer and `@deprecated` markers.
- Test-file locations for schema tests.
- Whether to add a helper `normalizeName()` exported from the schema module vs. inlined in Phase 11's highlight logic later.

</decisions>

<specifics>
## Specific Ideas

- BAI lookup trick for SYNC.md: "Search `author:<your-name>` on inspirehep.net, open your profile, copy the ID from the URL path (`/authors/<NUMERIC>` or the `bai` field on the API response)." Exact wording up to Plan 07-01.
- Pre-2007 arXiv format is real in this group — Calzetta has `gr-qc/9209007`-era papers. Regex extension is non-negotiable.
- `publications_selected` one-liner log format is specified verbatim above — planner should use that exact string.

</specifics>

<deferred>
## Deferred Ideas

- Fallback-when-sync-empty logic (use `publications_selected` if sync returns 0 hits) — rejected. "Auto-sync is source of truth" in v1.1.
- CI hard-fail on missing IDs — rejected for v1.1. Silent skip + log is the policy.
- Explicit `publishes: true|false` opt-in flag on PersonSchema — rejected. Optional ID fields + "populate when you publish" JSDoc is enough.
- Auto-clear `publications_selected` on successful sync — rejected. Maintainer-owned data stays maintainer-edited.
- Separate `scripts/cleanup-deprecated.ts` helper — deferred to v1.2 removal work.
- Automated ID resolution probe as a standalone CI job — deferred. Folded into Phase 9 E2E spot-check approach.

### Roadmap update triggered by this discussion

- **Drop Plan 11-04** (Maintainer docs) — SYNC.md is owned by Phase 7 now. Phase 11 shrinks to 11-01, 11-02, 11-03. To be reflected in ROADMAP.md before/during Phase 7 planning.

</deferred>

---

*Phase: 07-schema-extension*
*Context gathered: 2026-04-18*
