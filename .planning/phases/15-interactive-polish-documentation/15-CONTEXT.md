# Phase 15: Interactive Polish & Documentation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Every interactive element on the site (buttons, nav links, language toggle, source-filter pills, carousel pause/play + dots) reaches a ≥ 44 × 44 px effective tap area, every `focus-visible:ring-*` unifies on `ring-accent-ring` with a contrast-safe offset, subtle motion is added on the three specified surfaces (NavLink active-state, SourceFilter pill toggle, PersonCard photo zoom) under `motion-safe:`, and the design-system docs (`MASTER.md` end-to-end + `OVERRIDES.md`) reflect the v1.2 token + component deltas.

Closes requirements **BTN-01..06, MICRO-01..05, DOC-01/02** plus the routed follow-up **FU-HERO-01** (HeroCarousel control tap-target — already covered by BTN-03).

Scope is fixed by ROADMAP.md. Discussion clarified HOW to implement — no new capabilities added.

</domain>

<decisions>
## Implementation Decisions

### Focus ring on dark/image backgrounds (BTN-02, MICRO-05)

- **Pattern:** `ring-2 ring-accent-ring + ring-offset-2` with offset color chosen per context.
- **Offset color sourced per context, not as a token:** `ring-offset-surface` on light backgrounds, `ring-offset-black/40` on dark/image backgrounds. No new `--ring-offset` theme token (under the project's >2-places threshold for tokenization).
- **Sweep is full-codebase, single pass:** grep every `focus-visible:ring-*` and unify on `ring-accent-ring` + the chosen offset utility. Removes the legacy `ring-surface/70` from HeroCarousel controls. Closes BTN-02 in one commit, prevents drift.
- **Drift gate:** add a grep check (CI or pre-commit) that fails on any `focus-visible:ring-(?!accent-ring)` to prevent reintroduction.
- **MICRO-05 verification:** manual viewport audit at 375 / 1024 / 1440 px — tab through Hero controls, Publications source-filter pills, People cards. Capture pass/fail per element. Same audit shape Phase 14-03 used. Does NOT rely on `pnpm axe` for ring contrast (axe doesn't check focus-ring contrast against image backgrounds).

### Motion language (MICRO-01..03)

- **MICRO-03 PersonCard photo zoom:** SHIP at `scale(1.02)` / `200ms` / ease-out, wrapped in `motion-safe:`. Adds tactility without distraction; matches Linear/Notion card hover.
- **Motion stays strictly on spec.** Only the three surfaces named in MICRO-01/02/03 receive transitions:
  - NavLink active-state: `transition-colors duration-150`
  - SourceFilter pill toggle: `transition-colors duration-150`
  - PersonCard photo: `motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.02]`
- **No motion beyond spec** (no button hover bg-tone, no page transitions, no scroll-reveals). Preserves academic restraint.
- **Default duration is `duration-150` with ease-out.** MICRO-03's `200ms` is a documented per-spec exception (the requirement itself names 200ms for the scale transform). No motion tokens defined in `@theme` — only 2-3 use sites, below the tokenization threshold.
- **Reduced motion handling:** Tailwind `motion-safe:` prefix on every transition site. When the user prefers reduced motion, transitions are simply absent. Accessibility-correct, no global `@media` block.

### Tap-target expansion strategy (BTN-01, BTN-03, BTN-04, BTN-05)

- **Expansion pattern: padding inside the button.** Visible chrome (e.g., 10 px dot, 14 px glyph) stays the spec'd visual size; the surrounding `<button>` carries enough padding to reach 44 × 44. Matches the BTN-01 example wording ("dots stay 10 px but sit inside a `p-3` tap area").
- **HeroCarousel dot spacing:** widen center-to-center spacing to ≥ 44 px so 44 × 44 hit areas tile cleanly without overlap. Visible dot gap grows from current value to ~24 px between dots. Standard pattern (Apple, BBC carousels). No overlapping clickable elements.
- **Pause/play button (BTN-03):** outer button is `w-10 h-10` flex-center, inner glyph stays 14 × 14 px. The 40 × 40 visible chrome is paired with a tiny extra padding to clear 44 × 44 effective hit area, OR documented as visible chrome 40 × 40 with the surrounding wrapper providing the remaining ≥ 2 px on each side — planner decides exact pixel maths against the carousel layout.
- **No shared `TapTarget` primitive, no `min-tap-44` utility.** Each component (HeroCarousel dots/controls, NavLink, LocaleToggle, SourceFilter) sets its own padding inline. Below the >2-places-then-tokenize threshold; values stay near the markup.
- **NavLink + LocaleToggle (BTN-05):** apply `py-1.5` so the combined hit area is 44 px tall, but the **visible header chrome stays its current height**. Phase 13's nav rhythm is preserved; only the hit zone grows. Hit area 44, visible row unchanged.

### Documentation shape (DOC-01, DOC-02, BTN-06)

- **MASTER.md update style:** section-by-section in-place edit. Update Type Scale, Component Specs, Layout, Spacing sections to v1.2 truth in their current locations. MASTER.md reads as current source-of-truth, not a history of versions.
- **OVERRIDES.md format:** table — `token / component | v1.0 | v1.2 | rationale`. Scannable, diff-friendly. Mirrors the STATE.md "Accumulated Decisions" table style already used in this project.
- **BTN-06 Component Specs entries:** each component (button, pill, dot, nav link, locale toggle, carousel pause/play) gets — exact Tailwind class string, visible size, hit area, focus-ring pattern. Copy-pasteable for new components. No screenshots, no rendered examples.
- **Plan structure: separate final-wave docs plan.** Code plans (BTN-01..05, MICRO-01..03/05) ship first; one final plan does DOC-01/02/BTN-06 against the finished code. Mirrors Phase 13's 13-04 docs plan, Phase 12's polish-and-docs shape.

### Verification & gating

- **MICRO-04 axe scan:** zero violations across all 8 Spanish pages — non-regression bar inherited from Phase 6.
- **Drift gate is enforced in CI** for `focus-visible:ring-accent-ring` (per Focus-ring section above).
- **Final visual sweep** at 375 / 1024 / 1440 px through the focus-tab journey covers MICRO-05.

### Claude's Discretion

- Exact pixel maths for HeroCarousel dot gap widening (must clear 44 px center-to-center; visual spacing within that is planner's call against the carousel layout).
- Exact `w-X h-X` outer chrome of pause/play button if `w-10 h-10` doesn't quite clear 44 — bump to `w-11 h-11` is acceptable, document the choice.
- CI grep gate location (pre-commit hook vs GitHub Actions step vs pnpm script) — pick whichever the project already uses for similar gates.
- Exact OVERRIDES.md filename / location if `design-system/cosmology-group-uba/OVERRIDES.md` doesn't yet exist.
- How to phrase the "v1.2 changes" rationale column in OVERRIDES.md — short reasons only, link to phase plans for depth.

</decisions>

<specifics>
## Specific Ideas

- **macOS-style focus ring** as the mental model: ring + offset reads cleanly on both light surfaces and image-backed surfaces. Halo, not fill.
- **Apple/BBC carousel dot spacing** as the reference for the dot-gap widening — visible breathing room between dot hit zones, no overlap warnings from accessibility testers.
- **Linear / Notion card hover** as the mental model for PersonCard zoom — barely-perceptible but present; 1.02 is the sweet spot, not 1.05.
- **STATE.md "Accumulated Decisions" table** as the format reference for OVERRIDES.md — same shape, same scan rhythm.
- **Phase 13-04 (MASTER.md docs plan)** as the structural reference for the Phase 15 final docs plan.

</specifics>

<deferred>
## Deferred Ideas

- Page-transition animations (cross-route fades, view-transition API) — out of scope; "stay strictly on spec" decision.
- Scroll-triggered reveals (e.g., publication list fade-in) — out of scope; potential future phase if motion vocabulary expands.
- Button hover background-tone transitions across the codebase (beyond the three named surfaces) — out of scope.
- Live `axe` DevTools scan against deployed Vercel build — already tracked as **FU-AXE-01** under PERF-04/05 production re-measurement (carry-forward, not Phase 15).
- Outreach card image-balance re-audit when first image lands — already tracked as **FU-OUTR-01** (editorial follow-up, not Phase 15).
- A `<TapTarget min={44}>` primitive or `min-tap-44` Tailwind utility — explicitly rejected per Pattern reuse decision; revisit only if a 4th independent control surface appears.
- Motion timing tokens (`--motion-fast/base/slow`) in `@theme` — explicitly rejected per Timing decision; revisit only if motion vocabulary grows beyond 2-3 use sites.
- A `--ring-offset` theme token — explicitly rejected per Offset color decision; revisit only if ring-offset usage spreads beyond focus styling.

</deferred>

---

*Phase: 15-interactive-polish-documentation*
*Context gathered: 2026-04-20*
