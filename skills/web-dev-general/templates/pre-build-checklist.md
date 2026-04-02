# Pre-Build Checklist

> Run this BEFORE writing any code on a new project.
> Each section is a gate — don't proceed past it until all boxes are checked.
> Time investment: ~30–60 minutes. Saves 4–8 hours of rework.

---

## Phase 1: Planning & Scope

**The goal: know what you're building and what success looks like before touching a file.**

```
[ ] Define the ONE core user action (not 5 features — the single most important thing)
    — "User can browse products" not "Users can browse, filter, compare, and wishlist products"

[ ] Define what is explicitly OUT of scope for v1
    — Write it down. Prevents scope creep when building.

[ ] Identify all user-facing states for every panel:
    [ ] Loading state (what does the skeleton look like?)
    [ ] Error state (what does the retry UI look like?)
    [ ] Empty state (first-time user, no data yet — what do they see?)
    [ ] Populated state (the normal case)
    — Designing these upfront prevents "blank screen" discoveries during testing.

[ ] For every form in the UI, define default values explicitly
    — Date fields: default to today? Empty? Most recent? Decide now.
    — Empty defaults cause UX friction that gets filed as bugs later.

[ ] For every dynamic content section in a header/nav, decide how controls are anchored
    — If content appears/disappears on the left, right-anchor the controls (ml-auto)
    — Controls that shift when data loads feel broken.
```

---

## Phase 2: Technology Stack Validation

**The goal: ensure your chosen stack actually works together in your environment.**

```
[ ] Check Node version compatibility with ALL core dependencies:
    Node version: ___
    Framework (Next.js, Nuxt, etc.): ___ — min Node: ___
    Vite: ___ — NOTE: Vite 5.4+ requires Node 20+. Pin to 5.3.6 on Node 18 via npm overrides.
    vitest: ___ — NOTE: vitest 4.x requires Node 20+. Pin to 1.6.0 on Node 18.
    [ ] If Node 18: add @tailwindcss/oxide-linux-x64-gnu as explicit dependency (Linux)

[ ] Verify what the component library ACTUALLY installs before using it:
    — shadcn@latest now installs Base UI (base-nova) by default, not Radix UI.
      The APIs are different (Combobox, Dialog, Select all differ).
    — Run the install in a throwaway project and check what landed.

[ ] For Tailwind v4 specifically:
    [ ] Add @custom-variant dark (&:is(.dark *)) to globals.css
        — Without this, dark: utilities do NOTHING when toggling .dark class.
    [ ] Keyframes go in @theme {} block (generates Tailwind utilities)
        — CSS variable mappings go in @theme inline {} block
        — Mixing these up means custom animations won't work.
    [ ] Disable PostCSS in vitest config (string-form plugin conflicts):
        css: { postcss: { plugins: [] } } in vitest.config.mts

[ ] For dark-first UIs:
    [ ] ThemeProvider: enableSystem={false}, defaultTheme="dark"
        — Without this, OS light mode preference overrides your default.
    [ ] Every native <select> and date input: add [color-scheme:dark]
        — text-white inherits to <option> elements; browser renders native
          dropdown with light background → white text invisible.
    [ ] Never put overflow-hidden on popup/dropdown containers that have scrollable children
        — It clips the list to one item height. The inner list should own overflow-y-auto.
```

---

## Phase 3: External API Validation

**The goal: verify your API actually works from your target environment before building around it.**

Do this BEFORE designing the DataProvider interface or any BFF routes.

```
[ ] Test API reachability from target deployment:
    — Deploy a minimal 10-line BFF route to Vercel and call the API from it.
    — OR: check the API's documentation for known IP blocklists.
    — Some APIs (financial, payment, social) block requests from cloud provider IPs (AWS/Vercel/Netlify). Check the API's documentation or test with a deployed function.
    — If blocked: find an alternative API NOW, not after building the data layer.

[ ] Fetch the actual endpoint and inspect the JSON response:
    curl -s "https://api.example.com/endpoint?params" | jq .

    For EVERY field your UI needs, verify it exists in the response:
    [ ] Expected field 1: _____ — present? Y/N
    [ ] Expected field 2: _____ — present? Y/N
    [ ] Expected field 3: _____ — present? Y/N

    — Don't design a type assuming a field exists. Check first.

[ ] Verify free tier granularity covers your UI design:
    — Some APIs return different data granularity or format depending on the query parameters or tier.
      Verify the free tier supports what your UI needs.
    — If you need consistent granularity, you may need a paid tier or different API.

[ ] Calculate rate limit budget:
    Rate limit: ___ calls/min

    Calls per page load: ___
    Calls per user interaction (range change, etc.): ___
    Calls per polling interval (background, per open panel): ___
    Total worst-case per minute with N concurrent users: ___

    — If total > rate limit: reduce parallelism, add caching, or get a paid key.
    — Adding parallel fetches halves your per-endpoint budget. Calculate total request volume before implementing.

[ ] Document where auth keys live:
    [ ] No key needed (public API)
    [ ] Key is server-side only (env var, BFF route only — SAFE)
    [ ] Key is client-side (NEXT_PUBLIC_ prefix) — reconsider. Public = leaked.
```

### Form Submission Service (if using Formspree / Resend / EmailJS / etc.)

If the project has a contact or lead form, do this during the build phase (not at deployment):

```
[ ] Create the form service account (Formspree, Resend, etc.) now — not during deployment
[ ] Add the endpoint URL to .env.local during Phase 1 scaffolding
[ ] Test a real form submission during the phase that builds the form:
    — Fill the form in the browser → check your inbox → confirm email received
    — If this fails, you want to know NOW, not after launch
[ ] The form is the primary conversion mechanism — never ship untested
```

---

## Phase 4: Architecture Decisions

**The goal: make the decisions that affect every file before writing any file.**

```
[ ] Define the DataProvider interface methods — ONLY what has a concrete caller right now:
    — Don't add speculative methods
    — Every method added without a caller is dead code from day one.

[ ] Define shared types in types/index.ts — ONLY types used by 2+ consumers:
    — Don't define types upfront for components that don't exist yet.
    — Components will define inline types; extract to shared only when there's actual reuse.
    — Pay attention to naming consistency across types. Pick one convention and document it.

[ ] Decide state management per feature:
    Feature: _______
    URL state / Zustand persist / Zustand ephemeral / useState / Server state?
    Reason: _______

    — URL state: shareable, bookmarkable (current asset, date range, etc.)
    — Zustand persist: survives refresh (portfolio transactions, user preferences)
    — Zustand ephemeral: cross-component coordination that resets on reload (comparison selections)
    — useState: form fields, open/close, local-only UI state

[ ] For components using canvas/imperative libraries (charts, maps, editors), plan for:
    [ ] What happens when data changes? (imperative updates may fire events synchronously)
    [ ] Do you need the prevDataRef pattern to prevent infinite render loops?
    [ ] When switching visualization types, will you update refs BEFORE calling imperative setters?
```

---

## Phase 5: Scaffolding Verification

**The goal: confirm the skeleton works before building anything on top of it.**

```
[ ] Dev server starts: npm run dev → page loads ✓
[ ] TypeScript compiles: npx tsc --noEmit → 0 errors ✓
[ ] Tests run: npm test → passes (or 0 tests is OK at this stage) ✓
[ ] Dark mode toggle works (not just a CSS class — actually verify dark: utilities apply)
[ ] Theme persists across refresh (localStorage) ✓
[ ] URL state round-trips (change param, refresh, same state restored) ✓
[ ] BFF route returns data: curl /api/test → expected JSON ✓
[ ] Live API endpoint reachable from the BFF route (deployed to Vercel, not just local) ✓
```

---

## Phase 6: Implementation Guardrails

**The goal: prevent the categories of mistakes that created the most rework.**

```
For every component that renders dynamic data:
[ ] Loading state: skeleton matches final layout dimensions (no layout shift)
[ ] Error state: retry button, human-readable message
[ ] Empty state: helpful CTA, not a broken or blank UI

For every form:
[ ] All default values explicitly set (not empty string unless intentional)
[ ] Date fields default to today unless there's a design reason otherwise
[ ] Native browser controls (select, date input) tested in dark mode

For every panel/section with controls (range selectors, toggles, etc.):
[ ] Controls are right-anchored if left content is dynamic
[ ] Verified controls don't shift when data loads or overlays appear

For every API call added:
[ ] Recalculate rate limit budget (see Phase 3)
[ ] Verify response fields at runtime (add console.log temporarily if unsure)
[ ] Plan what happens when the call fails (TanStack Query handles retry, but show PanelError)
```

---

## Phase 7: Pre-Deployment

**The goal: nothing broken when you switch from mock to live.**

```
[ ] All UI states tested with LIVE data source (NEXT_PUBLIC_DATA_SOURCE=api):
    [ ] Loading states appear (TanStack Query isPending, not isLoading)
    [ ] Error states appear when API fails (simulate with wrong API key)
    [ ] Data displays correctly (not all zeros, not stale mock data)
    [ ] All data fields come from the correct endpoints
    [ ] Rate limits not hit during normal usage

[ ] Vercel environment variables set:
    [ ] NEXT_PUBLIC_DATA_SOURCE=api
    [ ] Any API keys (server-side only — no NEXT_PUBLIC_ prefix for secrets)

[ ] Final TypeScript check: npx tsc --noEmit → 0 errors
[ ] Final build check: npm run build → succeeds
[ ] LIVE badge or indicator shows when live data is active
[ ] Deployment URL tested end-to-end in a browser (not just curl)
```

---

## Quick Reference: Lessons That Hurt Most

In rough order of "time lost":

1. **External API blocked from hosting provider** — test connectivity FIRST
2. **Native browser controls invisible in dark mode** — add [color-scheme:dark] on every select/date input
3. **`overflow-hidden` on popup** — Combobox clipped to 1 row; inner list should own overflow-y-auto
4. **Tailwind v4 dark: not working** — @custom-variant dark missing
5. **API response fields missing** — always inspect actual JSON before designing types
6. **Vite/Node version mismatch** — dependency pinning at the start, not after errors
7. **ThemeProvider defaulting to OS preference** — set enableSystem=false for dark-first UIs

---

## Phase 8: Landing Page Pre-Launch Gate

> Apply this gate only for landing page / marketing site projects.
> These items MUST be resolved before going live. Missing any of them blocks launch.

### Content Minimum (collect BEFORE Phase 1 starts)

```
[ ] Company name confirmed — used in JSON-LD, legal pages, footer, page title
[ ] Legal entity registration number — required for LSSI Art.10 compliance (Spain)
    or equivalent legal disclosure requirements in target country
[ ] Physical address — used in contact section, JSON-LD, Maps embed, legal pages
[ ] Phone number — contact section, JSON-LD
[ ] WhatsApp number — if WhatsApp is the primary contact channel (common in Spain/LatAm)
    — Format: international code without +: "34612345678" for Spain
[ ] Email address — contact section, JSON-LD, legal pages
[ ] Google Maps embed URL — generate at maps.google.com → Share → Embed
[ ] Business hours — contact section, JSON-LD openingHours
```

**If any of these are unknown at project start:** fill .env.local with placeholder values AND add a comment marking each placeholder. Do NOT proceed to launch without replacing every placeholder.

### Environment Variables (all must be set in production)

```
[ ] NEXT_PUBLIC_SITE_URL set to production domain (used in sitemap, robots, OG tags)
[ ] NEXT_PUBLIC_FORMSPREE_URL (or equivalent) set to real endpoint
[ ] Any analytics keys (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_PLAUSIBLE_DOMAIN, etc.)
[ ] .env.example committed to repo documenting all vars
```

### SEO & Legal (verify in browser)

```
[ ] All [PLACEHOLDER] strings replaced in legal pages
[ ] OG image is real branded image (not placeholder gray box)
[ ] Title and meta description appear correctly in browser tab and og:title
[ ] hreflang links appear in page source (view-source: and search for hreflang)
[ ] /sitemap.xml loads and shows real domain URLs (not localhost:3000)
[ ] /robots.txt references the real sitemap URL
[ ] JSON-LD validates at https://validator.schema.org (paste URL or raw JSON)
```

### Visual Verification (in browser)

```
[ ] Cookie consent banner appears on first visit (incognito window)
[ ] Cookie choice persists after refresh (check localStorage in DevTools)
[ ] All legal pages load (aviso-legal, privacidad, cookies) — in both locales
[ ] Footer legal links navigate to legal pages (not 404)
[ ] Quote/contact form submits successfully — check email inbox for test submission
[ ] WhatsApp button opens correct number in WhatsApp Web
[ ] Google Maps iframe shows the actual business location
[ ] Portfolio section shows real photos (not placeholder SVGs)
[ ] Language toggle works ES <-> EN on all pages including legal pages
[ ] Mobile hamburger menu opens, nav links close it and scroll to section
```

### Performance (deploy or local production build)

```
[ ] Lighthouse Performance score >= 90 (Mobile preset)
[ ] LCP < 2.5s — if over, check: hero image optimization, next/image priority prop
[ ] No layout shift (CLS near 0) — verify skeleton heights match content
[ ] npm run build succeeds with zero TypeScript errors
```

---

*Last updated: 2026-03-22*
