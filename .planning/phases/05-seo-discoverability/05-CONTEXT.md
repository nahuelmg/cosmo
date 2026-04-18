# Phase 5: SEO & Discoverability - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Every page in both locales exposes correct SEO metadata (title, description, canonical, hreflang), Open Graph + Twitter card imagery, Schema.org JSON-LD (ResearchOrganization at root, Person on each `/people/[slug]`, ScholarlyArticle per publication), plus `sitemap.xml` and `robots.txt` at the site root.

Visual design, content authoring, WCAG audit, and Core Web Vitals are explicitly out of scope (Phase 6 handles a11y + performance).

</domain>

<decisions>
## Implementation Decisions

### Social card imagery (OG / Twitter)
- **Per-page OG image strategy**:
  - **Home** → one of the `portada_*` carousel images (existing asset, zero new design work)
  - **`/people/[slug]`** → the member's portrait when `photo` is present; fall back to the shared portada when absent
  - **Other pages** (Research, Publications, Journal Club, Outreach, Contact, People list) → same shared portada fallback
- **Locale-matched OG content**: `/en/...` pages emit English OG title/description; `/es/...` pages emit Spanish. Matches I18N-02 (page copy localizes).
- **Group name stays canonical Spanish** inside OG titles regardless of locale — consistent with decision 02-01.
- No dynamic OG image generation in Phase 5 (deferred).

### Schema.org coverage
- **Root (every page)**: `ResearchOrganization` JSON-LD — group name (canonical Spanish), URL, UBA/FCEN/CONICET affiliations, contact email.
- **`/people/[slug]`**: `Person` JSON-LD — **full shape**: name, jobTitle, affiliation, description (bio), identifier (ORCID), sameAs (Google Scholar + optional links), email (obfuscated form), image (photo path when present), worksFor (pointing at the root ResearchOrganization).
- **Publications page**: `ScholarlyArticle` JSON-LD per entry — authors, headline (title), datePublished (year), publisher/isPartOf (journal), sameAs/identifier (arXiv + DOI).
- **NOT emitting** (this phase): `Event` for journal club sessions, `ItemList` for list pages. Deferred beyond Phase 5.
- **Validation**: manual — paste the deployed URL into Google's Rich Results Test after Vercel deploy. No build-time schema validator.

### Title & description style
- **Title template**: `"Grupo de Cosmología — {Page}"` (brand-first). Home page emits `"Grupo de Cosmología"` with no suffix.
- **Descriptions hand-authored per page** — stored as dedicated keys in `messages/es.json` and `messages/en.json`. One bespoke 150–160 char description per page in each locale.
- **Brand name stays `Grupo de Cosmología`** in English metadata too (canonical Spanish per decision 02-01).
- **No meta keywords** (`<meta name="keywords">` omitted entirely — Google ignores since 2009).

### Canonical domain
- **Canonical URL**: the Vercel preview URL (e.g., `cosmo.vercel.app` or whatever Vercel assigns) for now. When the group commits to a final domain, swap at a single source of truth.
- **Single source of truth**: put the canonical base URL in `src/config/site.ts` as `siteConfig.url` (or equivalent). Every `<link rel="canonical">`, hreflang alternate, OG URL, sitemap entry, and JSON-LD `url` field resolves from this constant.
- **hreflang x-default** points at the **Spanish (`/es`)** version — matches Argentine-first posture and existing decision 01-03 (`localeDetection: false`, `/` → `/es`).
- **Sitemap scope**: every static route + every `/people/[slug]` × both locales. Each URL entry lists `alternates.languages` (`es`, `en`, `x-default`). Comprehensive coverage.
- **robots.txt**: Claude's discretion — baseline is `User-agent: *` + `Allow: /` + `Sitemap: {siteUrl}/sitemap.xml`. Any preview-URL disallow logic left to the planner.

### Claude's Discretion
- Exact robots.txt shape beyond "allow all + point at sitemap" (including whether to gate Vercel preview deployments via `NEXT_PUBLIC_VERCEL_ENV` or similar).
- Next.js App Router `generateMetadata` patterns and how shared metadata cascades (root layout → locale layout → page).
- JSON-LD injection mechanism (inline `<script type="application/ld+json">` in layout/page vs helper component).
- Exact affiliation `@id` / `sameAs` URLs for UBA / FCEN / CONICET (Claude researches).
- Spanish + English copy drafts for the per-page descriptions — user reviews and edits as needed.

</decisions>

<specifics>
## Specific Ideas

- The canonical brand identity in metadata must stay Spanish even on `/en` pages — this is not a bug, it's a deliberate institutional-identity decision (see decision 02-01).
- Social previews on WhatsApp, Slack, and academic Twitter are the primary discovery surface — a group page linked in a Slack channel should show group name + tagline + nebula cleanly.
- Member portraits at 1200×630 may look awkward — planner should handle framing/letterboxing or fall back to the shared portada when the portrait doesn't compose well.
- Publications deserve rich schema because academic search (Google Scholar, institutional crawlers) is one of the group's primary discovery vectors.

</specifics>

<deferred>
## Deferred Ideas

- **Dynamic OG image generation** (per-page custom cards via `@vercel/og` or similar) — considered, rejected for Phase 5 in favor of static reuse.
- **Event Schema.org for journal club sessions** — considered; deferred beyond Phase 5.
- **ItemList Schema.org for list pages** — considered; deferred (mostly cosmetic SEO lift).
- **Build-time JSON-LD schema validator** — considered; deferred in favor of manual Google Rich Results Test post-deploy.
- **Meta keywords** — deliberately dropped (Google ignores since 2009).
- **Switching canonical domain to a group-owned URL** (e.g., `cosmologia.df.uba.ar`) — waiting on the group's commitment. One-config swap when ready.

</deferred>

---

*Phase: 05-seo-discoverability*
*Context gathered: 2026-04-18*
