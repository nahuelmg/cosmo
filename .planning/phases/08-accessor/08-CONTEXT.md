# Phase 8: Accessor Layer - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a single pure helper `getPublicationsByAuthor(nameVariants: string[], options?: { lastNYears?: number }): Publication[]` in `src/content/accessors/publications.ts`, re-exported from `src/content/index.ts`.

**In scope:** the accessor's behavior, signature, ordering, and edge cases. Used by `/people/[slug]` (last-10-years list) and — in Phase 11 — by `/publications` (full archive).

**Out of scope:** per-source filtering (Phase 11 PUBS-07), per-person exclude lists (deferred to v1.2), helper for deriving `nameVariants` from a `Person` object (caller's responsibility — keeps ACC-05 no-import rule trivial to enforce), UI rendering of results.

</domain>

<decisions>
## Implementation Decisions

### Name matching

- **Match style:** substring match, case-insensitive, NFC-normalized, with a **minimum variant length of 4 characters**. Variants shorter than 4 chars are silently skipped; if no variants remain, accessor returns `[]`.
  - Rationale: substring is forgiving for the many author-string layouts in publications.json ("García, F.", "F. García", "García, Federico"). The 4-char guard prevents accidental matches from initials like `"F."` or `"J."`.
  - Known trade-off: "García" will also match "García-Bellido" (different person). This is acceptable — callers know their people and will pass full surnames (≥4 chars) that disambiguate, and the group has no collision between current members.
- **Author scope:** match if the variant substring appears in **any element** of the publication's `authors: string[]` array, not just the first author. Co-authored papers surface on every matching member's profile.
- **Variant generation:** **caller passes variants explicitly**. Accessor takes `string[]` and does not import from `people.ts`. The caller (`/people/[slug]`) assembles its own variant list (typically `[person.displayName, person.display_name_normalized]` and any other forms the maintainer knows about). No `deriveNameVariants` helper in this phase — YAGNI until there's a second caller that needs it.
- **Collaboration papers:** included. A 100+-author Planck or Euclid paper that lists a group member will appear on that member's profile. Trimming collaboration papers is a Phase 11 UI concern (e.g., future toggle), not an accessor concern. Accessor stays naive.

### Year window

- **Window bounds:** `year >= (currentYear - lastNYears)` where `currentYear = new Date().getFullYear()`. For `lastNYears: 10` in 2026, the window is **2016–2026 inclusive** (11 buckets). This matches the literal "N years back from current year" reading.
- **No option passed:** `getPublicationsByAuthor(variants, {})` or `getPublicationsByAuthor(variants)` applies **no year filter** and returns all matching publications. Used by `/publications` (full archive).
- **Future years:** included. No upper bound on year. A paper dated 2027 (forward-dated preprint or upcoming issue) appears in the `lastNYears: 10` window when called in 2026. Handles preprint-with-forward-issue-year cleanly.
- **`lastNYears: 0`:** valid — returns only papers where `year === currentYear`. Guard with `options.lastNYears !== undefined` (not a truthiness check) so `0` is distinguishable from "unset".

### Return ordering

- **Primary sort:** pre-sorted **inside** the accessor — year descending, newest first. Both consumers (`/publications`, `/people/[slug]`) render newest-first; no value in making them each sort.
- **Tie-breaker (within the same year):** **arXiv ID descending** — newest arXiv IDs first. Papers without an arXiv ID sink to the bottom of their year bucket.
- **Non-mutation:** `[...publications].sort(...)` — never mutate the imported publications array. Shared module state mutation is an SSG/React footgun; the copy cost is negligible (~100s of entries).

### Edge cases

- **Empty `nameVariants`:** return `[]` silently. Caller mistake shouldn't crash the profile page.
- **Short variants (<4 chars):** filter them out internally; still process remaining variants. If all variants are short, return `[]`. No throw.
- **No matches found:** return `[]` silently. An author with no publications is a real state — the display layer renders a friendly empty section. Accessor does not log.
- **Malformed data:** relies on the already-validated `Publication` type from Phase 7. No defensive re-validation inside the accessor — the Zod parse at content-load time is the boundary.

### Claude's Discretion

- Exact internal helper shape (e.g., separate `matchesName(pub, variants)` pure fn vs inline filter) — planner/implementer picks what reads best.
- How NFC normalization is applied (normalize both variants and author strings once, or per comparison) — correctness equivalent; optimize if measurable.
- Test fixtures and coverage mix — but tests should cover: 4-char guard, any-author match, NFC diacritic fold, year-window cutoff including `lastNYears: 0`, empty variants, no matches, pre-sorted output, non-mutation of input.

</decisions>

<specifics>
## Specific Ideas

- **Pure function.** No side effects, no logging, no I/O. Imports from `publications.ts` (the JSON-backed module) only. Zero imports from `people.ts` — this is both ACC-05 and a structural circular-dep guard.
- **Mirrors Phase 9 sort.** The accessor's year-desc + arxiv-id-desc tie-breaker lines up with the deterministic sort Phase 9 will produce in `publications.json`. After Phase 9, the accessor's sort becomes effectively a no-op on well-formed input — but it stays in place so v1.0 manual data (not guaranteed sorted) displays correctly, and so the accessor remains self-sufficient.

</specifics>

<deferred>
## Deferred Ideas

- **`deriveNameVariants(displayName)` helper** — not needed until a second caller wants the same logic. Phase 11 will reassess once `/publications` wires up author highlighting via the same `display_name_normalized` field.
- **Collaboration-paper filtering / "hide papers with >N authors"** — Phase 11 UI concern, not accessor.
- **Per-person exclude list (`exclude_arxiv_ids`)** — explicitly deferred to v1.2 (OPS-DEFER-02 in REQUIREMENTS.md).
- **Source filtering in the accessor (`{ source: "inspirehep" }` etc.)** — Phase 11 handles source filtering in the browser via PUBS-07 toggle; accessor doesn't need it.

</deferred>

---

*Phase: 08-accessor*
*Context gathered: 2026-04-19*
