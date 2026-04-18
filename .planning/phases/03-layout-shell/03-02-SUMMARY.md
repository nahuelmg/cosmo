---
phase: 03-layout-shell
plan: 02
subsystem: layout-shell
tags: [nextjs, dynamic-import, client-component, obfuscation, accessibility]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js 16 app router + TypeScript strict mode
provides:
  - "EmailLink public component (src/components/ui/EmailLink.tsx) ready for import by the footer in Plan 05"
  - "EmailLinkInner client component assembling the URI scheme at render time via array-join"
  - "Zero literal message-scheme token in prerendered HTML source — Phase 3 Success Criterion 3 building block"
affects: [03-05, 04-contact, footer, contact-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/dynamic with ssr:false as the obfuscation escape hatch (message-scheme URI only exists after hydration)"
    - "Two-file split: public server wrapper (EmailLink.tsx) + private client inner (EmailLinkInner.tsx) — keeps the 'use client' boundary narrow"
    - "String-concat via ['mai','lto'].join('') — token never appears contiguously in source or compiled bundle"

key-files:
  created:
    - "src/components/ui/EmailLinkInner.tsx"
    - "src/components/ui/EmailLink.tsx"
  modified: []

key-decisions:
  - "Omit loading-state fallback: flash-of-nothing accepted over adding a second render path; simplicity + zero-leak wins"
  - "Public API keeps user and domain as separate props; the footer splits siteConfig.contactEmail on '@' at the call site"

patterns-established:
  - "Obfuscation-by-ssr-false: any feature whose raw source must not appear in view-source should follow this two-file split"
  - "Client inner + server wrapper: private 'use client' inner is imported only via dynamic(), never directly"

# Metrics
duration: ~2 min
completed: 2026-04-17
---

# Phase 3 Plan 02: EmailLink Component Summary

**Two-file obfuscated contact-link component: server wrapper dynamically imports a client-only anchor with ssr:false, guaranteeing zero message-scheme literal in prerendered HTML.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-18T01:50:52Z
- **Completed:** 2026-04-18T01:52:25Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- `EmailLinkInner` — `'use client'` anchor component with props `{user, domain, children?, className?}`; assembles the URI scheme via `['mai','lto'].join(':')`-style concatenation so the literal five-character token never appears in source.
- `EmailLink` — server-boundary wrapper that re-exports `EmailLinkInner` through `next/dynamic(..., {ssr: false})`; the Next.js build never prerenders the anchor, so `curl`/`view-source` cannot see a raw message-scheme string.
- Type surface: `EmailLinkProps = EmailLinkInnerProps` re-exported so consumers (Plan 05 Footer, Phase 4 Contact page) can import a single public type.
- `pnpm typecheck` + `pnpm build` both green; static export of `/es` and `/en` succeeds.

## Task Commits

1. **Task 1: Client-only EmailLinkInner component** — `cf59525` (feat)
2. **Task 2: dynamic(ssr:false) EmailLink wrapper** — `66789ff` (feat)

**Plan metadata:** pending (docs commit)

## Files Created/Modified

- `src/components/ui/EmailLinkInner.tsx` (created) — `'use client'` component; exports `EmailLinkInner` and `EmailLinkInnerProps`. Builds `href` as `` `${['mai','lto'].join('')}:${user}@${domain}` ``. Pure; no hooks.
- `src/components/ui/EmailLink.tsx` (created) — server boundary; exports `EmailLink` and `EmailLinkProps`. Wraps `EmailLinkInner` via `dynamic(() => import('./EmailLinkInner').then((m) => m.EmailLinkInner), {ssr: false})`.

## Public API (for Plan 05's executor)

```tsx
// Import from the wrapper only; never import EmailLinkInner directly.
import {EmailLink, type EmailLinkProps} from '@/components/ui/EmailLink';

// Required props:
//   user:   string   (local part, e.g. "cosmologia")
//   domain: string   (domain part, e.g. "df.uba.ar")
// Optional props:
//   children:  ReactNode  (custom label; defaults to `${user}@${domain}`)
//   className: string     (pass-through to the <a>)

// Typical footer usage (Plan 05):
const [user, domain] = siteConfig.contactEmail.split('@');
<EmailLink user={user} domain={domain} className="text-fg-muted hover:text-fg" />
```

## The ssr:false Guarantee

The public `EmailLink` wrapper imports its inner component through `next/dynamic` with `{ssr: false}`. Next.js therefore:

1. **Does NOT** render the inner anchor during build-time static generation.
2. **Does NOT** render it during server response for dynamic requests.
3. **Only** mounts the inner anchor after React hydrates on the client, at which point the URI is assembled in-browser via array-join.

Consequence: `curl -s http://host/es | grep mailto:` returns 0 occurrences. The footer in Plan 05 will use this guarantee to satisfy Phase 3 Success Criterion 3 (NAV-03). End-to-end verification belongs in Plan 05 because the component needs to be actually rendered on a page.

A small trade-off: there is a brief "flash of nothing" where the anchor hasn't hydrated yet. For the site's one visible email (footer + contact page), this is acceptable — the component is tiny and the flash is milliseconds. A plaintext-during-loading fallback can be layered on later without changing the public API.

## Decisions Made

- **Omit loading state.** The `loading` option of `next/dynamic` is a zero-arg component; it cannot receive `user`/`domain`, so a prop-aware plaintext fallback requires a second component path. We accepted the flash-of-nothing window rather than duplicate the UI contract. Revisit if A11y testing in Phase 6 flags it.
- **Keep `user`/`domain` as separate props.** Consumers split `siteConfig.contactEmail` on `@` at the call site. This keeps the component generic and avoids re-parsing an already-canonical string inside it.
- **No `rel`/`target`/`aria-label`.** A plain anchor with a visible email address is the most accessible form; screen readers announce the link with the address text, which matches what sighted users see.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Doc comment referenced `ssr: false` verbatim, breaking Task 2's `grep -c` exactness**
- **Found during:** Task 2 verification
- **Issue:** A JSDoc block on `EmailLink` mentioned the flag in prose, so `grep -c 'ssr: false' EmailLink.tsx` returned 2 instead of the expected 1.
- **Fix:** Rephrased the comment to "server rendering disabled" so the only `ssr: false` occurrence is the actual option in `dynamic(..., {ssr: false})`.
- **Files modified:** `src/components/ui/EmailLink.tsx`
- **Verification:** `grep -c 'ssr: false'` now returns 1; `pnpm typecheck` and `pnpm build` still green.
- **Committed in:** `66789ff` (Task 2 commit — fix applied before commit)

---

**Total deviations:** 1 auto-fixed (1 blocking-on-verification)
**Impact on plan:** Cosmetic; the flag still controls the dynamic import exactly as specified. No behavior change.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `EmailLink` and `EmailLinkProps` are ready to import from `src/components/ui/EmailLink.tsx` in Plan 05 (Footer) and Phase 4 (Contact page).
- Full end-to-end verification (`curl | grep mailto:` returns 0) is deferred to Plan 05 because it requires an actual page rendering the component.
- No blockers for Plan 05 or its wave-siblings (03-01, 03-03 also operate on disjoint `src/components/ui/*` files).

---
*Phase: 03-layout-shell*
*Completed: 2026-04-17*
