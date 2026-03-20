# Client Handoff Documentation Template

> Copy this template and fill it in for each client delivery. Store the completed version in the project's root or docs/ folder.

---

# {{Project Name}} — Handoff Documentation

**Delivered by**: {{Your name / company}}
**Delivery date**: {{YYYY-MM-DD}}
**Client contact**: {{Name, email}}
**Support contact**: {{Your email / phone for post-launch support}}

---

## 1. Site Overview

**Live URL**: {{https://example.com}}
**Staging URL**: {{https://staging.example.com}} (if applicable)
**Repository**: {{GitHub/GitLab URL}}

**What the site does**: {{1-2 sentence description}}

---

## 2. Access & Credentials

| Service | URL | Username/Email | Notes |
|---------|-----|---------------|-------|
| Hosting (Vercel/Netlify) | {{URL}} | {{email}} | {{Owner account / team invite}} |
| Domain registrar | {{URL}} | {{email}} | {{Where DNS is managed}} |
| GitHub/GitLab | {{URL}} | {{email}} | {{Repo access level}} |
| CMS (if any) | {{URL}} | {{email}} | {{Admin credentials}} |
| Analytics | {{URL}} | {{email}} | {{Google Analytics / Plausible / etc.}} |
| Email service | {{URL}} | {{email}} | {{SendGrid / Resend / etc.}} |
| External APIs | {{service name}} | {{key location}} | {{Where API keys are stored}} |

**Important**: Never share credentials via email or chat. Use a password manager or secure vault.

---

## 3. How to Update Content

### Updating text/copy
{{Describe where text content lives — CMS, JSON files, MDX, etc.}}
{{Step-by-step instructions for making a text change}}

### Updating images
{{Where images are stored, what formats/sizes are expected}}
{{How to replace an image}}

### Adding new pages/sections
{{Whether the client can do this themselves or needs developer help}}

### Updating prices/products (if applicable)
{{Where product data lives, how to modify it}}

---

## 4. How Deployment Works

**Current setup**: {{e.g., "Push to main branch on GitHub auto-deploys to Vercel"}}

**To make a change live**:
1. {{Step 1 — e.g., "Edit the file in GitHub or your local editor"}}
2. {{Step 2 — e.g., "Commit and push to main branch"}}
3. {{Step 3 — e.g., "Vercel builds and deploys automatically in ~60 seconds"}}
4. {{Step 4 — e.g., "Verify the change at the live URL"}}

**To roll back a change**:
{{How to revert to a previous version — e.g., "Go to Vercel dashboard → Deployments → click the previous deployment → Promote to Production"}}

---

## 5. Post-Launch Checklist

Run this checklist within 48 hours of going live:

### DNS & SSL
- [ ] Domain resolves correctly (www and non-www)
- [ ] HTTPS works (no mixed content warnings)
- [ ] SSL certificate is valid and auto-renewing

### Performance
- [ ] PageSpeed Insights score > 90 on mobile
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1)
- [ ] Images are optimized (WebP/AVIF, lazy-loaded)
- [ ] No render-blocking resources

### SEO
- [ ] Title and meta description on every page
- [ ] Open Graph tags for social sharing
- [ ] Favicon and apple-touch-icon set
- [ ] robots.txt allows indexing
- [ ] Sitemap.xml generated and submitted to Google Search Console
- [ ] Canonical URLs set (no duplicate content)

### Analytics
- [ ] Analytics tracking code is firing
- [ ] Goal/conversion tracking set up (if applicable)
- [ ] Cookie consent banner (if required by jurisdiction)

### Functionality
- [ ] All forms submit correctly (contact, signup, checkout)
- [ ] Email notifications are received
- [ ] Mobile layout works on iPhone and Android
- [ ] All links work (no 404s)
- [ ] Dark mode / light mode both look correct

### Security
- [ ] No API keys exposed in client-side code
- [ ] Environment variables set in hosting platform (not committed to repo)
- [ ] CORS configured correctly
- [ ] Rate limiting on API routes (if applicable)

---

## 6. Ongoing Maintenance

### What the client is responsible for
- {{Content updates via CMS or file edits}}
- {{Monitoring analytics}}
- {{Renewing domain registration}}

### What requires developer help
- {{Feature additions}}
- {{Dependency updates}}
- {{Infrastructure changes}}
- {{Bug fixes beyond content issues}}

### Support terms
- **Included**: {{e.g., "30 days of bug fixes after launch"}}
- **Hourly rate for additional work**: {{rate}}
- **Response time**: {{e.g., "24 hours for critical issues, 48 hours for non-critical"}}
- **How to request changes**: {{e.g., "Email support@yourcompany.com with a description and screenshot"}}

---

## 7. Technical Reference

### Stack
- **Framework**: {{Next.js 15 / Nuxt 3 / etc.}}
- **Language**: {{TypeScript}}
- **Styling**: {{Tailwind v4}}
- **Hosting**: {{Vercel}}
- **Database**: {{none / Supabase / Prisma+Postgres / etc.}}
- **CMS**: {{none / Sanity / Contentful / etc.}}

### Key files
| File | Purpose |
|------|---------|
| {{path}} | {{description}} |
| {{path}} | {{description}} |

### Environment variables
| Variable | Purpose | Where to set |
|----------|---------|-------------|
| {{VAR_NAME}} | {{what it controls}} | {{Vercel dashboard / .env.local}} |

---

*Generated from client-handoff template v1.0*
