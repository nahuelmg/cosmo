# Phase 11: Display Layer - Context

**Gathered:** 2026-04-19
**Status:** Ready for research / planning

<domain>
## Phase Boundary

Render the auto-populated publications archive on `/publications` with source badges, a source filter, preprint indicators, staleness date, bilingual two-source footnote, and member-author highlighting; and add a per-member last-10-years publications section on `/people/[slug]` that reuses the same entry component. The old `publications_selected` render path is removed. All new UI strings land in both `messages/es.json` and `messages/en.json` with zero key drift.

**In scope:** the shared publication entry component, the `/publications` page updates (data source flip + filter + staleness + footnote), the profile-page publications section, i18n keys, and legacy-field cleanup at render time.

**Out of scope:** URL state for filter (PUBS-04 deferred), runtime ISR, any change to schemas / sync script / CI workflow (Phases 7–10 outputs are frozen), Google Scholar linking (deferred to v1.2).

</domain>

<decisions>
## Implementation Decisions

### Source & preprint badges

- **Arrangement:** two separate chips per entry — one for source, one for preprint/published status. Scannable signals; both stay independently meaningful.
- **Source pill colors:** brand-tinted per source — InspireHEP blue-family, arXiv red/orange-family, Manual neutral. Tint intensity kept subdued to fit the site palette; do not introduce saturated brand colors that clash with the design tokens.
- **Preprint label wording:** bilingual literal — `Preprint` / `Publicado` (ES) and `Preprint` / `Published` (EN). Matches the string already used as the sync-script journal fallback, so preprint entries read consistently regardless of surface.
- **Source pill clickability:** the source pill is a link. InspireHEP → the literature record; arXiv → the abstract page. Manual entries render the pill as a non-link badge (same visual, no link target). Preprint chip is not a link.
- **Pill placement within the entry:** Claude's discretion during planning — pair the two chips visually (same row, small gap) so they read as a stacked metadata cluster rather than random badges.

### Filter toggle UX (/publications only)

- **Pattern:** segmented control / pill group — horizontal band of four pills (`Todos` / `InspireHEP` / `arXiv` / `Manual`), active pill filled with the site accent. On mobile, wrap rather than scroll horizontally.
- **Semantics:** single-select. `Todos` is the explicit "show everything" state; to see all again, visitor clicks `Todos`. Clicking the currently active non-`Todos` pill does NOT deselect (to avoid ambiguous "nothing selected" state).
- **URL state:** none. Filter is in-memory only — reload resets to `Todos`. Matches PUBS-04 deferral; keeps the page statically exportable.
- **Stickiness:** Claude's discretion — likely sticky on `/publications` (long archive benefits from filter-while-scrolling) and static on the profile section where the list is at most ~30 items.

### Author highlighting

- **Style:** bold weight only (`font-weight: 700`). No accent color, no underline. Most neutral; doesn't clash with existing type color and survives both locales / themes.
- **'Et al.' edge case:** if a highlighted member falls past position 3 in a >5-author list, expand the truncation enough to keep the member visible. Either `"First, Second, Third, …, Member, et al."` or extend the head through the member — planner picks the exact shape. The invariant: a member is never invisible under `et al.` on their own group's site.
- **Membership scope:** highlight both current AND past members (anyone present in `content/people.json`, regardless of `status`). Shows the group's historical continuity; doesn't create a signal-decay edge when members transition from postdoc → alumni.
- **Matching strategy:** Claude's discretion during planning. The Phase-8 accessor already uses NFD-normalized comparison against `display_name_normalized`; the expectation is to reuse the same helper, but research should confirm payload shapes from InspireHEP vs arXiv since the author strings differ (InspireHEP gives structured `full_name`, arXiv gives CSV). Planner produces a single helper that both the `/publications` page and the profile section call — no bespoke matching per surface.

### Profile publications section (/people/[slug])

- **Layout:** same card style as `/publications` — reuse the shared entry component verbatim. Same density, same badges, same author-highlight behavior. Consistency beats per-surface optimization; visitors who land on a profile and then click through to `/publications` see identical rows.
- **Heading:** just `Publicaciones` / `Publications`. No inline count, no subtitle, no "últimos 10 años" framing in the heading. The 10-year window is an implementation detail, not a user-facing framing.
- **Count display:** dropped entirely. The heading stands alone; the list's own length does the communication. **This softens ROADMAP SC5 and the REQ wording for PEOP-14 / PUBS-08 (count subtitle) — planner must call this out when flipping the traceability table, and the verification step should not treat the absence of the count as a gap.**
- **Empty state:** hide the section entirely when `getPublicationsByAuthor(...)` returns zero. No heading, no placeholder. During the DATA-09/10 rollout (13 members still need `inspirehep_id` + `orcid_id`), most profiles will simply not show a publications section — intentional.
- **Legacy `publications_selected`:** render path stripped immediately in this phase. Zod schema keeps the `@deprecated` field (v1.2 removes it per Phase 7 decisions), but no component reads it after Phase 11. Cleanest cut; matches ROADMAP "the old publications_selected list is gone".

### Claude's Discretion

- Exact pill size, padding, radius, and typographic treatment — match existing design-system tokens.
- Loading / error states on `/publications` when `_meta.synced_at` is somehow missing — planner picks a sensible default (likely: render without the "Actualizado el" line, site still functions).
- Skeleton / suspense behavior — the page is statically generated, so there's no real loading state; only include skeleton treatment if a hydration moment warrants it.
- Stickiness of the filter on `/publications` (see above).
- Exact matching helper shape for author highlighting (see above).
- Placement and tone of the bilingual two-source footnote — visible by default, at the bottom of the `/publications` list, body-text sized.
- Staleness-line placement — at the top or bottom of `/publications`; not needed on profile sections.

</decisions>

<specifics>
## Specific Ideas

- **Brand hints:** InspireHEP associates with blue (their site chrome); arXiv associates with red/orange (their header band). Tints should feel like a nod, not a reproduction — stay within the existing palette's value range so the site doesn't suddenly become a rainbow of external brands.
- **"Preprint" as fallback consistency:** the journal field on sync outputs uses `"Preprint"` for both InspireHEP (all-null publication_info, fixed in Phase 10 Task 1) and arXiv (always). The display-layer preprint chip should derive from the semantic signal (presence/absence of a journal), not from literal string matching on `"Preprint"` — planner decides.
- **Member-in-tail expansion:** when the first three author slots don't include a member but slot 7 does, the natural fix is `"A, B, C, …, M, et al."` with an ellipsis to signal the omission. This may vary by language (Spanish typography).

</specifics>

<deferred>
## Deferred Ideas

- **URL state for filter (`?source=arxiv`)** — already deferred in ROADMAP as PUBS-04; explicitly out for v1.1.
- **Multi-select filter** (combining InspireHEP + Manual) — not worth the state complexity for v1.1; revisit if visitors request it.
- **Click-active-to-reset on the filter** — considered and declined; ambiguous "nothing selected" state.
- **Filter stickiness variant on profile** — unlikely to help (short lists); kept as Claude's discretion rather than a separate decision.
- **Accent color / underline for member highlighting** — considered, went with plain bold for neutrality.
- **Count subtitle on profile section** — explicitly dropped (softens ROADMAP SC5). If a future milestone wants it back, it's a single-line addition.
- **Hover tooltip on highlighted member name (linking to their profile)** — nice-to-have, not required for v1.1; could be added as a small follow-up.
- **Google Scholar link on profile cards** — already deferred to v1.2 per Phase 7 decisions (no public API).
- **Past-member coauthor highlighting via their own status line** — not in scope; highlighting is a visual signal, not a data query.
- **Toggle-to-expand `et al.` on click** — considered; adds interactive state for marginal benefit over "auto-expand when member is hidden".

</deferred>

---

*Phase: 11-display-layer*
*Context gathered: 2026-04-19*
