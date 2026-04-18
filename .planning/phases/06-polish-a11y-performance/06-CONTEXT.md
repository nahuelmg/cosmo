# Phase 6: Polish (A11y & Performance) - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit the 43 prerendered pages (both locales) against WCAG AA + Core Web Vitals and apply surgical remediations. Verify SSG is preserved end-to-end.

This phase is verification + targeted fixes — not new features. Findings that require new capabilities (e.g., a different carousel pattern, a CMS for photo moderation) are out of scope and deferred.

</domain>

<decisions>
## Implementation Decisions

### Carousel accessibility reconciliation

The Phase 4 decision "no pause button on hero carousel" (2026-04-18 human-verify) is **reversed** in Phase 6 to satisfy A11Y-04 + WCAG 2.2.2 (Pause, Stop, Hide — Level A).

- **Visible pause button restored.** Small pause/play glyph positioned over the carousel (placement: planner's call — default to bottom-right corner over the image, above the dots). Keyboard-focusable, Tab-reachable.
- **Screen-reader announcements: `aria-live="polite"` on the slide container.** New slide's aria-label / caption is announced when the slide changes (timer-driven or user-driven). Accept mild SR verbosity as the tradeoff for auto-advance content.
- **No prev/next arrow buttons.** Dots + pause button are the only visible controls. Keeps the hero uncluttered.
- **Focus rings: box-shadow per 01-02 design system.** `focus:ring-2 focus:ring-accent-ring` — same style as SkipLink, nav, and all other focus indicators. No outline-style border on photo controls.

### Polish bar — strict

- **Every axe violation gets fixed** before phase ships. No severity filter; no documented-and-shipped violations.
- **Every PERF-0X target must be hit.** LCP < 2.5s mobile on Home / People / Publications, CLS 0 on every page, Maps embed contributes 0 to Contact LCP.
- **Phase 3/4 component edits are fair game** when a finding requires them. A11y is cross-cutting — if SiteHeader, PersonCard, or HeroCarousel needs a fix, edit it here. Commit under `(06-XX)` scope.
- **Deferred items land in STATE.md "Pending Todos"** (not a new POLISH-BACKLOG.md, not GitHub issues). With a strict-fix bar the deferred list should be small or empty by phase end.

### Hero overlay contrast strategy

- **Uniform dark gradient scrim (bottom → top).** Behind the overlay text on every slide. Intended to pass 4.5:1 on any photo, including future real-photo replacements — tune to worst-case brightness.
- **Overlay text: pure white, no shadow.** Scrim alone carries the contrast. Keeps typography crisp.
- **Scrim is future-proof:** strong enough that the content editor can swap placeholder photos for real group photos without re-tuning CSS. No photo-selection checklist, no build-time luminance validator.
- **Contrast verification:** primary signal is axe-core (and pa11y if planner adds it). **Caveat logged during discussion:** axe-core cannot reliably probe text-on-photo contrast (it reads CSS bg-color, not sampled pixels). If axe passes but a slide looks questionable, planner should add a manual DevTools contrast spot-check to the plan.

### Audit workflow

- **Run locally against `pnpm build && pnpm start`.** Not Vercel preview. Production bundle served on `http://localhost:3000`. Fastest iteration.
- **Automated a11y:** axe-core CLI (npx @axe-core/cli or similar). Required for A11Y-01.
- **Performance:** Chrome DevTools Lighthouse panel, **manual** runs per page. Mobile throttled 4G preset matches PERF-02 wording. No Lighthouse CLI dependency, no CI gating.
- **Coverage: 8 pages, Spanish only.** 7 static routes (home / people / research / publications / contact / outreach / journal-club) + 1 person detail slug (planner's pick — a Principal Investigator slug with real bio content is ideal). English locale is **not** audited in Phase 6; Phase 5 verifier already confirmed `html lang` + hreflang + OG locale for English across the site.
- **Artifacts:** audit results live in each plan's SUMMARY.md (scores table, before/after, violations fixed). No committed report files, no raw JSON dumps. Keeps .planning/ lean.

### Claude's Discretion

- Pause-button icon choice (Lucide `Pause`/`Play` vs inline SVG — consistent with 04-01's inline SVG precedent; planner can decide)
- Pause-button label text (`Pausar carrusel` / `Pause carousel` via translations, or sr-only only)
- aria-live announcement text content (slide caption, slide number, or full overlay text)
- Exact scrim opacity values and gradient stops
- Specific person slug chosen for the Spanish a11y audit
- Order of plans within Phase 6 (audit-first-then-fix vs category-by-category)
- Which axe-core wrapper or runner to install (@axe-core/cli, playwright+axe, jest-axe — choose whatever fits the one-off verification workflow)

</decisions>

<specifics>
## Specific Ideas

- Reconciliation tension is the load-bearing decision of this phase: Phase 4's "no pause button" aesthetic call (from 2026-04-18 human-verify) is being reversed for WCAG Level A compliance. The restored button is a polish-phase addition, not a reversal of the aesthetic rationale — it's the minimum viable control required to ship.
- "Strong enough scrim for any photo" is the contract with the future content editor: swap photos without touching CSS, text stays readable.
- Audit cadence is one-shot for Phase 6. Not setting up ongoing CI — the site is a low-change institutional site; the audit fires again when major visual work happens.
- Every non-gating but reasonable polish idea (keyboard shortcuts, screen-reader text tuning, motion-preference nuances beyond the existing `prefers-reduced-motion` check, etc.) is Claude's Discretion within the strict-fix bar.

</specifics>

<deferred>
## Deferred Ideas

- **POLISH-BACKLOG.md file / GitHub issues for a11y triage** — explicitly rejected in favor of STATE.md Pending Todos. Revisit if the list grows large.
- **Lighthouse CLI / @lhci/cli** — manual DevTools Lighthouse is sufficient for Phase 6. Add later if ongoing CI perf gating becomes a need.
- **WebPageTest / PageSpeed Insights against production URL** — post-launch validation, not Phase 6 gating.
- **Prev/Next arrow buttons on the carousel** — dots + pause deliberate minimal-control choice. Revisit only if usability testing surfaces a gap.
- **Hover-reveal pause button (fade-in on hover/focus)** — rejected in favor of always-visible button. Revisit only if the visible button proves aesthetically disruptive.
- **Prebuild luminance validator for hero photos** — rejected as over-engineering for 3 photos. Revisit only if photo rotation becomes a frequent content-editor workflow.
- **Full 43-page audit, both locales** — rejected in favor of representative 8-page Spanish sample. Revisit if axe surfaces locale-specific anomalies that the sample doesn't catch.
- **Manual VoiceOver / NVDA screen-reader pass** — rejected from the required tool list (only axe + DevTools Lighthouse are required). Claude / content editor can run this opportunistically but it's not gating.

</deferred>

---

*Phase: 06-polish-a11y-performance*
*Context gathered: 2026-04-18*
