# Pitfalls Research

**Domain:** Bilingual academic research group website (Next.js 15 App Router + next-intl + JSON-driven content)
**Researched:** 2026-04-17
**Confidence:** HIGH for framework/library traps (verified against official next-intl and Next.js 15 docs). MEDIUM for academic-site anti-patterns (verified against community and research sources).

Scope note: Pitfalls below are specific to the intersection of (1) academic research group content, (2) Next.js 15 App Router, (3) next-intl Spanish-default bilingual setup, (4) JSON file content editable by non-technical maintainers, and (5) Vercel-first / static-export-compatible deployment. Generic web-dev advice (XSS, CSRF basics, etc.) is omitted.

---

## Critical Pitfalls

### Pitfall 1: Missing translation key crashes the page in production

**What goes wrong:**
A content editor adds a new section to `es.json` but forgets `en.json` (or vice versa). When a visitor toggles the missing locale, the page throws at render because `t('some.key')` returns `undefined` and downstream code (e.g., `.toUpperCase()`, JSX text) crashes. In Server Components this surfaces as a 500; in Client Components it can blank a section.

**Why it happens:**
next-intl's default `onError` behavior is to log and render `${namespace}.${key}` as a fallback string — but only for simple text. Any logic that consumes the value (formatting, `.length`, interpolation into attributes) fails. Also, translation files diverge over time because they're edited independently by non-technical users.

**How to avoid:**
- Configure `onError` and `getMessageFallback` in `i18n/request.ts` to report missing keys loudly in dev, quietly in prod (with `IntlErrorCode.MISSING_MESSAGE` handling).
- Add a CI script that diffs key sets between `es.json` and `en.json` and fails the build on divergence. Options: next-intl's own validator script, or a ~20-line `scripts/check-translations.ts`.
- For content-heavy JSON (`content/people.json` etc.), keep bilingual fields as objects `{ es, en }` inside a single file rather than two parallel files — structurally impossible to desync.
- Use TypeScript augmentation (`declare module 'next-intl'`) with the message schema so missing keys are caught at type-check time.

**Warning signs:**
- `npm run build` succeeds but Search Console reports "soft 404" or "page has error" on `/en/*` pages a week after a content update.
- Console shows `MISSING_MESSAGE` errors only when toggling to the less-edited locale.
- Preview deploys pass (editor only tested Spanish), prod breaks English.

**Phase to address:**
Phase 1 (Foundation / i18n setup) — wire `onError` and the CI diff check before any content pages are built.

---

### Pitfall 2: Hero carousel destroys LCP and CLS scores

**What goes wrong:**
A hero carousel with 3 rotating 1920×800 images hurts both:
- **LCP:** All 3 slides load eagerly, or only slide-1 is marked `priority` but a layout-shift-inducing loader replaces it. Total blocking time balloons.
- **CLS:** Carousel library (Swiper default CSS, Embla without explicit height) doesn't reserve space before JS hydrates, causing shift when the first slide paints. Swiper specifically has a known CLS issue where the track collapses on SSR.
- **Accessibility:** 6–8s auto-advance violates WCAG 2.2.2 ("Pause, Stop, Hide") unless a pause control is provided.

**Why it happens:**
Carousels are the default "hero" pattern from marketing templates, but they were designed for on-device JS-heavy pages, not statically rendered institutional sites. The LCP element is the first slide's background image, which must be `priority`, correctly `sizes`'d, and pre-sized with explicit aspect ratio to avoid shift. Auto-rotation is added for "visual interest" without thinking about keyboard / screen-reader / reduced-motion users.

**How to avoid:**
- Only the first slide gets `<Image priority sizes="100vw" fetchPriority="high">`. Subsequent slides load lazily (or on carousel advance).
- Set an explicit `aspect-ratio: 1920/800` on the carousel container so layout is stable before hydration.
- Add `prefers-reduced-motion` check — if set, disable auto-advance entirely and render only the first slide (or a crossfade-less static hero).
- Include visible pause/play button, keyboard arrow-key nav, `aria-live="polite"` only when focused, `aria-roledescription="carousel"` on the region, and `role="group"` with `aria-label="Slide N of M"` per slide.
- Prefer Embla Carousel over Swiper for this project: smaller bundle, no default CSS surprises, better SSR story. If not using a library, a CSS-only fade crossfade is viable for 3 slides and avoids a dependency entirely.
- Self-host the images (in `/public/hero/`) — do not hotlink.

**Warning signs:**
- Lighthouse LCP > 2.5s on mobile even on fast 3G simulation.
- CLS > 0.1 on the home page.
- Axe / Lighthouse accessibility score flags "auto-updating content" or missing pause button.

**Phase to address:**
Phase 3 (home page build) for initial implementation, Phase 5 (Polish) for LCP/CLS verification via Lighthouse CI or WebPageTest.

---

### Pitfall 3: next/image silently breaks static export

**What goes wrong:**
The team builds with `vercel` as the target, `next/image` uses the default loader, everything works. Later someone runs `next build` with `output: 'export'` for university hosting — images either 404, or the build fails with "Image Optimization using the default loader is not compatible with `{ output: 'export' }`." Either way, the "static export escape hatch" promised in PROJECT.md is not actually working.

**Why it happens:**
Next.js's default image optimization is an on-demand API requiring a Node.js server. Static export has no server, so it must either use raw images (no optimization) or a custom loader pointing at an external image service. Teams don't discover this until they actually try to static-export, at which point pipelines and URLs have hardened.

**How to avoid:**
- Decide day 1 whether static export is actually required. If "maybe later," still pay the small cost now: configure a custom image loader that works both ways.
- Use `next-image-export-optimizer` (generates multiple sizes at build time, static-export-friendly) **or** configure `images.unoptimized: true` and accept un-optimized images for the static-export build path, **or** use an external image CDN (Cloudinary, imgix) via `loader: 'custom'`.
- Run `next build` with `output: 'export'` in CI on every PR — even if production deploys to Vercel. This catches static-export regressions the day they're introduced.
- Document in README which features of next/image work in each build target.

**Warning signs:**
- Only Vercel previews are tested; no one has actually run `output: 'export'` since project start.
- Images render on Vercel but 404 on a local `next build && npx serve out/`.
- `npm run build:static` doesn't exist as a script.

**Phase to address:**
Phase 1 (Foundation) — set up dual build scripts (`build:vercel`, `build:static`) and a CI matrix that runs both. Cheap to do now, expensive to retrofit.

---

### Pitfall 4: One malformed JSON file kills the entire build

**What goes wrong:**
A non-technical group maintainer edits `content/people.json` via GitHub web UI to add a new postdoc. They paste a smart-quote from Word, forget a comma, or add a trailing comma — `JSON.parse` throws, the Vercel build fails, the site goes down (or at minimum, no new content ships). Worse: editor fixes their mistake but commits a subtle schema error (e.g., `role: "PhD student"` instead of `category: "phd"`), the build succeeds, and a page renders broken data or crashes at runtime.

**Why it happens:**
JSON is unforgiving (no comments, no trailing commas, strict quotes) and has no schema validation by default. The "JSON is simpler than a CMS" decision (PROJECT.md) is only true if there's validation tooling around it. Without validation, JSON is just "a broken CMS with no UI."

**How to avoid:**
- Define a Zod schema for every content file (`PersonSchema`, `PublicationSchema`, etc.). Parse with `.parse()` at build time in the data-loader module — failure crashes the build loudly with a precise path to the bad record (e.g., `people[3].contact.email: expected string, got undefined`).
- Validate in a pre-commit hook **and** in CI. Pre-commit catches typos locally; CI catches edits via GitHub web UI.
- Provide editors with JSON Schema files (`content/schemas/*.schema.json`) so VS Code's built-in JSON IntelliSense autocompletes fields and flags errors live. Reference via `$schema` key at the top of each content file.
- Consider YAML with a `.yaml` extension instead of JSON for the editor-facing files (more forgiving syntax, allows comments). Then compile to validated JS at build. But: introduces a build step and another tool to learn. For this project's scale (one group, infrequent edits), JSON + Zod + JSON Schema is the pragmatic sweet spot.
- Document editor workflow in `content/README.md` with an example edit and a "what to do if the build fails" troubleshooting section.

**Warning signs:**
- No schemas exist for content files.
- Data loader uses `JSON.parse(readFileSync(...))` without validation.
- No CI step that explicitly exercises the loader before `next build`.

**Phase to address:**
Phase 2 (Data Layer / content architecture) — Zod schemas and loader are foundational and should land before any page consumes the data.

---

### Pitfall 5: Photo references point to files that don't exist

**What goes wrong:**
`content/people.json` lists `"photo": "/people/jdoe.jpg"` but no one uploaded `jdoe.jpg`. Next.js Image throws at render (or shows broken alt text). Or the file exists but is the wrong dimensions, breaking the 400×400 square grid. Or the file is 8 MB because no one compressed it. Or all 13 people have photos, but the PI emeritus added last week doesn't, and that card breaks the layout.

**Why it happens:**
JSON references are strings — the type system can't verify the referenced file exists. Non-technical editors add a new person entry days before uploading the photo, assuming it'll "work when I add the image."

**How to avoid:**
- Loader validates that every `photo` path resolves to a file in `public/`. Use `fs.existsSync` (build-time only) or a build-time glob check. Fail the build on missing references.
- Always provide a deterministic placeholder when `photo` is absent: a styled avatar with the person's initials, using the same 400×400 square. Do not rely on a `photo` field being present.
- Run `sharp` at build time over `public/people/*` to verify min dimensions and max file size. Warn (not fail) if over 500 KB; fail if dimensions don't satisfy the component's expected aspect ratio.
- Schema makes `photo` optional with a fallback, **or** required with a known placeholder path — never "required string, trust it exists."

**Warning signs:**
- `Error: Failed to load image /people/missing.jpg` in build logs or Vercel deploy logs.
- Photos visibly vary in size or aspect ratio on the People page.
- Page Weight audit shows photo files > 500 KB each.

**Phase to address:**
Phase 2 (Data Layer) for validation logic; Phase 3 (People pages) for placeholder component.

---

### Pitfall 6: Language switcher loses the current page (and breaks SEO)

**What goes wrong:**
User is on `/en/people/maria-rodriguez`, clicks the ES toggle, and lands on `/` (home) instead of `/people/maria-rodriguez`. Screen reader doesn't announce the language change. Or the switch works but on `localePrefix: 'as-needed'` the href includes `/es/` prefix briefly before a redirect, causing a flash.

**Why it happens:**
Default language switchers are often wired as a `<Link>` to `/` with the new locale. Preserving the current pathname requires reading `usePathname()` and stripping/re-adding the locale prefix. With next-intl's `as-needed` strategy, the `Link` component intentionally uses a prefixed href to set a cookie, then redirects — designers don't realize this is the expected behavior.

**How to avoid:**
- Use next-intl's `useRouter()` + `router.replace(pathname, { locale: 'en' })` from `@/i18n/navigation`, which handles locale swapping correctly.
- For non-dynamic routes, the switcher should render two `<Link>` components (one per locale) with preloaded hrefs to the same path in each language. This works without JS and is accessible.
- Add `aria-label` to the switcher ("Switch to English" / "Cambiar a inglés"), and use `<html lang="...">` set from the active locale — screen readers pick this up on page change.
- Keep the switcher visible on every page (not hidden behind a menu), and show the **target** language label, not the current one. Label should be in the target language ("English" to switch to EN, "Español" to switch to ES) — widely understood convention.
- Preserve dynamic params: for `/people/[slug]`, `router.replace` keeps the slug. If you ever translate slugs per-locale (e.g. `/gente/...` in ES), use next-intl's `pathnames` config rather than rolling your own mapping.

**Warning signs:**
- Toggling language on `/publications?year=2024` loses the query param.
- `<html lang>` attribute doesn't change when locale changes.
- Lighthouse flags "Document doesn't have a `lang` attribute" on subroutes.

**Phase to address:**
Phase 3 (Navigation component) — design and test the switcher once; all other pages depend on it working.

---

### Pitfall 7: Sitemap and hreflang don't list locale alternates

**What goes wrong:**
Google indexes only the Spanish or only the English version. International academic peers searching in English can't find the group. Search Console shows "Alternate page with proper canonical tag" warnings or "Conflicting hreflang" errors. The default Next.js `sitemap.ts` outputs one URL per page without `<xhtml:link rel="alternate" hreflang="...">` tags — Google doesn't discover the English variant.

**Why it happens:**
Next.js's `MetadataRoute.Sitemap` type supports an `alternates.languages` object but it's not auto-populated — developers must build it explicitly. When `localePrefix: 'as-needed'`, next-intl disables automatic alternate-link headers because URLs without prefixes aren't unique (both ES and EN might map to `/`). Teams copy the default sitemap example from Next.js docs and ship mono-locale sitemaps.

**How to avoid:**
- Build `app/sitemap.ts` that iterates `locales × routes` and emits one entry per page with `alternates.languages = { es: '...', en: '...', 'x-default': '...' }`. `x-default` should point to the Spanish (default) version.
- Use `generateMetadata` in every route to set `alternates.canonical` (the Spanish URL for default-locale pages) and `alternates.languages` — hreflang tags are then injected into `<head>` per page.
- Verify every hreflang target returns HTTP 200 (no redirect chains). Use a sitemap validator tool in CI.
- Also emit a `robots.txt` that references the sitemap.
- Do NOT set the same canonical URL on both ES and EN variants — that tells Google to drop one from the index.

**Warning signs:**
- `view-source:` on any page shows no `<link rel="alternate" hreflang="...">` tags.
- `sitemap.xml` has N entries (one per page) instead of N×2 or N with embedded alternates.
- Search Console under `/en/*` shows "Duplicate without user-selected canonical" or "Alternate page with proper canonical tag."

**Phase to address:**
Phase 4 (SEO / metadata) — sitemap and metadata alternates land together. Blocks indexing of the second locale.

---

### Pitfall 8: Email addresses get harvested and scholars drown in spam

**What goes wrong:**
`mailto:juan.perez@df.uba.ar` appears in raw HTML across 13 people pages and one contact page. Harvesters scrape it within weeks. The PI's inbox fills with spam (conferences, predatory journals, paper solicitations). They blame the website.

**Why it happens:**
The academic instinct is to publish contact info openly ("of course my email is on my page"). Mailto links in raw HTML are the #1 vector for email harvesters — plain-text `@` and `.` are trivially scraped. Most institutional sites don't bother obfuscating.

**How to avoid:**
- Store emails in JSON split form: `{ "local": "juan.perez", "domain": "df.uba.ar" }`. Never render the full address as a string during SSR.
- Client-side-only reveal: render a button "Show email" that JavaScript assembles on click. Harvesters that don't execute JS (most) see nothing. For users without JS (rare), a `<noscript>` with a less-obvious form like "juan.perez [at] df.uba.ar" is acceptable.
- Alternative: render the email as an inline SVG `<text>` element. Text is visually identical, copy-paste works on modern browsers, harvesters that only parse HTML text nodes miss it.
- Do not use a pure JavaScript obfuscator that builds the mailto link on page load — the assembled href ends up in the rendered DOM, which advanced harvesters read.
- For a contact form, implement rate limiting + honeypot field + (if on Vercel) built-in DDoS protection. Do not expose a contact email for the contact form — use a form + mailer.
- Document the reveal pattern in a reusable `<EmailLink>` component so every appearance of an email across the site is protected consistently.

**Warning signs:**
- `curl https://the-site.com/people/... | grep '@'` returns any real email address.
- No component called `<EmailLink>` or equivalent exists.
- Person bios contain raw `mailto:` strings.

**Phase to address:**
Phase 3 (People detail pages and Contact page) — one reusable component, but must be enforced everywhere. Add a Grep-based lint check in CI to forbid `mailto:` strings in JSX.

---

## Moderate Pitfalls

### Pitfall 9: Placeholder-to-real content breaks layout

**What goes wrong:**
Placeholder data uses names of uniform length ("Dr. Placeholder One", "Dr. Placeholder Two"), 2-line bios, and 400×400 photos. Real data arrives with names like "Dra. María Guadalupe Fernández-Rodríguez de la Vega", 6-line bios with line breaks, and photos that are 600×800 portrait crops. Card grid breaks, bio text overflows, images get distorted.

**How to avoid:**
- Placeholder data must stress-test the layout: include one name that is unreasonably long, one bio that is the maximum expected length, one photo that is portrait-orientation cropped to the square container with `object-fit: cover`.
- CSS: use `text-wrap: balance` on names, `line-clamp` on bios with a "read more" link to the detail page, and fixed aspect ratios on photo containers.
- Type the photo field to enforce consistency: during build, pipe all photos through `sharp` to produce standardized 400×400 and 800×800 variants. Editors upload anything; the build normalizes.
- Test in both ES and EN — Spanish runs ~25% longer than English for the same content, so copy that fits in EN may wrap awkwardly in ES.

---

### Pitfall 10: Publications list becomes unmaintainable

**What goes wrong:**
PROJECT.md says publications are placeholder-only, real importer deferred to v2. But even placeholder publications lists grow: once real data lands, 150+ publications across 10+ years in one JSON file is painful to edit. Filters (by year, author, topic) were designed for 30 entries and slow down at 300. "Group by year" collapses become scroll-hell.

**How to avoke:**
- Design the schema now to match what an arXiv/ADS importer will produce later (BibTeX-compatible fields: `authors[]`, `title`, `journal`, `year`, `arxiv_id`, `doi`). Placeholder data should use the exact shape. Prevents a schema migration when v2 lands.
- Split publications into year-indexed files (`content/publications/2024.json`, `2023.json`, ...) rather than a single monolith. Editors touch only the current year's file most of the time; git diffs stay readable.
- Default the publications page to "latest 20 + year filter" rather than rendering all publications at once. Each year filter loads its own JSON chunk.
- Filter client-side with a lightweight index, not by re-rendering 300 DOM nodes.

---

### Pitfall 11: Broken external links (link rot) accumulate silently

**What goes wrong:**
A PI links to their ORCID page, Google Scholar, personal homepage, a paper's arXiv URL. Over 2–5 years, ~30% of external links rot (reports vary from 25% at 2 years to 66% at 9 years). The group site looks stale and unreliable.

**How to avoid:**
- Prefer stable identifiers: DOIs for papers (`https://doi.org/...`), ORCID IDs for people, arXiv IDs (`arxiv.org/abs/...`). Avoid linking to author-hosted PDFs or personal homepages when a DOI exists.
- Add a weekly scheduled link-check: run `lychee` (Rust link checker) via GitHub Actions over `content/**/*.json` and open an issue listing broken links. Editors see a curated list, not a silent rot.
- For each external link in the schema, add a `checked_at: ISODate` field the link-checker updates. Oldest links surface first for review.
- For past-member pages, archive at `web.archive.org` proactively and link to the archive if the original dies.

---

### Pitfall 12: Fonts cause FOUT / CLS even with next/font

**What goes wrong:**
Designer picks a Google Font with 6 weights and both italics. Next.js downloads all 12 font files at build, `<head>` becomes heavy, or CLS appears because the fallback font and custom font have very different metrics.

**How to avoid:**
- Pick one variable font (e.g., Inter, Source Serif) that covers all needed weights in a single file. Avoid loading 4+ static weight files.
- Use `next/font/local` to self-host (required for static export compatibility — `next/font/google` also self-hosts the files at build, but confirm with the version in use).
- Specify only the `subsets` actually used (`['latin', 'latin-ext']` for Spanish; English fits in `latin`). Do not default to loading Cyrillic, Greek, Vietnamese, etc.
- Let Next.js auto-calculate `adjustFontFallback` metrics — it matches system font metrics to the custom font to eliminate the layout shift when the custom font finally paints.
- Test with DevTools network throttling on "Fast 3G" and verify no FOUT/CLS.

---

### Pitfall 13: Google Maps iframe tanks performance

**What goes wrong:**
The contact page embeds `<iframe src="https://www.google.com/maps/embed?...">`. Even with `loading="lazy"`, Chrome prefetches iframes near the viewport on scroll, and the Maps embed pulls ~2 MB of JS and blocks the main thread ~300 ms. Lighthouse flags "Reduce the impact of third-party code."

**How to avoid:**
- Don't embed the live map by default. Render a static map image (Google Static Maps API, or a screenshot) with a button "Open in Google Maps" that links to `https://www.google.com/maps/place/...`. Keeps TTI fast and respects privacy.
- If an interactive map is required, use `IntersectionObserver` to inject the iframe only when the user scrolls within 200px of it — i.e., on intent, not on page load.
- Alternative: an `<iframe>` inside a `<details>` element that users expand ("Show map"). Map loads only on open.
- Account for cookie consent: Google Maps sets cookies. If GDPR/consent banner is in scope, the map must be gated behind consent.

---

### Pitfall 14: Carousel is the only way to see multiple hero items

**What goes wrong:**
Important content (research highlights, news, upcoming events) is hidden behind carousel slides 2 and 3. Studies consistently show carousel slide-2 click-through is <2% and slide-3 is <1%. A visitor who doesn't wait the 6 seconds never sees slides 2–3.

**How to avoid:**
- Use the hero carousel only for visual branding (rotating imagery, not distinct "messages"). Each slide should be an equally valid representation of the group, not an important call-to-action.
- Put genuinely important content (highlights, calls for PhD applicants, recent paper announcements) in a dedicated section below the fold with its own grid — no rotation.
- If a rotating announcements module is truly wanted, make it non-auto-advancing, or auto-advance only after user interaction.

---

## Minor Pitfalls

### Pitfall 15: Slug collisions and non-ASCII URLs

**What goes wrong:**
Two group members named "Juan García" (Sr. and Jr.) get the same slug. Or a slug is generated as `martín-gómez` with diacritics — some older crawlers and referrers encode the URL inconsistently, producing `/people/mart%C3%ADn-g%C3%B3mez` in shares.

**How to avoid:**
- Slugs are explicit in the JSON (`"slug": "martin-gomez"`), not auto-generated from the name. Editors have full control and can disambiguate (`"juan-garcia-sr"` vs `"juan-garcia-jr"`).
- Normalize diacritics in a validation step: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` — schema rejects slugs containing any non-ASCII character.
- Zod schema uniqueness check across `people[].slug` at build time. Duplicate slug → build fails with "Duplicate slug `juan-garcia` at people[3] and people[11]".

---

### Pitfall 16: ARIA labels in only one language

**What goes wrong:**
Navbar has `aria-label="Main navigation"` hardcoded in English. Screen readers in Spanish locale still announce "Main navigation" — jarring for a Spanish-primary site.

**How to avoid:**
- Every `aria-label`, `alt`, and visually hidden label goes through `t()` translation calls, not hardcoded English.
- Document this rule in a code review checklist: "Does this PR add any `aria-` or `alt` attributes? If so, are they translated?"

---

### Pitfall 17: Mixed-language content on a single page

**What goes wrong:**
On the EN version, the publications page shows paper titles that are always in English (because papers ARE in English). Fine. But on the ES version, the PhD bio says "Maria trabaja en..." and then quotes the title of their paper in English, with no `lang` switch. Screen readers pronounce English words with Spanish phonemes.

**How to avoid:**
- Any inline content in a different language from the page locale should be wrapped in `<span lang="en">English phrase</span>`. Applies especially to paper titles, technical terms, institutional names that are always in English.
- For publications specifically, accept that titles stay in their original language and mark them explicitly with `<span lang="en">`.

---

### Pitfall 18: Contact info drifts between pages

**What goes wrong:**
The postal address appears on Contact page, in the footer, in the Schema.org JSON-LD, and in the "How to reach us" section. Address changes (department moves floors) → four edits needed → one gets missed → structured data now says "Pabellón 1" while the footer says "Pabellón 2".

**How to avoid:**
- Single source of truth: `content/site.json` with `address`, `email`, `phone`, `coordinates`. Every page reads from this; no copy-paste.
- Schema.org `PostalAddress` + `Organization` JSON-LD generated from the same source, not hand-written.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode strings in JSX instead of routing through `t()` | Ship a component 10 minutes faster | Every new string scattered across files; adding a third locale later is a week of grep-replace | Never — use `t()` from day 1 |
| Skip Zod schemas, trust JSON structure | Saves ~1 hour in Phase 2 | First editor typo breaks prod; debugging a runtime `undefined` in a nested field is painful | Never for files editable by non-devs |
| `output: 'export'` untested, assume it "probably works" | Avoids setting up dual-build CI | Discovers on deployment day that next/image, dynamic OG, or middleware silently doesn't work | Acceptable if static export is explicitly "post-v1 maybe" |
| Single `content/publications.json` for all publications | One file to remember | Becomes 5000-line merge-conflict magnet at 200+ publications | Acceptable for MVP (<50 publications) |
| Use `<img>` instead of `<Image>` to dodge static-export complexity | Ships images immediately without loader config | Loses LCP optimization, no automatic `srcset`, worse Core Web Vitals | Acceptable for one-off decorative images (e.g., partner logos) if accompanied by explicit `width`/`height` |
| Copy-paste ES strings as EN placeholder ("fix later") | Unblocks English-page QA | Site ships with "Inicio" showing on `/en/` if forgotten; search engines index mixed content | Never — use `en.json` with English placeholders from day 1, even if just "[EN: Home]" |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Maps embed | Dropping `<iframe>` raw into JSX; blocks main thread on page load | Static map image + "Open in Maps" link, or IntersectionObserver-deferred iframe behind user intent |
| Google Fonts / next/font | Loading 6 weights × 2 styles; neglecting `subsets` | One variable font, subsets: `['latin', 'latin-ext']`, preload true for the primary weight |
| next-intl middleware | Forgetting to add it, or adding it without a matcher that excludes `_next`, `api`, static assets | Use the matcher pattern from next-intl docs exactly; test that `/robots.txt` and `/sitemap.xml` bypass locale redirection |
| arXiv/ORCID/Scholar external links | Linking to ad-hoc paths like `scholar.google.com/citations?user=xyz` that may change | Store IDs (ORCID ID, arXiv ID, DOI) in JSON; render via helper that constructs the URL; swap the helper later if the URL pattern changes |
| Vercel OG image (next/og) | Assuming it works with `output: 'export'` — it does not without extra config | If static export matters, generate OG images at build via `generateStaticParams` on the `opengraph-image.tsx` route, or skip dynamic OG and use a single static PNG |
| Schema.org Organization JSON-LD | Putting the same `Organization` block on every page | Put it once in the root `layout.tsx` (homepage) + `Person` per `/people/[slug]` page. Avoid duplicating organization markup across every page |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Hero carousel loads all slide images eagerly | LCP > 2.5s on mobile, cumulative page weight > 3 MB | First slide `priority` + `fetchPriority="high"`, others lazy; explicit `aspect-ratio` on container | Visible on first page-load audit; gets worse as slides are added |
| Google Maps iframe on contact page | TBT > 300ms, Lighthouse "Reduce third-party" warning | Static map or lazy-inject on scroll | Any mobile visit |
| Publications page renders all 200+ entries | Slow TTI, large DOM, scroll jank on low-end Android | Default to latest 20 + year filter; chunk JSON by year | At ~100+ publications |
| Font files: 6 weights × 2 styles × 2 subsets | 400 KB+ of font CSS/WOFF2 on page load | Single variable font, minimal subsets | First real content audit |
| Client-side hydration of the full publications list for filtering | Large JSON ships to client, hydration takes 500ms+ | Filter server-side via URL params (static-export-friendly: pre-render `/publications/year/2024`); or ship a compact index (id, year, title, authors) for client filter, not the full records | At ~50+ publications |

## Security Mistakes

Domain-specific security issues beyond generic web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Raw `mailto:` links in rendered HTML | Email harvesters flood PI inboxes with spam / predatory-journal solicitations | JS-based reveal, split-form storage, SVG text, or contact form (see Pitfall 8) |
| Embedding Google Maps without user consent | GDPR/privacy risk (Google sets cookies before user interaction) | Click-to-load pattern; or document in privacy policy that consent is implied |
| Uploading internal/unreleased research to `/content` for "draft" pages | Unpublished research leaks via git history / sitemap | Draft content stays outside the repo entirely; content files are considered "public the moment they land in main" |
| Exposing private photos in `/public/` before publication | Student / postdoc photos may be uploaded before consent received | Photo consent tracked in content schema (`photo_consent: true`); loader refuses to render photo if missing |
| Committing real email addresses to a public repo even with obfuscation | Repo is fully indexable by GitHub code search; scrapers hit repos, not just rendered sites | Keep repo private (per CLAUDE.md) until explicitly opted public; if going public, emails must still be in obfuscated form in JSON |
| No CSP headers | Allows injection of external scripts (unlikely for static site but still) | Set `Content-Security-Policy` in `next.config.js` headers or via Vercel config. Minimum: `default-src 'self'` + explicit allows for Google Fonts / Maps if used |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Language toggle labeled with current language | Users click "ES" expecting Spanish, get English (because ES was the *current* label) | Label with the *target* language: show "English" when current is ES, "Español" when current is EN |
| Carousel auto-advance with no pause control | WCAG violation; distracts readers; screen reader announces slide changes repeatedly | Visible pause button, `prefers-reduced-motion` disables auto-advance, slides don't advance while carousel has focus |
| Long single-page publications list with no grouping | User gets lost scrolling, can't find a specific year | Default view: latest 20. Year filter chips at top. Deep-link to `/publications?year=2024` |
| "Past Members" section buried at the bottom of People page | Visitors hunting for alumni (e.g., a recommender) give up | Dedicated `/people/past` page with its own nav entry, or a prominent "See alumni" link atop People |
| People detail page requires knowing the slug | No obvious way to get back to full roster from a member page | Breadcrumb: `Inicio > Gente > María Rodríguez`. Sticky "Back to People" link. |
| Outreach page undifferentiated grid of mixed content types | Talks, workshops, school visits, articles all mashed together | Filter/tab by type: "Charlas | Talleres | Prensa | Visitas" |
| ORCID / Scholar / Personal site icons without labels | Unfamiliar icons confuse less-academic visitors | Icons + text labels on hover AND for screen readers (`aria-label`) |
| Loading spinner for content that's already in the static bundle | Feels slow even though data is instantly available | No spinners on static pages — only on year-filter interactions or similar |

## "Looks Done But Isn't" Checklist

Things that appear complete in a demo but are missing critical pieces.

- [ ] **Home page:** Hero looks great on desktop — have you tested mobile LCP? Does it respect `prefers-reduced-motion`? Is slide 2/3 preloaded or lazy?
- [ ] **People page:** All cards render — have you tested with a 40-character name? A portrait (not square) photo? A person missing `photo`?
- [ ] **Person detail page:** Bio looks good — does it render when `full_bio` is empty? Are the external links (ORCID, Scholar) real URLs?
- [ ] **Publications page:** Filter works — does it work with 0 results? With 100+ publications? With a query param like `?year=1999` that has no matches?
- [ ] **Contact page:** Map embed shown — does it lazy-load? Is the email obfuscated? Does the form (if any) have rate limiting?
- [ ] **Language toggle:** Switches locale — does it preserve the current path? Query params? Dynamic slugs? Does `<html lang>` update?
- [ ] **Navigation:** Main nav works — does it collapse correctly on mobile? Is the active page indicated? Is it keyboard-navigable?
- [ ] **SEO:** `<title>` and `<meta description>` set — are they localized? Do all pages have unique titles? Do hreflang tags appear in view-source for every page?
- [ ] **Schema.org:** JSON-LD added — does Google's Rich Results Test parse it? Is Organization on the home page only, not every page?
- [ ] **Sitemap:** `/sitemap.xml` returns content — does it include all locale variants via alternates? Does every URL return HTTP 200?
- [ ] **Static export:** `npm run build` works — does `output: 'export'` also work, producing a usable `/out` directory? Have you served it locally?
- [ ] **Content validation:** JSON files load — does the build fail on a malformed file with a clear error? Does a malformed PR fail CI?
- [ ] **Translations:** Both locales render — is there a CI check that both files have the same keys? Is there one for `aria-label` translations?
- [ ] **Photos:** All photos render — are they all ≤500KB? Do missing photos fall back to a placeholder? Are photo paths validated at build?
- [ ] **Accessibility:** Lighthouse score >90 — has a real screen reader (NVDA/VoiceOver) been used on the home page, people page, and language switch? Do all interactive elements have visible focus states?
- [ ] **External links:** ORCID / Scholar / arXiv links render — have they all been clicked once to confirm they go where expected?
- [ ] **Email protection:** No `mailto:` string appears in rendered HTML — `curl` + grep to verify, not visual inspection.
- [ ] **Reduced motion:** `prefers-reduced-motion: reduce` — does the carousel still work (static first slide)? Do any other animations honor the preference?

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Translation keys diverged, prod page crashes | LOW | Configure `onError`/`getMessageFallback` to render key as string in prod; fix missing keys in follow-up; add CI diff check |
| Build broken by malformed JSON commit | LOW | Revert the commit on main; add Zod validation to prevent recurrence; add pre-commit hook |
| Static export broken by feature creep (e.g., Server Actions added) | MEDIUM | Audit feature usage; gate server-only features behind `process.env.NEXT_BUILD_TARGET`; add CI for static build |
| LCP regressed to >4s after adding a carousel | MEDIUM | Revert carousel or switch to CSS-only fade; add Lighthouse CI with LCP budget |
| Email harvested, PI getting spam | MEDIUM | Rotate the email (painful — change signature, notify collaborators); retrofit obfuscation for all future emails |
| Search Console reports duplicate content / missing hreflang | MEDIUM | Fix hreflang tags and canonical URLs; resubmit sitemap; monitor Search Console for 2–4 weeks for reindex |
| Photos 3x expected size, page weight 10MB | LOW | Add `sharp` build-time resize pipeline; replace raw files in `/public`; re-deploy |
| Publications JSON at 300 entries and unmaintainable | MEDIUM | Split into per-year files; update loader to glob-import; no URL changes needed |
| External links rotted | LOW-MEDIUM (recurring) | Run `lychee` over content; update or archive broken links; automate the check weekly |
| Layout broken by real content (long names, portrait photos) | LOW | Update stress-test placeholders to cover edge cases; fix CSS; prevents recurrence |
| `<html lang>` wrong on locale switch | LOW | Ensure `layout.tsx` reads locale from params and sets `lang` on `<html>`; test with axe |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 Missing translation keys | Phase 1 (Foundation / i18n setup) | `onError` configured; CI diffs `es.json` vs `en.json` |
| #2 Hero carousel LCP/CLS/a11y | Phase 3 (Home page), Phase 5 (Polish) | Lighthouse LCP <2.5s mobile, CLS <0.1; axe passes; `prefers-reduced-motion` tested |
| #3 next/image breaks static export | Phase 1 (Foundation / build config) | CI runs both `build:vercel` and `build:static` on every PR |
| #4 JSON files crash build | Phase 2 (Data layer) | Zod schemas for all content; pre-commit + CI validation; bad-PR test |
| #5 Photo references missing | Phase 2 (Data layer) + Phase 3 (People) | Build fails on missing file; placeholder component renders for optional photos |
| #6 Language switcher loses page | Phase 3 (Navigation component) | Manual test: toggle from every page type; verify `<html lang>` updates |
| #7 Sitemap/hreflang incomplete | Phase 4 (SEO/metadata) | `view-source` check on sample pages; Google Rich Results Test; sitemap validator |
| #8 Email harvesting | Phase 3 (People + Contact pages) | `curl | grep '@'` returns no real addresses; CI lint forbids `mailto:` literals |
| #9 Placeholder-to-real breaks layout | Phase 2 (Placeholders) + Phase 5 (Polish) | Stress-test placeholder data; visual regression test if available |
| #10 Publications unmaintainable | Phase 2 (Schema design) + Phase 4 (Publications page) | Schema matches arXiv/ADS shape; chunked by year; filter perf tested at 200 entries |
| #11 External link rot | Phase 6 (Post-launch ops) | Weekly GitHub Action with `lychee`; issue auto-created for broken links |
| #12 Font FOUT/CLS | Phase 1 (Foundation / fonts) | Lighthouse CLS <0.1; network throttling test |
| #13 Google Maps performance | Phase 3 (Contact page) | Lighthouse TBT <200ms on contact page; map loads on intent only |
| #14 Carousel as critical content vector | Phase 3 (Home page) — design-level | No CTAs hidden in slides 2+; dedicated highlight section below |
| #15 Slug collisions / non-ASCII | Phase 2 (Data layer) | Zod uniqueness + ASCII-only regex |
| #16 ARIA in one language only | Phase 3 (each page) + code review | Lint/grep for hardcoded English `aria-label`; translate all |
| #17 Mixed-language content | Phase 4 (Publications, bios) | Inline `<span lang>` for off-locale text |
| #18 Contact info drift | Phase 2 (content/site.json) | Single source; all pages reference same variable |

## Sources

**High-confidence (official docs & GitHub issues):**
- [next-intl: Request configuration / error handling](https://next-intl.dev/docs/usage/configuration)
- [next-intl: Validating messages](https://next-intl.dev/docs/workflows/messages)
- [next-intl: Routing configuration (localePrefix)](https://next-intl.dev/docs/routing/configuration)
- [Issue: `redirect` ignores locale when `localePrefix` is set to "as-needed"](https://github.com/amannn/next-intl/issues/1845)
- [Issue: Locale prefix should be removed from Link href with 'as-needed'](https://github.com/amannn/next-intl/issues/647)
- [Next.js: Static Exports guide (limitations)](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js: Export with Image Optimization API error](https://nextjs.org/docs/messages/export-image-api)
- [Next.js: next.config.js images reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/images)
- [Next.js: opengraph-image metadata file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js: Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Server Actions in Static Exports discussion](https://github.com/vercel/next.js/discussions/67503)
- [W3C WAI: Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/)
- [WebAIM: Animation and Carousels](https://webaim.org/techniques/carousels/)
- [Schema.org: Organization](https://schema.org/Organization) / [Person](https://schema.org/Person) / [ResearchProject](https://schema.org/ResearchProject)
- [Zod: Schema definition and errors](https://zod.dev/)

**Medium-confidence (verified community):**
- [Swiper CLS issue on PageSpeed Insights](https://github.com/nolimits4web/swiper/issues/4076)
- [next-intl guide for Next.js 15](https://www.buildwithmatija.com/blog/nextjs-internationalization-guide-next-intl-2025)
- [Implementing multilingual sitemap with next-intl](https://dev.to/oikon/implementing-multilingual-sitemap-with-nextjs-app-router-1354)
- [SEO + i18n guide for App Router](https://dev.to/oikon/seo-and-i18n-implementation-guide-for-nextjs-app-router-dynamic-metadata-and-internationalization-3eol)
- [Email Obfuscation — What works in 2026](https://spencermortensen.com/articles/email-obfuscation/)
- [Cloudflare Email Address Obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/)
- [Lazy-loading Google Maps with IntersectionObserver](https://walterebert.com/blog/lazy-loading-google-maps-with-the-intersection-observer-api/)
- [Google Maps 100% PageSpeed guide](https://www.corewebvitals.io/pagespeed/google-maps-100-percent-pagespeed)
- [Accessible Carousel guide (Smashing Magazine)](https://www.smashingmagazine.com/2023/02/guide-building-accessible-carousels/)
- [Carousel Accessibility Complete Guide (TestParty)](https://testparty.ai/blog/carousel-slider-accessibility)
- [Next.js Core Web Vitals 2026 (LCP beyond images)](https://shubhamjha.com/blog/core-web-vitals-nextjs-optimization)

**Link-rot evidence:**
- [Ahrefs study on link rot (66.5% dead in 9 years)](https://ahrefs.com/blog/link-rot-study/)
- [Broken links in SE research (Leitner)](https://philippleitner.medium.com/how-much-of-a-problem-are-broken-links-in-se-research-cedfdce3d030)
- [Link rot - Wikipedia](https://en.wikipedia.org/wiki/Link_rot)

---
*Pitfalls research for: Bilingual academic research group website (Next.js 15 + next-intl + JSON content, Vercel-first / static-export-compatible)*
*Researched: 2026-04-17*
