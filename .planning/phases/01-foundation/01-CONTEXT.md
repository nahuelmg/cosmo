# Phase 1: Foundation - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

The project boots end-to-end as a bilingual Next.js app with a locked design system and i18n routing. This phase delivers the four foundational pillars that every subsequent phase consumes:

1. Next.js scaffold (App Router, TypeScript strict, Tailwind v4).
2. Locked design system from `ui-ux-pro-max` materialised as OKLCH tokens in `globals.css`.
3. next-intl routing with Spanish default and English toggle.
4. Self-hosted (or next/font-pre-fetched) typography without FOUT/FOIT.

Content files, layout chrome, pages, SEO, and a11y audits are explicitly OUT — those belong to Phases 2–6.

</domain>

<decisions>
## Implementation Decisions

### Palette character
- **Warm-academic** direction (Nature / Oxford leaning) — NOT cool-institutional, NOT austere monochrome, NOT UBA-blue-forward.
- Off-white / ivory base, muted warm accent. Cosmology "deep-space navy" aesthetic is rejected — it reads AI-generic per project constraints.
- **Background ladder**: white primary + ONE subtle alternate surface (off-white/ivory) for alternating sections and cards. No third tier.
- **Borders & dividers**: none. Hierarchy is carried by typography and whitespace alone. No hairline rules, no card borders, no section separators. Very Nature long-form.
- `ui-ux-pro-max` should be invoked with `--design-system --persist -p "Cosmology Group UBA"` against a query that encodes: *academic / institutional / warm-minimal / serif-headings / whitespace-driven / scholarly*. Reject outputs that include gradients, coloured gradients over imagery, neon accents, or dark-mode-first palettes.

### Accent usage — Claude's discretion
- User delegated. Apply restraint: accent should surface on links, focus ring, active-nav underline, and at most one additional chrome element (e.g. year heading in Publications, card rule in Highlights). Not on body prose, not as background fills.
- Accent colour comes from `ui-ux-pro-max` palette. If output suggests multiple accents, pick ONE and retire the rest.

### Typography pairing
- **Serif display + sans body** (Nature-leaning). NOT all-sans, NOT serif-throughout, NOT sans-display+serif-body.
- **Body feel: dense and compact** — body size 15–16px, line-height ~1.45–1.5. Information-dense, not airy.
- **Display scale: restrained** — type scale ratio 1.2–1.25, H1 ~28–32px. Editorial calm, not hero-splash.
- **Font families: ui-ux-pro-max chooses.** Do not hardcode family names in Phase 1 research. Constraints passed to the tool:
  - Serif for H1–H4; sans for body, captions, UI labels.
  - Both families must ship Latin, Latin-Extended, AND Greek subsets (see Font delivery below).
  - Open-source license (OFL, Apache) — no paid foundries.
  - Avoid system-default pairings (Georgia/Helvetica) — we want a *chosen* aesthetic.

### i18n URL contract
- **Always-prefix**: every route lives under `/es/*` or `/en/*`. The bare `/` is a redirect, not a page. Per next-intl's `localePrefix: "always"`.
- **Root resolution**: `/` always redirects to `/es`. No Accept-Language sniffing, no cookie-first behaviour in Phase 1. Argentine-first, predictable, canonical-friendly.
- **Toggle behaviour**: clicking the language toggle preserves BOTH the current path AND query params (`/es/people/alice?foo=bar` → `/en/people/alice?foo=bar`). Required so Publications filter state survives a locale switch (PUBS-04).
- **Segment translation**: route segments translate between locales.
  - `/es/personas` ↔ `/en/people`
  - `/es/investigacion` ↔ `/en/research`
  - `/es/publicaciones` ↔ `/en/publications`
  - `/es/journal-club` ↔ `/en/journal-club` (keep the English term — it's the domain lexicon internationally, Spanish speakers recognise it)
  - `/es/divulgacion` ↔ `/en/outreach`
  - `/es/contacto` ↔ `/en/contact`
  - `/es/personas/[slug]` ↔ `/en/people/[slug]` (slugs identical, segment translated)
  - Implementation: next-intl `defineRouting` with a `pathnames` map. Language toggle MUST be pathname-aware — cannot string-replace `/es` with `/en`.

### Font delivery & subsets
- **Hosting — Claude's discretion.** Default to `next/font/google` if `ui-ux-pro-max` picks a Google Fonts family (Next auto-self-hosts at build, zero external requests in production, same privacy outcome as manual self-host with far less setup). Fall back to `next/font/local` + committed `.woff2` files only if the chosen family is not on Google Fonts.
- **Subsets: Latin + Latin-Extended + Greek** (non-negotiable).
  - *Latin-Extended* is required for European collaborator names (ř, č, ł, ğ, ø) even though user picked "Latin + Greek" — Latin-Extended was implicit in the "Latin + Latin-Extended" option and must ship.
  - *Greek* is required for inline cosmology notation (Λ, Ω, H₀, σ₈, χ²) in research descriptions and publication titles. Apply to BOTH serif display and sans body families so Greek letters don't switch visual style mid-sentence.
- **Weights — Claude's discretion.** Default: minimal (2 weights per family: Regular + Bold for body, Regular + Semibold for display). Add Medium only if `ui-ux-pro-max` outputs an explicit dependency on it. Prefer variable fonts if the chosen family ships one — single file, full range.
- **Delivery verification**: success-criterion #4 from ROADMAP.md ("Self-hosted fonts load without FOUT/FOIT on first paint; Latin + Latin-Extended subsets verified in DevTools") must extend to Greek — DevTools Coverage tab must show Greek subset loaded on any page that renders a Greek glyph.

</decisions>

<specifics>
## Specific Ideas

- **Visual references**: nature.com, Max Planck Institute portals, Perimeter Institute, IAS Princeton people pages. Project spec named Nature and Max Planck as the two north stars — Nature wins the tie where they diverge (warmer, more prose-forward).
- **Anti-references**: anything "AI-generic" (dark-mode-first SaaS landing pages, gradient blobs, glowing cosmic nebula backgrounds, animated starfields). Dark-mode is explicitly out of scope per PROJECT.md.
- **Cosmology ≠ space aesthetic**: the group studies cosmology, but the site is a *research-group institutional site*, not a planetarium. No dark cosmic visuals.
- **Argentine identity through content, not chrome**: we're nodding to UBA/FCEN/CONICET in the footer affiliations and logo strip, not in the palette. User explicitly rejected "Argentine institutional" palette option.
- **Typographic rhythm over chrome**: whitespace-only dividers mean line-length, vertical rhythm, and type-scale discipline do all the visual work. `ui-ux-pro-max` output should be judged on whether its type system can carry a page *alone*.
- **`design-system/MASTER.md` is the source of truth**: every token in `globals.css` must trace to a MASTER.md decision. If ui-ux-pro-max output contradicts a decision above, the decision above wins — edit MASTER.md or re-query before locking tokens.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Scope-creep candidates that did NOT come up but are worth explicitly flagging as out-of-Phase-1:
- Dark mode tokens (out of scope project-wide per PROJECT.md).
- Third locale (Portuguese, Italian) — would require revisiting the pathnames map; not on the roadmap.
- RTL support — zero current need; next-intl handles it if ever required.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-17*
