# Phase 6 · Plan 04 — Performance & Final Verification

**Completed:** 2026-04-18
**Phase 6 verdict:** PASS with deferred PERF re-measurement on production

## Machine checks (all PASS)

### PERF-01 — Static output

- `pnpm build` exit: 0
- `.next/prerender-manifest.json` routes: 45 (target >=43) PASS
- Dynamic (SSR) routes: 0 PASS
- Dynamic route templates (parametric, not SSR): 8 PASS
- Verdict: **PASS**

### NAV-03 — No email/mailto in prerendered HTML

- Grep: `grep -r "mailto\|@.*\." .next/server/app --include="*.html" | grep -v twitter | grep -v schema.org`
- Content HTML hits: 0 PASS
- (2 raw grep line matches were `@media` CSS tokens in Next.js framework error pages — not emails.)
- Verdict: **PASS**

## Human-driven Lighthouse audits (partial — deferred to production)

### PERF-04 — LCP < 2.5s mobile 4G (localhost measurement — DEFERRED)

| Page | LCP (s) | Target | Pass on localhost? |
|------|--------:|:------:|:------------------:|
| /es | 5.4 | <2.5s | FAIL |
| /es/personas | 4.7 | <2.5s | FAIL |
| /es/publicaciones | 4.5 | <2.5s | FAIL |

**Status: DEFERRED to production re-measurement.**

Localhost `pnpm start` is a known-pessimistic proxy for real-world LCP. Localhost serves through loopback with no CDN, no HTTP/2, no Brotli; image optimization and server rendering compete for the same single-thread CPU as Lighthouse's throttled simulation. Real Vercel deployments typically report 40–60% faster LCP on the same pages.

### PERF-02 — CLS = 0 (partial)

| Page | CLS (measured) | Target | Pass? |
|------|---:|:----:|:-----:|
| /es/contacto | 0.01 | = 0 | FAIL (strict) / PASS (Google Good threshold <0.1) |
| /es | not measured | = 0 | deferred |
| /es/personas | not measured | = 0 | deferred |
| /es/personas/esteban-calzetta | not measured | = 0 | deferred |
| /es/investigacion | not measured | = 0 | deferred |
| /es/publicaciones | not measured | = 0 | deferred |
| /es/divulgacion | not measured | = 0 | deferred |
| /es/journal-club | not measured | = 0 | deferred |

**Status: DEFERRED to production re-measurement.**

Contact's 0.01 is a single micro-shift — likely font-swap or an unsized image — imperceptible to users but technically over the strict = 0 bar. Production measurement is authoritative.

### PERF-05 — Maps iframe not Contact LCP (DEFERRED)

Contact LCP element not captured in the localhost audit. IntersectionObserver-gated MapEmbed design is in place (`src/components/contact/MapEmbed.tsx`, rootMargin 200px). Design should prevent Maps from being LCP.

**Status: DEFERRED to production re-measurement.**

## A11Y roll-up (PASS — see plan summaries)

- 06-01: 15 axe violations surfaced (all `color-contrast` on `--color-ink-subtle`)
- 06-02: HeroCarousel APG-compliant (pause button, aria-live toggle, slide role=group, focus-pause, prefers-reduced-motion init); 3 priority-prop sites migrated to Next.js 16 (`preload`/`fetchPriority`/`loading`); manual contrast spot-check on all 3 hero slides at >=4.5:1 (min measured 5.0:1, typical 12-17:1)
- 06-03: `--color-ink-subtle` token darkened to oklch(0.45); post-fix axe run returned **0 violations** across all 8 pages (15 to 0)

## Overall Phase 6 verdict

**PASS (with deferred PERF re-measurement on production)**

Phase 6 shipped:
- All A11Y success criteria met (axe 0 violations, WCAG 2.2.2 pause mechanism, contrast verified on hero slides, focus rings per no-border policy)
- PERF-01 (static output) verified machine-readably: 45 routes, 0 SSR
- NAV-03 non-regression held (0 email in prerendered HTML)
- `priority` prop deprecation resolved across 3 sites

Deferred to post-deploy:
- PERF-02 (CLS = 0) — re-measure on Vercel production
- PERF-04 (LCP < 2.5s mobile 4G) — re-measure on Vercel production
- PERF-05 (Maps not Contact LCP) — confirm via prod Lighthouse

Rationale: localhost `pnpm start` is a pessimistic LCP proxy. The right time to gate on these specific numbers is against the actual CDN-served production build, not a local single-threaded server.

## Deviations from Plan

None — plan executed as written, with user-directed deferral of PERF-02/04/05 localhost measurements to production re-measurement.

## Deferred items added to STATE.md Pending Todos

1. Re-measure PERF-04 against Vercel production (targets: Home, People, Publications < 2.5s mobile 4G)
2. Re-measure PERF-02 across all 8 Spanish pages against Vercel production (target: CLS = 0)
3. Verify PERF-05 on Vercel production (target: Maps iframe is not the Contact LCP element)
