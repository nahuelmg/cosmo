# Phase 3: Layout Shell - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Shared chrome every page wears: a header (brand mark + 7 nav links + language toggle), a footer (identity, UBA/FCEN/CONICET affiliations, contact email, social links), a "Skip to content" link, and an `<EmailLink>` component that renders obfuscated emails without exposing a raw `mailto:` literal to the HTML source. The shell wraps the page tree; it does not render page-level copy or content (that's Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Brand mark (header top-left)
- Use the UBA logo image provided by the maintainer at `public/logo_cosmo.*` (user will drop the asset).
- No text wordmark next to the logo unless planning discovers the logo alone reads too weak — in that case Claude may pair it with a compact serif wordmark.
- Logo links to the home route (`/es` or `/en` depending on locale).

### Header behavior
- **Sticky always** — header pinned to the top of the viewport at all times, across all routes and both locales.
- **Compact density** — header height 48–56px. Tight padding; whitespace hierarchy still enforced through typography scale, not through extra chrome.
- **Active route indicator** — Claude's discretion, but must honour the no-border / typography-hierarchy rules from 01-02 (use weight, colour, or box-shadow; never a plain 1px border).

### Language toggle
- **Single-button toggle pattern** — the button shows the *other* language; clicking swaps locale. On `/es` the button reads `EN`; on `/en` it reads `ES`.
- **Abbreviations only** (`ES` / `EN`) — language-agnostic, never needs translation.
- **Position:** far right of the header, visually distinct from the nav link row (subtle extra spacing or a faint divider — Claude's discretion).
- **URL behavior** (confirmed from spec NAV-02 / I18N-04): switching locale preserves the current pathname, query params, and hash. Filtered publications or deep `/people/[slug]` routes survive the switch.

### Mobile nav
- **Open pattern:** Claude's discretion — pick from slide-in drawer, fullscreen overlay, or dropdown. Match the Nature/academic restraint from 01-02.
- **Collapse breakpoint:** Claude's discretion — pick based on when the 7 nav links plus brand plus toggle start to crowd.
- **Menu layout:** vertical list with large tap targets **plus the ES/EN language toggle inline inside the menu** (pinned top or bottom — Claude's choice) so the toggle stays reachable without closing the menu.
- **Close behavior:** X button **AND** Escape key **AND** auto-close when a nav link is tapped (SPA-style). Must include a focus trap while open and return focus to the trigger when closed.

### Footer
- **Column layout:** Claude's discretion — pick two-column, three-column, or single-row based on what reads cleanest at the chosen max width.
- **Affiliations:** text only — e.g. "Universidad de Buenos Aires · FCEN · CONICET". No logo images (no official assets committed).
- **Contact section:** email only, rendered through the `<EmailLink>` component (no raw `mailto:` string in the HTML source per NAV-03). Postal address stays on the Contact page — do not duplicate.
- **Social links:** Claude's discretion on icon-only vs icon+text vs text-only. Whatever reads as academic restraint; icons monotone if used; every link must have an accessible label.

### Claude's Discretion
- Active route indicator styling (weight / accent / shadow — no borders)
- Exact header padding, divider treatment, and logo sizing against the 48–56px height cap
- Mobile nav open pattern (drawer / overlay / dropdown) and its breakpoint
- Footer column split and ordering of affiliations vs contact vs social
- Social link presentation (icon / text / hybrid)
- Skip-to-content link styling — position on focus, label wording in both locales, focus-ring treatment

</decisions>

<specifics>
## Specific Ideas

- Logo asset will land at `public/logo_cosmo.*` — reference it there; do not hard-code dimensions until the asset exists, use Next `<Image>` with intrinsic sizing.
- Keep the header restrained: sticky-always plus compact means every spare pixel goes to reading content, so resist any impulse to add secondary chrome (search box, breadcrumb strip, dark-mode toggle, etc.) — those are out of scope.
- The language toggle must survive the deep routes that appear in later phases (filtered `/es/publications?year=2025`, `/es/people/[slug]`). Use `next-intl`'s locale-aware `<Link>` / routing helpers already wired up in Phase 1 (01-03) so path + query + hash are preserved automatically rather than re-derived per-page.
- `<EmailLink>` must not emit a literal `mailto:` in the rendered HTML source — even the JSX string literal should be obfuscated (e.g. assembled at render, or split across attributes decoded client-side). Verification: `view-source` on any page containing it must show zero occurrences of `mailto:`.

</specifics>

<deferred>
## Deferred Ideas

- Dark-mode toggle — own phase if ever scoped.
- Breadcrumbs on interior routes — own phase.
- In-header search — own phase; not in roadmap.
- Theme / accent-colour switcher — own phase.
- UBA / FCEN / CONICET logos in the footer — can be added later once official assets are provided; text-only is the v1 baseline.

</deferred>

---

*Phase: 03-layout-shell*
*Context gathered: 2026-04-17*
