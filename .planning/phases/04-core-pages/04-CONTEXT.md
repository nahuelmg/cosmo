# Phase 4: Core Pages - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

All seven top-level pages (Home, People list + detail, Research, Publications, Journal Club, Outreach, Contact) render real placeholder content end-to-end in both locales (es/en), consuming the content layer from Phase 2 and wearing the layout shell from Phase 3.

**Scope adjustment from roadmap:** Publications filter UI (PUBS-04) is deferred beyond Phase 4. The page renders a plain year-grouped list only — no filter controls, no URL-synced state. PUBS-04 moves to a future phase.

SEO metadata (Phase 5), a11y audit (Phase 6), and content authoring (separate content-edit phase) are all out of scope.

</domain>

<decisions>
## Implementation Decisions

### Home hero carousel
- **Timing:** 7s visible per slide, 1s crossfade. Calm pace suited to a research group — gives visitors time to read the overlay.
- **Pause triggers (in addition to mandatory reduced-motion pref and explicit pause button):**
  - `document.hidden === true` (tab backgrounded) → pause
  - Hover → does NOT pause (deliberate; carousel keeps rotating even when a visitor reads the overlay)
  - Keyboard focus → does NOT pause (deliberate; pause button is the affordance)
- **Overlay:** static across all slides — group name + tagline + affiliation. Same copy every slide (matches HOME-02 literally). Simpler, always on-brand, no per-slide caption writing needed per locale.
- **Controls:** dot indicators + pause button clustered bottom-right of the carousel as a single focus group. Pause button is a visible icon button (not hover-revealed).
- **Images:** 3–5 landscape placeholders (HOME-01). WCAG-AA overlay contrast on every slide (HOME-02).

### People list — grouping & clickability
- **Grouping:** continuous scrollable page with one H2 section per role bucket. No tabs, no sticky sub-nav. Order: PIs → Postdocs → PhDs → Undergrads → Past Members. Good for SEO (one URL), good for Cmd+F, good for print.
- **Clickable roles (PI, Postdoc, PhD):** large card — square photo, name, title. 3-up desktop / 2-up tablet / 1-up mobile. Hover: lift + accent underline. Clicking navigates to `/people/[slug]`.
- **Non-clickable roles (Undergrads, Past Members):** text-only list — NOT cards. Rendered as a clean rows list under the H2. Strongest possible visual divergence so visitors never attempt to click and hit a dead affordance.
- **Past Members format:** `Name — Position, YYYY–YYYY` (e.g., "Dr. Jane Doe — PhD, 2018–2023"). No current affiliation field — explicitly avoids the maintenance burden of tracking alumni as they move jobs.

### Publications — list only (no filters)
- **No filter UI in Phase 4.** The page is a clean, year-grouped bibliography.
- **Grouping:** by year, most recent first (PUBS-01).
- **Per entry:** authors / title / journal / year / arXiv link / DOI link (PUBS-02, PUBS-03).
- **No URL query params, no filter controls, no empty-filtered-results state.**

### Contact map embed
- **Provider:** Google Maps iframe embed. Zero JS, zero API key, zero runtime cost. Familiar to visitors; tracking trade-off accepted (research group, not a consumer product).
- **Lazy-load:** IntersectionObserver triggers iframe mount when the map container scrolls near the viewport. Zero LCP impact on initial paint (CONT-04).
- **Interaction:** fully interactive — default Google embed behavior (zoom, pan, click pin to open Maps in a new tab). No scroll-zoom trap mitigation.
- **Fallback:** address rendered as a prominent link to `maps.google.com/?q=<coords>` — always present as the progressive-enhancement base. Works with JS disabled, iframe blocked, or network failure. Visitors always have a path to directions.

### Claude's Discretion
- **Research page** grid of 4 areas (Dark Matter, Gravitational Waves, Early Universe, AI) — icon/image + title + short description layout (RSCH-01..02).
- **Journal Club** upcoming-session list + past-session archive visual treatment (continuous year sections vs accordion — Claude picks the simplest variant that matches the People-list continuous-section pattern).
- **Outreach** activity grid density, optional-link rendering (videos / slides / articles) when present, hide cleanly when absent (OTRCH-01..03).
- **People detail** page layout beyond roadmap spec (large photo + name + title + affiliation + 2–4 paragraph bio + research-interests bullets + selected publications + obfuscated email + office + ORCID + Google Scholar + optional links).
- All typography, spacing, focus-ring specifics, loading skeletons, and error/empty states across every page.

</decisions>

<specifics>
## Specific Ideas

- Publications list should feel like a clean academic bibliography — not a search interface. Scan-friendly, printable, shareable by URL anchor per year.
- Contact address must always be crawlable by search engines and reachable with zero JS — the map is additive, not the primary affordance.
- Past Members list honors contributions without the maintenance burden of tracking alumni job moves (the "where are they now" pattern was explicitly rejected).
- Non-clickable people (Undergrads, Past Members) should read as a different kind of thing from clickable people — not "disabled" cards, but a different visual format entirely.

</specifics>

<deferred>
## Deferred Ideas

- **Publications filter UI + URL-synced state (PUBS-04)** — moved to a future phase. Phase 4 ships list-only; PUBS-04 is explicitly deferred, not dropped.
- **"Where are they now?" alumni current-affiliation field** — deliberate user choice to avoid stale-data maintenance on Past Members.
- **Per-slide hero captions** — considered, rejected in favor of static overlay.
- **Hover/focus pause on carousel** — considered, rejected in favor of explicit-button-only control.

</deferred>

---

*Phase: 04-core-pages*
*Context gathered: 2026-04-18*
