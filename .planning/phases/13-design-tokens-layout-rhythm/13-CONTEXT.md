# Phase 13: Design Tokens & Layout Rhythm - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the foundational typography tokens, container widths, and vertical rhythm that every other v1.2 polish phase depends on. Scope: `--text-4xl` / `--text-5xl` token values, page-container width rules, vertical-rhythm cadence, line-height convergence, and the MASTER.md documentation that records them. Downstream phases (14 Media Sizing, 15 Interactive Polish) snap to the tokens this phase produces.

Requirements in scope: TYPO-01..05, SPACE-01..04.

</domain>

<decisions>
## Implementation Decisions

### Type Scale Coverage
- **Minimum-viable scope** — only `--text-4xl` (36 px) and `--text-5xl` (40 px) get explicit token values this phase. `text-3xl` and below stay at current/Tailwind-default values.
- Net-new token: `--text-5xl` = 40 px / 2.5 rem (was falling through to Tailwind default 48 px).
- Revised token: `--text-4xl` = 36 px (was 32 px) — gives H1 ≥ 1.20× H2 hierarchy.

### H1 Size Split
- **Hero H1** uses `text-5xl` (40 px) — HomePage only.
- **All other page H1s** use `text-4xl` (36 px).
- Page H1s scale responsively: `text-3xl md:text-4xl` (30 px mobile → 36 px md+) so 375 px screens don't wrap awkwardly.
- Hero keeps the existing `text-4xl md:text-5xl` responsive step.

### Navigation Sizing
- Nav aligns to **`text-sm` (14 px)** across all breakpoints. Drop the current `text-base lg:text-lg` jump.
- Rationale: academic/editorial sites subordinate nav to headlines; 14 px feels correct next to 36–40 px H1s.
- Apply to `NavLink` and `LocaleToggle` so the header reads as a single interactive row.

### Card Padding (SPACE-03 resolution)
- **Two-tier system:** dense `p-4` / spacious `p-6`.
- **Dense tier (`p-4`):** grid-style cards like `PersonCard`, list rows like `SessionRow`.
- **Spacious tier (`p-6`):** feature cards like `ResearchCard`, `OutreachCard`. Existing `p-8` comes down to `p-6`.
- **Flat across breakpoints** — no responsive step; `p-4` stays `p-4` at every screen size.
- Encoded as plain Tailwind classes on components; convention documented in MASTER.md. No custom CSS variables or named utility classes.

### Page Container Widths (SPACE-01)
- Prose / single-column pages → `max-w-5xl` (Contact, PersonDetail, Journal Club).
- Grid pages → `max-w-6xl` (People, Outreach, Research, Publications).
- **HomePage** → single `max-w-6xl` outer wrapper. Prose sections inside use inner `max-w-3xl` (~768 px, classic reading measure).
- **Hero stays inside** the `max-w-6xl` wrapper (no full-bleed). Preserves the consistent left edge down the page; matches the restrained academic feel.

### Vertical Rhythm (SPACE-02)
- Section `py-12`, page wrapper `py-16`, hero `py-20` — lifted verbatim from SPACE-02.
- Applied consistently across all 8 page wrappers.

### Line-Height
- **Two-tier convention:**
  - Display (text-3xl and larger) → `leading-tight` (1.2)
  - Body (text-xl and below) → `leading-relaxed` (1.625)
- **Body copy convergence** — all prose blocks converge on `leading-relaxed` (1.625). Kill mixed `leading-normal` / default usage.
- **Encoded via `@layer base`** — h1-h6 default to `leading-tight`, body inherits `leading-relaxed`. Components override only when meaningfully different.

### Letter-Spacing
- **Leave as-is.** Existing `-0.01em` on headings via `@layer base` stays. Body stays at 0. No per-size tracking map this phase.

### Codification Style
- **Tailwind classes + MASTER.md documentation** is the default encoding strategy (card padding, container widths).
- **@layer base** for cross-cutting defaults (line-heights, letter-spacing, heading weights).
- **No custom CSS variables or named utility wrappers** introduced in this phase unless explicitly required by a token (e.g., `--text-5xl`).

### Claude's Discretion
- Exact responsive breakpoint selection on page H1s (`md:` vs `lg:`) where `md:text-4xl` doesn't quite read right.
- Which HomePage sections count as "prose" vs "grid" when placing the inner `max-w-3xl` wrapper.
- Where `leading-tight` vs `leading-snug` (1.375) reads better on specific heading use cases.
- Exact migration path for components currently using `leading-normal` — case-by-case.
- MASTER.md table structure and ordering.

</decisions>

<specifics>
## Specific Ideas

- Hero H1 should still feel like the page's anchor — 40 px / `text-5xl` with existing weight/tracking is the target.
- Page H1s at 36 px need to sit visibly above H2 (30 px) — 1.20× ratio is the hierarchy test.
- Nav at 14 px matches the quieter, more subordinate feel of an academic institution site; shouldn't compete with content.
- Card tiers map to semantic density: "read a lot of these at once" (dense) vs "feature this one" (spacious).
- HomePage hero inside the wrapper — matches the restrained warm-academic tone; no editorial flash.
- Body leading at 1.625 is the warm-academic reading-measure baseline; keep it everywhere prose lives.

</specifics>

<deferred>
## Deferred Ideas

- **Full type-scale audit** (text-3xl, text-2xl, text-xl, text-lg, text-sm, text-xs) — out of scope; minimum-viable for v1.2.
- **Per-size letter-spacing map** (5xl=-0.02, 4xl=-0.015, 3xl=-0.01) — possible future refinement.
- **Named utility wrappers** (.card-dense / .card-spacious / .page-prose / .page-grid) — explicitly declined this phase; revisit if components proliferate.
- **CSS variables for card padding / container widths** — declined in favour of direct Tailwind classes + docs.
- **Hero full-bleed variant** — declined; preserves consistent wrapper edge.

</deferred>

---

*Phase: 13-design-tokens-layout-rhythm*
*Context gathered: 2026-04-19*
