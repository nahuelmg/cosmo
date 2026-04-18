---
phase: 04-core-pages
plan: 08
subsystem: ui
tags: [next-intl, react, server-component, email-obfuscation, google-maps, intersection-observer, bilingual]

requires:
  - phase: 04-01
    provides: MapEmbed client component (IntersectionObserver lazy iframe + crawlable fallback anchor)
  - phase: 03-02
    provides: EmailLink component (zero mailto: in prerendered HTML, NAV-03 guarantee)
  - phase: 02-01
    provides: siteConfig with address (BilingualString), office (BilingualString), mapQuery, contactEmail, socialLinks

provides:
  - Contact page RSC at src/app/[locale]/contact/page.tsx (serves /es/contacto + /en/contact)
  - ContactDetails server component (dl-semantic block: address, office, obfuscated email, social links)
  - CONT-01..05 + I18N-02 satisfied

affects:
  - 05-seo (ContactPoint JSON-LD, canonical URLs for /es/contacto + /en/contact)
  - 06-polish (a11y audit of dl/dt/dd structure, focus rings on social links)

tech-stack:
  added: []
  patterns:
    - Props-down server composition — page RSC resolves all data, passes strings as typed props to leaf components
    - MapEmbed default-import pattern — MapEmbed uses default export; page imports as `import MapEmbed from`
    - readonly cast for as-const empty arrays — siteConfig.socialLinks typed as never[] by TypeScript when empty + as const; cast to readonly SocialLink[] on call site

key-files:
  created:
    - src/app/[locale]/contact/page.tsx
    - src/components/contact/ContactDetails.tsx
  modified: []

key-decisions:
  - "MapEmbed uses default export (not named); page import adjusted from plan's { MapEmbed } to default import"
  - "siteConfig.socialLinks cast to readonly SocialLink[] on call site — as const + satisfies SocialLink[] on empty array infers never[] element type"
  - "dl aria-label substitutes for heading landmark inside ContactDetails — page H1 is above; no redundant section wrapper needed"

patterns-established:
  - "Server component <dl> with sm:grid-cols-[140px_1fr] for label/value contact layout"
  - "fallbackHref constructed server-side via encodeURIComponent(mapQuery) — crawlable without JS"

duration: 8min
completed: 2026-04-18
---

# Phase 4 Plan 8: Contact Page Summary

**Bilingual Contact page with dl-semantic address/office/email block, EmailLink obfuscation (zero mailto: in HTML), empty-socialLinks noSocial fallback, and IntersectionObserver-lazy Google Maps iframe below the fold**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T14:53:50Z
- **Completed:** 2026-04-18T15:01:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- ContactDetails server component: `<dl>` 2-column grid, address + office + obfuscated email via EmailLink + social links (noSocial fallback for empty array)
- Contact page RSC: localizes address/office via `localize()`, passes canonical strings to ContactDetails, mounts MapEmbed below the fold
- All CONT-01..05 assertions confirmed via curl on dev server; `<iframe` count in prerendered HTML = 0; `mailto:` count = 0; `google.com/maps` fallback anchor present
- Both locales SSG-prerendered by `pnpm build` (43 total static pages, no errors)

## Task Commits

1. **Task 1: Build ContactDetails server component** - `2cc572b` (feat)
2. **Task 2: Build Contact page with details and lazy map** - `c28c011` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/contact/ContactDetails.tsx` - dl-semantic server component: address, office, EmailLink, social links with noSocial fallback
- `src/app/[locale]/contact/page.tsx` - Contact page RSC, composes ContactDetails + MapEmbed, returns `<section>` (no `<main>`)

## Decisions Made

- **MapEmbed import style:** MapEmbed exports a default (not named export). Plan template showed `{ MapEmbed }` named import — adjusted to `import MapEmbed from '@/components/contact/MapEmbed'` to match actual export.
- **`siteConfig.socialLinks` type cast:** `[] satisfies SocialLink[] as const` causes TypeScript to infer element type as `never`. Cast to `readonly { platform: string; url: string; label: string }[]` at call site — no runtime cost, avoids changing site.ts.
- **`dl aria-label` instead of wrapping section:** Plan noted the semantic issue with dt/dd outside dl; used `<dl aria-label={labels.addressLabel}>` directly with no outer section wrapper, consistent with plan's corrected form.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MapEmbed default-export vs named-import mismatch**
- **Found during:** Task 2 (contact page implementation)
- **Issue:** Plan template used `import { MapEmbed } from '@/components/contact/MapEmbed'` but MapEmbed.tsx only has `export default function MapEmbed`. Named import would silently resolve to `undefined`.
- **Fix:** Changed to `import MapEmbed from '@/components/contact/MapEmbed'` (default import).
- **Files modified:** src/app/[locale]/contact/page.tsx
- **Verification:** TypeScript clean; page renders correctly in dev and build.
- **Committed in:** c28c011 (Task 2 commit)

**2. [Rule 1 - Bug] `siteConfig.socialLinks` inferred as `never[]` under `as const`**
- **Found during:** Task 2 TypeScript check
- **Issue:** `pnpm tsc --noEmit` reported `Property 'platform' does not exist on type 'never'` — empty array + `satisfies SocialLink[]` + `as const` causes TypeScript to narrow element type to `never`.
- **Fix:** Cast `siteConfig.socialLinks` to `readonly { platform: string; url: string; label: string }[]` before `.map()`.
- **Files modified:** src/app/[locale]/contact/page.tsx
- **Verification:** TypeScript clean on second check; build succeeds.
- **Committed in:** c28c011 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both were import/type correctness issues, not scope changes. Zero semantic drift from plan intent.

## Issues Encountered

None beyond the two auto-fixed TypeScript/import bugs above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 4 pages complete (04-01..04-08); Phase 4 is done.
- Phase 5 (SEO & Discoverability): ContactPoint JSON-LD can reference `siteConfig.contactEmail`, `siteConfig.address`, and `/es/contacto` + `/en/contact` canonical URLs.
- Phase 6 (Polish/A11y): `<dl>` structure on ContactDetails is a candidate for a11y audit; social link focus rings already use `focus-visible:ring-2 focus-visible:ring-accent-ring` consistent with shell conventions.
- Pending from earlier phases: publications_selected ID alignment, mobile drawer verification, press-feedback tuning — carry forward to Phase 5/6.

---
*Phase: 04-core-pages*
*Completed: 2026-04-18*
