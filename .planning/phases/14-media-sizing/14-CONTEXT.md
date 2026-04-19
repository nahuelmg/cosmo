# Phase 14: Media Sizing - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Re-proportion member photos and supporting imagery so no image dominates its page. Scope: `PersonCard` width + aspect ratio + grid behaviour, `PersonDetail` hero photo size + shape + surrounding layout, `HeroCarousel` + homepage highlight imagery audit/rebalance, `OutreachCard` media audit, and `next/image` `sizes` attribute updates to keep srcset downloads aligned with the new widths. Preserves the warm-academic direction — photos become quieter and more editorial without changing the content or introducing new components.

Requirements in scope: MEDIA-01..05.

</domain>

<decisions>
## Implementation Decisions

### PersonCard sizing (MEDIA-01)

- **Cap card width** via `max-w-[240px]` (or token equivalent) on the card itself. Do NOT switch to 4-col at lg.
- **Target width:** ~240 px on lg+ (tightest end of the MEDIA-01 range — photos read as quiet and encyclopedic).
- **Grid breakpoints:** 1 col → sm, 2 col → md, 3 col → lg, 4 col → xl. Conservative shift — 4-col only at xl (1280 px+).
- **Aspect ratio:** Portrait **4:5** (taller than square). Shoulders/context read better at the smaller size; more portrait-like.
- **Card alignment inside grid cell:** Centered horizontally. With 3-col grid at lg and 240 px card cap, each cell will be wider than the card — breathing room falls evenly on both sides (encyclopedic whitespace).

### PersonDetail hero treatment (MEDIA-02)

- **Photo size:** **180 px** on desktop (tightest end of the MEDIA-02 range — clearly subordinate to the bio text).
- **Aspect ratio:** **Match PersonCard 4:5**. Detail hero mirrors the card shape — photo reads as a zoom-in on the card.
- **Recovered space allocation:** **Wider bio column**. Bio copy occupies the horizontal space released by the shrunk photo — longer line length, more prose feel. Headings stay at their Phase 13 tokens (no heading bump).
- **Mobile layout (< md):** Claude's discretion. Test both stacked and inline-at-375 px with the 180 px photo; pick whatever reads cleanly.

### Hero carousel (MEDIA-03)

- **Scope:** **Audit only.** Verify aspect ratio + min-height read well at 375 / 768 / 1024 / 1440 px. No prescriptive resize.
- **min-height direction if a change is needed anyway:** **Stay current.** Hero is the one place where imagery is supposed to dominate — don't shrink.

### Homepage highlight imagery (MEDIA-04)

- **Scope:** **Check all, resize as needed.** Walk every homepage image (hero carousel, News/Research highlights, any inline imagery) and adjust proportions where they dominate.
- **"Over-dominant" definition:** **Claude's discretion.** Warm-academic lens — the test is "image supports, text leads". Photo visibly outweighing its adjacent headline + copy block is the working rule, but Claude decides case-by-case.

### OutreachCard imagery

- **Scope:** **Audit only.** Verify current aspect + sizing reads balanced on the `max-w-6xl` grid. No change unless clearly off.
- **Aspect ratio if a change is forced:** Keep current (~16:9). Video-like framing works for talks/events.

### next/image `sizes` attribute (MEDIA-05)

- **Plan grouping:** **Claude's discretion.** Group into the same plan as the card sizing change OR split into its own small plan — whichever reads cleaner as an atomic commit. Values must be updated so Next serves the correct srcset for the new 240 px PersonCard width and any Outreach/homepage imagery adjusted in MEDIA-04.

### Claude's Discretion

- Exact tailwind class / utility for capping PersonCard width (arbitrary `max-w-[240px]` vs adding a custom token — lean toward the arbitrary value unless it appears in more than two places).
- Responsive `sizes` attribute string values (e.g., `(min-width: 1280px) 240px, (min-width: 1024px) 33vw, ...`) — derive from the chosen breakpoint grid.
- Whether the 4:5 aspect ratio is encoded via `aspect-[4/5]` on the image wrapper vs fixed width/height pairs on `next/image`.
- Mobile stacked-vs-inline PersonDetail hero layout at 375 px.
- Visual-verification breakpoints beyond the required 375/768/1024/1440 (e.g., 1920 for wide screens).
- Exactly which homepage images count as "over-dominant" under MEDIA-04.

</decisions>

<specifics>
## Specific Ideas

- PersonCard should read like an encyclopedic academic directory — photos quiet, name/role leads, breathing room around each card.
- 4:5 portrait aspect ratio is the defining shape for member imagery across the site (PersonCard AND PersonDetail hero). Any new portrait surface should follow.
- Hero carousel is the one exception to "images subordinate to text" — it's supposed to lead. Don't shrink it unless the audit finds a concrete regression.
- Homepage highlight imagery should step down where it currently dominates, but only where; don't over-apply the shrink rule.
- `next/image` `sizes` updates are functional, not cosmetic — they save bytes without visual change. Keep them mechanical and paired to the visual edits so the srcset stays accurate.

</specifics>

<deferred>
## Deferred Ideas

- **Circular portrait crop** — rejected; academic portrait convention wants rectangular/square. Could revisit if the institutional aesthetic shifts later.
- **Gallery treatment on PersonDetail** — no change in this phase; current layout stays.
- **PersonDetail pull-quote / enlarged role treatment** — rejected; recovered hero space goes to bio width, not new typographic moves.
- **Hero carousel full-bleed variant** — already declined in Phase 13 CONTEXT; stays declined here too.
- **Homepage hero min-height mobile-only trim** — not selected; hero stays as-is unless audit finds a break.

</deferred>

---

*Phase: 14-media-sizing*
*Context gathered: 2026-04-19*
