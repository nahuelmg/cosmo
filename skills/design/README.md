# Design Skills (ui-ux-pro-max)

This directory contains a symlink to the **ui-ux-pro-max** design intelligence toolkit. It provides searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines.

## Setup

The `ui-ux-pro-max/` symlink points to the source at `/home/tomas/Projects/ui-ux-pro-max/src/ui-ux-pro-max/`. If it's broken after cloning, recreate it:

```bash
ln -s /home/tomas/Projects/ui-ux-pro-max/src/ui-ux-pro-max skills/design/ui-ux-pro-max
```

Requires Python 3 (no external dependencies).

---

## When to Use

**You MUST consult ui-ux-pro-max for design decisions.** The general SKILL.md handles engineering; domain skills handle domain-specific technical patterns. This skill handles everything visual and experiential.

### Mandatory triggers (always run the search)

- Starting a new project's visual identity (Phase 1 — Foundation)
- Choosing color palette, fonts, or UI style
- Building a new page or major section
- Adding charts or data visualization
- Implementing dark/light mode
- Polishing UI before delivery (Phase 5+)

### Recommended triggers (run if uncertain)

- A component "doesn't look right" but you're not sure why
- Choosing between layout approaches
- Making responsive design decisions
- Reviewing accessibility

### Skip

- Pure backend work, API design, data modeling
- Infrastructure, DevOps, CI/CD
- Non-visual scripts or automation

---

## How to Use

### Step 1: Generate a Design System (do this FIRST for any new project)

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This returns a complete recommendation: pattern, style, colors, typography, effects, and anti-patterns.

**Examples:**
```bash
# SaaS dashboard
python3 skills/design/ui-ux-pro-max/scripts/search.py "saas dashboard analytics modern" --design-system -p "Analytics Dashboard"

# Landing page for a dental clinic
python3 skills/design/ui-ux-pro-max/scripts/search.py "healthcare dental clinic professional" --design-system -p "Dental Clinic"

# E-commerce store
python3 skills/design/ui-ux-pro-max/scripts/search.py "ecommerce fashion trendy" --design-system -p "Fashion Store"
```

### Step 2: Persist the Design System (recommended)

Save it so it's available across sessions:

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates `design-system/MASTER.md` in the project root — the single source of truth for all visual decisions.

For page-specific overrides:
```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

### Step 3: Domain-specific deep dives (as needed during build)

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `"entertainment social"` |
| UI style options | `style` | `"glassmorphism dark"` |
| Color palettes | `color` | `"healthcare professional"` |
| Font pairings | `typography` | `"elegant modern"` |
| Chart recommendations | `chart` | `"real-time dashboard"` |
| UX best practices | `ux` | `"animation accessibility"` |
| Landing page structure | `landing` | `"hero social-proof"` |
| AI/CSS prompt keywords | `prompt` | `"minimalism"` |

### Step 4: Stack-specific guidelines

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

---

## Integration with Design Tokens

The general SKILL.md (section 4) covers the *technical implementation* of design tokens (CSS variables, Tailwind theme, OKLCH). The design system output from ui-ux-pro-max tells you *which values to use*:

1. Run `--design-system` to get recommended colors, fonts, style
2. Convert those colors to OKLCH for your `:root` CSS variables
3. Map them into `@theme inline` for Tailwind

---

## Pre-Delivery Design Review

Before marking any milestone complete, run a UX validation pass:

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "animation accessibility z-index loading" --domain ux
```

Then review against the quick-reference checklist in the skill's SKILL.md (sections 1-3 are CRITICAL priority).

---

## How Design Fits Into the Workflow

| Project Phase | Design Action |
|---------------|---------------|
| **Phase 1 — Foundation** | Run `--design-system` to establish visual identity. Persist it. Use output to define CSS design tokens. |
| **Phase 2 — Data Layer** | No design action needed. |
| **Phase 3 — Core UI** | Consult `--domain style` and `--domain ux` when building components. Follow persisted design system. |
| **Phase 4 — Navigation** | Consult `--domain ux` for navigation patterns (bottom nav limits, drawer usage, back behavior). |
| **Phase 5 — Polish** | Run full UX validation pass. Check dark/light mode contrast. Review responsive breakpoints. |
| **Phase 6 — API Integration** | No design action needed (loading/error states should already exist from Phase 5). |
| **Phase 7+ — Features** | Consult domain searches for any new UI patterns. |
