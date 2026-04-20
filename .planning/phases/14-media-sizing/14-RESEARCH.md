# Phase 14: Media Sizing - Research

**Researched:** 2026-04-20
**Domain:** Responsive image sizing / `next/image` `sizes` attribute / Tailwind v4 aspect-ratio + width utilities inside a Next.js 16 / React 19 / Tailwind 4.2.2 codebase
**Confidence:** HIGH

## Summary

This is an almost entirely in-repo investigation. Every component Phase 14 touches already exists, is typed, uses `next/image` with `fill`, and wraps the image in an aspect-ratio wrapper. The work is measurement + surgical edits, not new infrastructure.

Five components use `next/image`: `SiteHeader` (logo — out of scope), `HeroCarousel` (audit-only), `PersonCard` (resize + reshape), `PersonDetail` (resize + reshape), `OutreachCard` (audit-only). Homepage `Highlights` and `ResearchCard` use no imagery (icons only). There are no blur placeholders, no custom image loaders, no Playwright tests, and no tailwind.config file — the project runs pure Tailwind v4 defaults with CSS-first tokens in `src/app/globals.css`. Arbitrary-value utilities (`max-w-[240px]`, `aspect-[4/5]`) are already the convention: `h-[min(85svh,720px)]`, `md:aspect-[21/9]`, `aspect-[16/9]`, `max-w-[85vw]` all appear in the codebase today. There is no card-width token and none is warranted (the 240 px cap appears only on `PersonCard` and `PersonDetail`, with different semantics at each site).

Phase 6's RESEARCH.md already settled the Next.js 16 image ergonomics that apply here: `priority` is deprecated; `PersonCard` (below fold) gets neither `preload` nor `eager`; `PersonDetail` hero IS the LCP on its page and must keep `preload={true} loading="eager" fetchPriority="high"` after the resize. Current `sizes` strings can be calculated from the new 240 px cap + the (post-change) grid breakpoints: 1 col on mobile, 2 col at `sm`, 3 col at `lg`, 4 col at `xl` — but since the image *wrapper* caps at 240 px on all `lg+` breakpoints, the accurate sizes string collapses to `(min-width: 640px) 240px, 50vw` for most of the viewport range (the 2-col 50 % fallback covers the `sm`→`lg` band where the cell is wider than 240 px, keeping the srcset conservative).

**Primary recommendation:** Execute three surgical edits — PersonCard width/aspect + sizes string; PersonDetail hero width/aspect + grid-template + sizes string; add `xl:grid-cols-4` to `PeopleSection`. Audit-only on HeroCarousel, OutreachCard, and homepage highlights. Use arbitrary Tailwind values throughout (`max-w-[240px]`, `aspect-[4/5]`, `md:grid-cols-[180px_1fr]`). No new tokens, no new dependencies.

## Standard Stack

### Core (already installed, no change)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/image` | 16.2.4 | Responsive image optimization, srcset, lazy-load | Already the only image primitive in use |
| `tailwindcss` | 4.2.2 | Aspect-ratio + width utilities + responsive grid | Already the only styling primitive |
| `react` | 19.2.4 | Component runtime | — |

### Supporting (no new deps)

None. Phase 14 adds no libraries.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Arbitrary Tailwind value `max-w-[240px]` | Custom `--spacing-card` or `--max-w-card` theme token | CONTEXT.md explicitly prefers arbitrary value unless the 240 px cap appears in >2 places. It appears in 2: `PersonCard` wrapper and `PersonDetail` photo column. Arbitrary is correct. |
| `aspect-[4/5]` utility | Fixed `width={x} height={y}` on `<Image>` without `fill` | `fill` is already the project pattern and works with the wrapper-defined aspect ratio. Switching to explicit w/h breaks consistency. |
| Add `xl:grid-cols-4` to PeopleSection | Increase page container to `max-w-7xl` (1280 px) | CONTEXT already decided NOT to grow container — 4-col @ xl inside existing `max-w-6xl` (1152 px) wrapper means ~258 px cells, cards cap at 240 px and center. Correct per decision. |

**Installation:** None required — use existing dependencies.

## Architecture Patterns

### Current codebase conventions (established in Phases 1–13)

**Image primitive pattern** (applies to all 5 `next/image` usages):

```tsx
<div className="relative w-full aspect-[X/Y] bg-surface-alt">
  <Image
    src="/path.jpg"
    alt=""
    fill
    sizes="<responsive string>"
    className="object-cover"
    // LCP-only: preload={true} loading="eager" fetchPriority="high"
  />
</div>
```

**Always `fill`. Always object-cover. Always an aspect-ratio wrapper.** No exceptions currently exist in the repo; do not introduce one.

**Tailwind v4 defaults** (confirmed — no override in the project):

| Breakpoint | Min width |
|-----------|-----------|
| `sm` | 640 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |
| `2xl` | 1536 px |

Source: tailwindcss.com/docs/responsive-design (fetched 2026-04-20) + verified no `@theme { --breakpoint-* }` or tailwind.config.* exists in the repo.

### Pattern 1: Capped card inside responsive grid
**What:** Parent grid divides space; card caps its own width; remainder becomes breathing room in the cell (centered via `mx-auto`).
**When to use:** PersonCard at ≤240 px when cell width exceeds 240 px (all `lg+` breakpoints).
**Example:**
```tsx
// Parent: PeopleSection.tsx
<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {people.map(p => <PersonCard ... />)}
</div>

// Child: PersonCard.tsx — self-caps and centers
<Link
  href={...}
  className="group block rounded-md bg-surface-alt overflow-hidden ... max-w-[240px] mx-auto w-full"
>
  <div className="relative w-full aspect-[4/5] bg-surface">
    <Image ... />
  </div>
  ...
</Link>
```

### Pattern 2: Fixed-width photo column in a 2-col `grid-template` at `md+`
**What:** `grid-cols-[FIXEDpx_1fr]` inside `md:` variant; mobile stays `grid-cols-1`.
**Current implementation** (`PersonDetail.tsx:76`): `grid-cols-1 gap-8 md:grid-cols-[240px_1fr]`.
**Phase 14 change:** Swap `240px` to `180px` in the grid template; wrapper becomes `aspect-[4/5]` (so a 180 px wide photo is 225 px tall). Bio column automatically widens by 60 px.
**Example:**
```tsx
<header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr] md:items-start">
  <div className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt">
    <Image ... fill sizes="(min-width: 768px) 180px, 100vw" ... />
  </div>
  <div>{/* bio */}</div>
</header>
```

### Pattern 3: `next/image` `sizes` attribute with `fill`
**What:** `sizes` MUST be set when using `fill`; controls the generated srcset.
**Source (Next.js 16 docs, fetched 2026-04-20):**
> "If `sizes` is missing, the browser assumes the image will be as wide as the viewport (`100vw`). This can cause unnecessarily large images to be downloaded."
> "With `sizes`: Next.js generates a full `srcset` (e.g. 640w, 750w, etc.), optimized for responsive layouts."

**Next.js default `deviceSizes` array:** `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`.
**Next.js default `imageSizes` array:** `[32, 48, 64, 96, 128, 256, 384]` (used only when `sizes` indicates < full viewport width).
Combined pool when `sizes` is given: `[32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]`.

**Implication for PersonCard:** With `sizes=(min-width: 640px) 240px, 100vw`, at DPR 2 the browser picks 480 px-wide candidate — nearest pool sizes are 384 or 640. Today's `33vw` string at lg (~345 px @ 1024 vw) resolves to 384 or 640 depending on DPR, oversized compared to the new 240 px cap. Updating `sizes` is a real byte saving, not cosmetic.

### Pattern 4: LCP image props on PersonDetail hero (carry-over from Phase 6)
**Source:** Phase 6 RESEARCH.md Pattern 3 (image-role matrix, fetched 2026-04-20):
> "Person portrait in PersonDetail (above fold, person pages): `preload={true} loading="eager" fetchPriority="high"` (IS the LCP on person pages)"

Current `PersonDetail.tsx:78-88` already implements this. Phase 14 must PRESERVE these props while changing `sizes` and wrapper aspect ratio.

### Anti-Patterns to Avoid

- **Don't add a `--card-width` token.** 240 px appears exactly twice (PersonCard cap, PersonDetail template). Below the "> 2 places" threshold per CONTEXT.md. Arbitrary Tailwind values are the established convention here (`max-w-[85vw]`, `h-[min(85svh,720px)]`, etc.).
- **Don't change `PersonCard` to use fixed `width/height` props** — breaks the `fill`+wrapper pattern used everywhere else and removes srcset generation benefits.
- **Don't add `preload` to `PersonCard` images.** They are below-fold on mobile, and most person cards are not LCP candidates. Phase 6 verified: People list page LCP is the `<h1>`, not the cards.
- **Don't use `priority` prop.** Deprecated in Next.js 16 (migrated in Phase 6). Use `preload + loading="eager" + fetchPriority="high"` combo.
- **Don't set `sizes="240px"` alone** — that's the desktop-only width. The fallback for viewports < 640 px must give the browser a real width. Use a comma-separated media-query list.
- **Don't remove `bg-surface-alt` / `bg-surface` on the wrapper** — it's the load-time placeholder. No blur/shimmer is set up anywhere in the repo; the solid background is the fallback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aspect-ratio enforcement | `padding-top: 125%` hack wrapper | `aspect-[4/5]` utility | Tailwind v4 ships `aspect-ratio` utilities; browser-native CSS `aspect-ratio` has ~98 % support |
| Responsive srcset | Manual `<picture>` with custom media queries | `next/image` `sizes` prop + default `deviceSizes` | Next already generates the srcset; just get `sizes` right |
| Image placeholder at load | Shimmer / skeleton component | `bg-surface-alt` on the wrapper (current pattern) | Project has zero skeleton infra, wrapper bg is visually adequate and CLS-free |
| Visual regression testing | Add Playwright / Percy | Manual DevTools responsive mode at 375/768/1024/1440 | Phase 13 verification did this successfully; no test infra exists; adding one is out of scope for a media-sizing phase |
| Layout-shift prevention | Custom JS | `aspect-[X/Y]` on wrapper fixes the box size *before* image loads | CLS=0 is already the Phase 6 verified state |

**Key insight:** This phase is entirely executable with existing primitives. Introducing any new tool (token, loader, test runner) is scope creep.

## Common Pitfalls

### Pitfall 1: Changing aspect ratio triggers CLS if wrapper and image disagree

**What goes wrong:** If the wrapper gets `aspect-[4/5]` but `<Image>` still has `fill` WITHOUT `object-cover`, the image may render at its native ratio and briefly shift once loaded. Or if `fill` is dropped accidentally, `<Image>` needs `width/height` props.

**Why it happens:** Next.js `fill` fills the parent; parent's aspect ratio controls box geometry; `object-cover` crops the content to fill without distorting. All three must agree.

**How to avoid:** Keep the triple `fill` + parent `aspect-[4/5]` + `object-cover`. Do not change Image props structure — only update `sizes` and the parent's `aspect-[...]` utility.

**Warning signs:** Visible "snap" at load; layout shift score > 0.1; image appears letterboxed or stretched.

**Verification:** DevTools → Performance → Reload → check CLS (unchanged from Phase 6's baseline of 0).

### Pitfall 2: `sizes` string lies — browser downloads wrong srcset candidate

**What goes wrong:** Current PersonCard has `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"`. After the change, card caps at 240 px at `lg+`, but 33vw at 1024 = 338 px, at 1280 = 422 px — the browser picks 640 px srcset candidate. Byte waste.

**Why it happens:** `sizes` is a *hint*. The browser picks the next-larger srcset source relative to the advertised width at the matched media query. A too-large `sizes` → too-large download.

**How to avoid:** Once the card caps at 240 px, the `sizes` string at lg+ becomes a fixed 240 px: `(min-width: 640px) 240px, 100vw`. Why 640 px as the breakpoint in the string, not 1024 px? Because at `sm` (640–1024 px) the grid is 2-col, so card cell width = ~(container−gap)/2. For a 640 px viewport with page `max-w-6xl` and `px-6`: content is ~592 px, gap 24 px → cell ≈ 284 px. 240 px cap applies, so 240 px is correct there too. The simpler string `(min-width: 640px) 240px, 100vw` serves the 240 px crop for every breakpoint where a card is narrower than viewport, and 100 vw for the single-col mobile case.

**Alternate form** if being more defensive about the `sm` band before the cap kicks in cleanly: `(min-width: 1024px) 240px, (min-width: 640px) 50vw, 100vw` — but that pays ~2× bytes in the 640–1023 px range for no visual benefit, since the card still caps at 240 px.

**Warning signs:** DevTools Network tab → filter Images → hover URL → check `?w=...` query param. Should resolve to 256 px or smaller (from `imageSizes` pool) on a 1× DPR desktop. On 2× DPR it should pick 640 px at most — that's the lowest pool value ≥ 480 px. Not ideal but unavoidable with the default `deviceSizes` pool (no 512 px entry).

**Accept:** At 2× DPR, srcset will pick 640 px source for a 240 px render — still ~4× smaller than the current 33vw @ 1280 vw = 422 px × 2× DPR = 844 px → picks 1080 px source.

### Pitfall 3: PersonDetail LCP regression from aspect-ratio change

**What goes wrong:** Switching the hero wrapper from `aspect-square` (240×240) to `aspect-[4/5]` (180×225) is a 30 % pixel area reduction — but if `sizes` stays at `(min-width: 768px) 240px, 100vw` the browser downloads the 240 px candidate. Correct is `(min-width: 768px) 180px, 100vw`.

**Why it happens:** Same as Pitfall 2 but with bigger LCP stakes — this image has `preload={true}` which inserts a `<link rel="preload" imagesrcset=... imagesizes=...>` into the `<head>`. The preloaded srcset candidate is picked from the `imagesizes` hint.

**How to avoid:** Update `sizes="(min-width: 768px) 180px, 100vw"` in the same edit as the aspect ratio change. Verify the `<link rel="preload">` in the rendered HTML points at a 180 px-scaled source (inspect `view-source:` on a built page).

**Warning signs:** Lighthouse LCP regresses; Network waterfall shows oversized hero.

### Pitfall 4: HeroCarousel `md:aspect-[21/9]` — do not shrink without measuring

**What goes wrong:** The hero is intentionally dominant (CONTEXT.md: "Hero is the one place where imagery is supposed to dominate — don't shrink it unless the audit finds a concrete regression"). Casually reducing `aspect-[21/9]` to something taller/shorter can break LCP (preload candidate changes) and contrast (scrim math was tuned for current aspect).

**Why it happens:** Phase 6 RESEARCH.md already fine-tuned scrim gradient, text shadows, and `min-height` math against the current aspect. Touching these without re-verification cascades.

**How to avoid:** Phase 14 is AUDIT ONLY on HeroCarousel per CONTEXT. The plan should explicitly NOT include a HeroCarousel edit task unless the audit produces a concrete failure at 375 / 768 / 1024 / 1440 px.

**Warning signs:** Audit checklist item: "at viewport W, H1 text wraps awkwardly OR hero min-height cuts scrim text OR image crops a face". If none of these, leave HeroCarousel alone.

### Pitfall 5: `PersonDetail` mobile stacking with 180 px photo

**What goes wrong:** At < 768 px (`md`), grid collapses to 1-col. Photo wrapper is `w-full aspect-[4/5]` — that's a 375 × 468 px block on iPhone SE. Way too big for a mobile hero — defeats Phase 14 goal.

**Why it happens:** Mobile layout uses `grid-cols-1` + `w-full`. The 180 px template only applies at `md+` via `md:grid-cols-[180px_1fr]`.

**How to avoid:** CONTEXT.md leaves mobile layout to Claude's discretion. Two acceptable options:
- **(A) Cap width on mobile too:** Add `max-w-[180px]` to the photo wrapper → photo renders as a 180 × 225 px block, left-aligned or centered, above the bio.
- **(B) Keep current mobile full-width:** Acceptable if the audit at 375 px shows it still reads balanced (but it historically did not — this is partially what MEDIA-02 is fixing).

**Recommendation:** Option (A) with `mx-auto` or default left-align. Verifiable at 375 px in DevTools.

**Warning signs:** At 375 px, photo eats > 40 % of the above-fold area; bio doesn't start until a full scroll.

### Pitfall 6: OutreachCard grid-level audit missed because the card itself is fine

**What goes wrong:** OutreachCard's `aspect-[16/9]` + `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` is mathematically fine for a 3-col grid inside `max-w-6xl`. But if the *page* shifts to 2-col (e.g., very long titles) the card stretches, photo ratio holds but width isn't actually 33vw anymore.

**Why it happens:** OutreachGrid uses the same breakpoint pattern as PeopleSection: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — there's no 4-col variant planned here. So 33vw is correct at lg+.

**How to avoid:** Audit-only per CONTEXT. Verify at 1024 and 1440 that the card photo doesn't visually dominate the text block beneath it. If it does, the fix is to crop the source images or switch to `aspect-[3/2]` — but only after the audit confirms a concrete issue.

## Code Examples

### PersonCard — full change set

```tsx
// src/components/people/PersonCard.tsx — AFTER
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

interface PersonCardProps {
  slug: string;
  name: string;
  role: string;
  photo?: string;
}

export function PersonCard({ slug, name, role, photo }: PersonCardProps) {
  return (
    <Link
      href={{ pathname: '/people/[slug]', params: { slug } }}
      className="group block rounded-md bg-surface-alt overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring max-w-[240px] w-full mx-auto"
    >
      <div className="relative w-full aspect-[4/5] bg-surface">
        {photo ? (
          <Image
            src={`/${photo}`}
            alt=""
            fill
            sizes="(min-width: 640px) 240px, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-ink-subtle font-serif text-4xl"
          >
            {name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-xl font-semibold group-hover:underline underline-offset-4 decoration-accent">
          {name}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{role}</p>
      </div>
    </Link>
  );
}
```

Changes from current (`src/components/people/PersonCard.tsx`):
- Line 15: add `max-w-[240px] w-full mx-auto` to the outer `<Link>` className.
- Line 17: `aspect-square` → `aspect-[4/5]`.
- Line 23: `sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"` → `sizes="(min-width: 640px) 240px, 100vw"`.

### PeopleSection — add xl:4-col

```tsx
// src/components/people/PeopleSection.tsx:29 — AFTER
<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

One addition: `xl:grid-cols-4`.

### PersonDetail — hero photo change set

```tsx
// src/components/people/PersonDetail.tsx:76-89 — AFTER
<header className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr] md:items-start">
  <div className="relative w-full aspect-[4/5] rounded-md overflow-hidden bg-surface-alt max-w-[180px] mx-auto md:mx-0">
    {person.photo ? (
      <Image
        src={`/${person.photo}`}
        alt=""
        fill
        sizes="(min-width: 768px) 180px, 180px"
        className="object-cover"
        preload={true}
        loading="eager"
        fetchPriority="high"
      />
    ) : (
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-ink-subtle font-serif text-6xl"
      >
        {person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
      </div>
    )}
  </div>
  {/* ...bio column unchanged (it naturally widens because grid template freed 60 px)... */}
</header>
```

Changes from current (`src/components/people/PersonDetail.tsx`):
- Line 76: `md:grid-cols-[240px_1fr]` → `md:grid-cols-[180px_1fr]`.
- Line 77: `aspect-square` → `aspect-[4/5]`; add `max-w-[180px] mx-auto md:mx-0` (Pitfall 5 mobile fix).
- Line 83: `sizes="(min-width: 768px) 240px, 100vw"` → `sizes="(min-width: 768px) 180px, 180px"` (if mobile cap applied) OR `"(min-width: 768px) 180px, 100vw"` (if mobile stays full-width — not recommended).
- Lines 85-87 (`preload`/`loading`/`fetchPriority`): PRESERVE verbatim. This is the LCP on person pages.

### HeroCarousel — audit-only

No code change unless audit surfaces a specific regression. If it does:
- File: `src/components/home/HeroCarousel.tsx:96`
- Current: `className="relative w-full h-[min(85svh,720px)] md:h-auto md:aspect-[21/9] overflow-hidden rounded-md"`
- Leave as-is per CONTEXT unless a specific break at 375/768/1024/1440 is documented.

### OutreachCard — audit-only

No code change planned. Current state (`src/components/outreach/OutreachCard.tsx:26,31`):
- Wrapper: `aspect-[16/9]` ✓
- `sizes`: `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` ✓

Verify at 1024/1440 in `/outreach` that card photo doesn't visibly dominate the text block. If it does, scope for a follow-up; NOT part of Phase 14.

## Repo Inventory — Every Image Surface (MEDIA-04 audit list)

Complete enumeration of `next/image` usages and what Phase 14 does with each:

| # | File | Component | Current wrapper | Current `sizes` | Phase 14 action |
|---|------|-----------|-----------------|-----------------|-----------------|
| 1 | `src/components/layout/SiteHeader.tsx:77-86` | `SiteHeader` | Logo 80×80 `className="h-16 w-auto"` | — (fixed w/h, no srcset) | **No change.** Out of scope. |
| 2 | `src/components/home/HeroCarousel.tsx:121-136` | `HeroCarousel` slides | `h-[min(85svh,720px)] md:h-auto md:aspect-[21/9]` | `100vw` | **Audit only.** MEDIA-03. |
| 3 | `src/components/people/PersonCard.tsx:19-25` | `PersonCard` photo | `aspect-square` | `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` | **Resize + reshape.** MEDIA-01, MEDIA-05. |
| 4 | `src/components/people/PersonDetail.tsx:79-88` | `PersonDetail` hero | `aspect-square` in `md:grid-cols-[240px_1fr]` | `(min-width: 768px) 240px, 100vw` | **Resize + reshape.** MEDIA-02, MEDIA-05. |
| 5 | `src/components/outreach/OutreachCard.tsx:27-33` | `OutreachCard` photo | `aspect-[16/9]` | `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` | **Audit only.** MEDIA-04. |

**Homepage imagery inventory (MEDIA-04):**

| # | Surface | Uses `next/image`? | Phase 14 action |
|---|---------|---------------------|-----------------|
| 1 | HeroCarousel (3 portada slides) | Yes (row 2 above) | Audit only |
| 2 | `Highlights` section (3 highlight cards) | No — text-only | No action |
| 3 | `PartnerStrip` (affiliation names) | No — text-only | No action |
| 4 | Intro `<section>` prose | No | No action |

**The homepage has exactly ONE image surface: the HeroCarousel.** MEDIA-04 collapses to auditing HeroCarousel at the four viewport widths; there is no News/Research highlight imagery in the project today. This is an important finding — the plan should call this out explicitly so MEDIA-04 doesn't turn into a search-for-missing-images task.

**Non-`next/image` surfaces (out of scope):**
- `public/` SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — framework placeholders, not referenced anywhere.
- OG image (`/Portadas/portada_1.jpg`) — referenced via `metadata.ts`, not rendered on page.
- `ResearchCard` uses `lucide-react` icons, not raster images.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` prop on LCP images | `preload={true} loading="eager" fetchPriority="high"` | Next.js 16 (Oct 2025) | Already migrated in Phase 6; Phase 14 must preserve. |
| `padding-top` aspect-ratio hack | `aspect-[X/Y]` Tailwind utility (native CSS `aspect-ratio`) | Tailwind 3+ / browser support stable since 2021 | Use the utility; never introduce padding-hack. |
| Hard-coded `width`/`height` for responsive | `fill` + parent aspect-ratio wrapper + `sizes` string | Established convention here since Phase 1 | Keep consistent. |
| `srcset` attribute written by hand | `next/image` auto-generates from `deviceSizes`/`imageSizes` + `sizes` hint | Next.js 10+ | Relied on fully. |

**Deprecated/outdated:**
- `priority` prop — deprecated in Next.js 16. Already gone from this repo (Phase 6 migration). Do not reintroduce.
- Custom `padding-top: %` aspect-ratio hacks — never used here. Do not introduce.

## Open Questions

1. **Does 240 px card cap interact with translated (EN) text overflowing the narrower card?**
   - What we know: `PersonCard` renders name (`font-serif text-xl font-semibold`) and role (`text-sm text-ink-muted`). At 240 px with `p-4` → text width ~208 px. Long Spanish role strings like "Investigador Principal — UBA / CONICET" might wrap to 3 lines where they previously fit in 2.
   - What's unclear: Whether any person's role, at the new 240 px cap, creates awkward wrapping or card-height inconsistency across the grid.
   - Recommendation: Plan should add a checklist item to visually scan `/es/personas` and `/en/people` at 1024/1280 px for wrap awkwardness. If found, either (a) shorten role strings in content, or (b) let cards be slightly uneven (already the case today if bios vary).

2. **Should `PersonCard` without a `photo` field use the same 4:5 aspect for the initials placeholder?**
   - What we know: Current placeholder branch uses the same wrapper (`aspect-square`), so moving wrapper to `aspect-[4/5]` automatically reshapes the initials tile too.
   - What's unclear: Whether initials-only tiles visually read well as 4:5 portrait (they currently read as centered monograms in a square).
   - Recommendation: Accept the shape change — visual consistency across cards beats tile-type consistency. No extra branching needed.

3. **Does Next.js generate a 480 px or 512 px srcset candidate for a 240 px @ 2× DPR request?**
   - What we know: Default `deviceSizes` = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]; `imageSizes` = [32, 48, 64, 96, 128, 256, 384]. Combined when `sizes` is set: includes 384 and 640 but nothing between.
   - What's unclear: At 2× DPR on a lg+ screen, browser picks between 384 (too small for 480 px render) and 640 (oversized). Likely picks 640 per "next-larger" rule.
   - Recommendation: Accept 640 px worst-case candidate. Still ~half the bytes of current 1080 px candidate. Do NOT customize `imageSizes` in `next.config.ts` for this one component — global config change for a localized optimization is over-engineering.

## Sources

### Primary (HIGH confidence)
- `next/image` official docs, v16.2.4, fetched 2026-04-20 from https://nextjs.org/docs/app/api-reference/components/image — `sizes` prop behaviour, `fill` + parent-size relationship, `deviceSizes`/`imageSizes` default arrays, aspect-ratio inference, `preload` vs deprecated `priority`.
- Tailwind CSS v4 responsive design docs, fetched 2026-04-20 from https://tailwindcss.com/docs/responsive-design — default breakpoint pixel values (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).
- In-repo source files (read in full): `src/components/people/PersonCard.tsx`, `src/components/people/PersonDetail.tsx`, `src/components/home/HeroCarousel.tsx`, `src/components/outreach/OutreachCard.tsx`, `src/components/layout/SiteHeader.tsx`, `src/components/people/PeopleSection.tsx`, `src/components/people/PeoplePlainSection.tsx`, `src/components/home/Highlights.tsx`, `src/components/home/PartnerStrip.tsx`, `src/app/globals.css`, `src/app/[locale]/page.tsx`, `src/app/[locale]/people/page.tsx`, `src/app/[locale]/people/[slug]/page.tsx`, `next.config.ts`, `package.json`.
- In-repo prior research: `.planning/phases/06-polish-a11y-performance/06-RESEARCH.md` (Patterns 3 and 5 — `priority` → `preload` migration and LCP candidate matrix).
- In-repo prior research: `.planning/phases/13-design-tokens-layout-rhythm/13-RESEARCH.md` (container widths, spacing tokens — confirms `max-w-6xl` for grid pages, `py-12` sub-sections).
- In-repo design system: `design-system/cosmology-group-uba/MASTER.md` (container-width convention; media sizing not yet documented — this phase will add it).

### Secondary (MEDIUM confidence)
- None required — all critical claims trace to primary sources above.

### Tertiary (LOW confidence)
- None. All findings are either verified by in-repo evidence or by freshly-fetched official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; all current usage patterns read directly from source files at the line level.
- Architecture: HIGH — existing patterns (aspect-ratio wrapper + `fill` + `sizes` + `object-cover`) are consistent across all 4 in-scope components today; Phase 14 edits stay inside the pattern.
- Pitfalls: HIGH — Pitfalls 1, 3 verified against Next.js 16.2.4 official docs (CLS, preload, `sizes` semantics); Pitfalls 2, 5, 6 verified by reading the actual Tailwind breakpoint math + current grid definitions in-repo.
- Inventory completeness: HIGH — grepped all `<Image` / `next/image` usages (5 instances total, all enumerated); verified Highlights + PartnerStrip + ResearchCard carry no imagery.

**Research date:** 2026-04-20
**Valid until:** ~2026-07-20 (Next.js 16.x is current stable; Tailwind 4.2.x is current stable; nothing in the research depends on unreleased or beta behaviour).
