# Skill Library

A collection of reusable Claude skills for web development projects. Each skill captures patterns, decisions, and lessons from real projects so Claude can apply them to new work.

## Directory Structure

```
skills/
├── web-dev-general/
│   ├── SKILL.md              # General methodology — ALWAYS read first
│   ├── prompt-patterns.md    # Effective prompt templates
│   └── templates/
│       ├── client-handoff.md # Delivery documentation template
│       └── project-tracker.md# Time and effort logging template
├── domains/
│   ├── dashboard-realtime/
│   │   └── SKILL.md          # Real-time data dashboards, charts, financial data
│   ├── landing-page/
│   │   └── SKILL.md          # [placeholder] Marketing / business sites
│   └── ecommerce/
│       └── SKILL.md          # [placeholder] Online stores, payments, carts
├── design/
│   └── README.md             # References ui-ux-pro-max for design decisions
└── README.md                 # This file
```

## How Claude Should Use These Skills

### Priority order (read in this sequence)

1. **`web-dev-general/SKILL.md`** — Always read first. Contains methodology, patterns, and standards that apply to every web project.

2. **`domains/{{matching-domain}}/SKILL.md`** — Read if the project matches a domain skill. Only one domain skill typically applies per project.

3. **ui-ux-pro-max** — Consult for all visual/UX design decisions. The general skill covers *technical* implementation of design tokens; ui-ux-pro-max covers *which* design choices to make.

4. **`prompt-patterns.md`** — Reference when structuring complex prompts or when a previous prompt didn't produce the expected result.

### When to read what

| Situation | Read |
|-----------|------|
| Starting any new project | `web-dev-general/SKILL.md` |
| Project involves dashboards or live data | + `domains/dashboard-realtime/SKILL.md` |
| Project involves a marketing/business site | + `domains/landing-page/SKILL.md` |
| Project involves payments/products | + `domains/ecommerce/SKILL.md` |
| Making design decisions | + ui-ux-pro-max |
| Delivering to a client | `templates/client-handoff.md` |
| Estimating effort/pricing | `templates/project-tracker.md` |
| Prompt isn't producing good results | `prompt-patterns.md` |

---

## How to Add a New Domain Skill

After completing a project in a new domain, extract a domain skill using this process:

### Step 1: Create the directory

```
skills/domains/{{domain-name}}/SKILL.md
```

### Step 2: Run the extraction prompt

Send this to Claude at the end of the project:

```
Review the entire repository and extract everything specific to
{{domain description}} into a domain skill.

Include:
- Domain-specific data models and type patterns
- API integrations unique to this domain
- UI patterns specific to this type of application
- Common calculations or business logic
- Known gotchas and workarounds
- Library choices and why they were made

Write to: skills/domains/{{domain-name}}/SKILL.md

Format: Match the structure of skills/domains/dashboard-realtime/SKILL.md
(sections with clear headers, code examples, decision tables, known issues).

Do NOT duplicate anything already in skills/web-dev-general/SKILL.md —
only domain-specific knowledge.
```

### Step 3: Update the general skill

Also ask Claude:

```
Review skills/web-dev-general/SKILL.md and check if this project
revealed any NEW general patterns not yet captured. If so, add them.

Specifically check:
- Any new entries for "Common Issues and Fixes"
- Any new component architecture patterns
- Any new state management patterns
- Any deployment gotchas
- Any new technology preferences

Don't duplicate — only add genuinely new knowledge.
```

### Step 4: Log the project

Fill in `templates/project-tracker.md` with actual effort data so future estimates improve.

### Step 5: Update this README

Add the new domain to the directory structure and "When to read what" table above.

---

## Extraction Examples

### Example: After building a dental clinic website

```
skills/domains/clinic-website/SKILL.md would contain:
- Appointment booking patterns (calendar UI, availability checking)
- Service catalog display (treatments, pricing tables)
- Doctor/staff profile components
- Before/after gallery patterns
- Google Maps integration
- Review/testimonial integration
- Contact form with appointment request
- HIPAA/privacy considerations (if applicable)
- SEO patterns specific to local businesses (Google Business, schema markup)
```

### Example: After building a SaaS admin panel

```
skills/domains/saas-admin/SKILL.md would contain:
- Data table patterns (sorting, filtering, pagination)
- RBAC (role-based access control) patterns
- Dashboard metrics/KPI card layouts
- Sidebar navigation patterns
- Settings/configuration pages
- User management CRUD
- Audit log display
- Multi-tenant data isolation patterns
```

---

## Versioning

Skills are updated incrementally after each project. There's no formal versioning — the "Last updated" line at the bottom of each SKILL.md tracks when it was last modified and from which project.

If a skill grows too large (> 500 lines), split it into sub-files and reference them from the main SKILL.md.

---

## Principles

1. **Prescriptive, not descriptive**: Skills tell Claude what TO DO, not just what exists. "Use X pattern" is better than "X pattern was used in project Y."

2. **Code examples over prose**: A 5-line code block communicates more than a paragraph of explanation.

3. **Decision tables over narratives**: "Use X when A, use Y when B" is faster to parse than a story about how you decided.

4. **No duplication**: Domain skills must not repeat what's in the general skill. If a pattern applies to all projects, it belongs in the general skill.

5. **Living documents**: Update after every project. Stale skills are worse than no skills — they teach outdated patterns.

---

*Skill library created: 2026-03-20*
*Source project: Asset Price Dashboard (v1.0–v1.3)*
