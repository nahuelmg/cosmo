# Content Gap Checklist

> **When to use**: After processing the client folder with `client-intake.md`. Review what was extracted from their materials, then use this checklist to identify gaps and decide what to do about each one.

---

## Blocking — Cannot Start Phase 1

These must be resolved (obtained from client OR generated) before any build work begins.

- [ ] **Primary brand color** — at least one definitive color the client identifies with
  - _If missing_: Ask client for color preferences or "feeling" (professional, playful, bold, etc.), then use ui-ux-pro-max `--design-system` to generate a palette
- [ ] **Logo file** — SVG preferred, high-res PNG (1000px+, transparent bg) acceptable
  - _If missing_: Use text-based logo with brand font as placeholder; flag for client follow-up
- [ ] **Core value proposition** — what the business does, for whom, and why it matters (1-2 sentences)
  - _If missing_: Draft from whatever context exists (client folder, their current site, social media). Get client sign-off before building
- [ ] **Call-to-action** — what the site should drive visitors to do (book, call, buy, etc.)
  - _If missing_: Infer from business type. Confirm with client
- [ ] **Page list** — which pages the site needs
  - _If missing_: Default to Home / About / Services / Contact. Confirm with client
- [ ] **Contact info** — at minimum: email or phone number
  - _If missing_: Cannot launch a business site without this. Ask client directly

---

## Needed Before Launch — Build With Placeholders, Replace Before Deploy

- [ ] **Full color palette** — primary, secondary, accent, neutrals (hex codes)
  - _If missing_: Generate with ui-ux-pro-max `--design-system` from primary color
- [ ] **Typography** — font families for headings and body
  - _If missing_: Generate with ui-ux-pro-max `--design-system`; default to Inter + a complementary display font
- [ ] **Homepage headline + subheadline**
  - _If missing_: Write draft from value proposition. Mark for client review
- [ ] **Key benefits / features** — 3-5 bullet points for homepage
  - _If missing_: Draft from services list or business description
- [ ] **About text** — company story or mission (1-3 paragraphs)
  - _If missing_: Build with placeholder. Flag as required before launch
- [ ] **Service/product descriptions** — name + short description per item, price if public
  - _If missing_: Build cards with placeholder text. Flag as required
- [ ] **Hero image** — main banner (min 1920x1080, landscape)
  - _If missing_: Use curated stock photo (Unsplash/Pexels) matched to industry. Replace before launch if client has own photography
- [ ] **Product/service images** — one per item (min 800x600)
  - _If missing_: Stock photos or solid-color placeholder cards
- [ ] **Team photos** — headshots (min 400x400, consistent style)
  - _If missing_: Use initials/avatars as placeholder. Skip team section if not critical
- [ ] **Business hours**
  - _If missing_: Omit section, ask client
- [ ] **Physical address** (if brick-and-mortar)
  - _If missing_: Omit map section, ask client
- [ ] **Social media profile URLs**
  - _If missing_: Omit social links, ask client
- [ ] **Domain access** — registrar login or ability to update DNS
  - _If missing_: Can build and preview without it. Must resolve before deploy
- [ ] **Contact form destination** — email address for form submissions
  - _If missing_: Use the primary contact email. Confirm with client
- [ ] **Legal text** — privacy policy, terms if needed
  - _If missing_: Note as required for launch; client responsibility

---

## Nice to Have — Generate Alternatives If Missing

- [ ] **Brand guidelines document** — full style guide or brand manual
  - _If missing_: Build design system from logo + colors + font choices. No blocker
- [ ] **Reference sites** — 2-3 sites the client admires, plus competitors
  - _If missing_: Research competitors independently. Pick layout direction based on industry conventions
- [ ] **Anti-references** — sites or styles the client wants to avoid
  - _If missing_: Skip. Present first draft and iterate
- [ ] **Gallery / portfolio images**
  - _If missing_: Omit section or use stock. Add later when client provides
- [ ] **Video content** — YouTube/Vimeo links or raw files
  - _If missing_: Omit video sections. Not essential for most sites
- [ ] **Google Analytics account**
  - _If missing_: Set up new one during deploy phase
- [ ] **Google Search Console**
  - _If missing_: Set up during deploy phase
- [ ] **Newsletter / email service** — Mailchimp, ConvertKit, etc.
  - _If missing_: Build signup form UI, wire integration later
- [ ] **Booking system** — Calendly, Google Calendar, etc.
  - _If missing_: Use simple contact form as fallback. Integrate booking tool later
- [ ] **Payment processor** — Stripe, MercadoPago, etc.
  - _If missing_: Only relevant if e-commerce. Skip until needed
- [ ] **Chat widget preference** — WhatsApp button, Intercom, etc.
  - _If missing_: Default to WhatsApp button if client has WhatsApp business. Otherwise skip
- [ ] **Multi-language requirement**
  - _If missing_: Build single-language. Easier to add i18n later than to remove it
