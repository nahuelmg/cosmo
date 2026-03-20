# How to Start a New Project

This guide walks you through the complete process from "I have a client" to "site is live."

---

## Step 0: Create the Project Repo

1. Go to [github.com/tomasferreirachase/web_dev](https://github.com/tomasferreirachase/web_dev)
2. Click **"Use this template"** → **"Create a new repository"**
3. Name it after the project (e.g., `dental-clinic-site`, `restaurant-menu`, `saas-dashboard`)
4. Set to **Private**
5. Clone it locally:
   ```bash
   git clone git@github.com:tomasferreirachase/<project-name>.git
   cd <project-name>
   ```

You now have the full skill library, planning scaffold, and CLAUDE.md ready.

---

## Step 1: Define the Project

Open Claude Code in the project directory and run:

```
/gsd:new-project
```

This will:
- Ask you questions about the project (client, scope, stack, constraints)
- Research the domain
- Generate `PROJECT.md` with requirements
- Create a `ROADMAP.md` with phased plan

**Before running this**, have answers ready for:
- What does the client need? (1-2 sentences)
- Who are the users?
- What's the core action? (the ONE thing users must do)
- Any design references? (competitor sites, Figma, mood boards)
- Deployment target? (Vercel, Netlify, client's hosting)
- Timeline / deadline?
- Content ready? (copy, images, logos from client)

---

## Step 2: Scaffold the Foundation

The first phase is always the same (adapted to the stack):

```
/gsd:plan-phase 1
/gsd:execute-phase 1
```

Foundation phase typically includes:
1. Framework scaffold (Next.js, Nuxt, etc.)
2. Design tokens (colors, typography, spacing)
3. TypeScript types for all data shapes
4. Formatting utilities with tests
5. Dev server running

**Time estimate**: 2-3 conversation turns

---

## Step 3: Build the Data Layer

Before building any UI, set up the data pipeline:

1. **Define the data shapes** (types for all entities)
2. **Create mock data** (realistic fake data that looks good in demos)
3. **Create the DataProvider interface** (abstract contract)
4. **Implement MockProvider** (works offline, instant)
5. **Create hooks** (useX, useYList — thin wrappers around React Query)

**Why mock data first**: You can build and demo the entire UI without a working API. Client can see progress immediately. The provider abstraction means swapping to a real API later is a one-line change.

**Time estimate**: 3-5 conversation turns

---

## Step 4: Build Core UI

Now build the primary interface. This varies by project type:

| Project Type | Core UI |
|-------------|---------|
| Dashboard | Charts, data tables, stat cards |
| Landing page | Hero, sections, CTA, contact form |
| E-commerce | Product grid, detail page, cart |
| Admin panel | Data tables, forms, sidebar nav |
| Portfolio site | Project gallery, about, contact |

Use the domain skill from `skills/domains/` if one exists.

**Time estimate**: 5-8 conversation turns

---

## Step 5: Navigation & Routing

Add multi-page navigation:
- Top nav / sidebar
- Route structure
- URL state for shareable views
- Asset/item picker (if applicable)

**Time estimate**: 2-3 conversation turns

---

## Step 6: Polish

- Dark/light mode toggle
- Loading skeletons (match final layout dimensions)
- Error states with helpful messages
- Responsive layout (mobile/tablet/desktop)
- Micro-interactions and transitions

**Time estimate**: 3-5 conversation turns

---

## Step 7: API Integration

When the UI is complete with mock data:

1. **Create the API client module** (`lib/[service]-client.ts`)
2. **Create BFF routes** (`app/api/[resource]/route.ts`)
3. **Implement ApiProvider** (same interface as MockProvider)
4. **Switch env var**: `NEXT_PUBLIC_DATA_SOURCE=api`
5. **Add polling/caching** (TanStack Query refetchInterval)
6. **Test error states** (disconnect API, test graceful degradation)

**Time estimate**: 3-5 conversation turns

---

## Step 8: Deploy

1. Connect repo to Vercel (or chosen platform)
2. Set environment variables in hosting dashboard
3. Push to trigger deploy
4. Run post-launch checklist (see `skills/web-dev-general/templates/client-handoff.md`)
5. Verify on mobile device

---

## Step 9: Client Handoff

1. Copy `skills/web-dev-general/templates/client-handoff.md` into the project
2. Fill in all sections (credentials, how to update content, support terms)
3. Send to client
4. Log effort in `skills/web-dev-general/templates/project-tracker.md`

---

## Step 10: Extract Learnings

After the project is done:

1. **New domain?** Create `skills/domains/<domain>/SKILL.md` with patterns specific to this project type
2. **New general patterns?** Update `skills/web-dev-general/SKILL.md` with any new discoveries
3. **Copy updated skills back** to the `web_dev` template repo so future projects benefit
4. **Fill in the retrospective** in your project tracker

```bash
# Copy updated skills back to template
cp -r skills/ ~/Desktop/web_dev/skills/
cd ~/Desktop/web_dev
git add skills/ && git commit -m "chore: update skills from <project-name>" && git push
```

---

## Quick Reference: GSD Commands

| Command | When to Use |
|---------|-------------|
| `/gsd:new-project` | Starting a brand new project |
| `/gsd:discuss-phase N` | Before planning — resolve scope questions |
| `/gsd:plan-phase N` | Create execution plan for a phase |
| `/gsd:execute-phase N` | Build everything in the phase plan |
| `/gsd:verify-work` | Check if what was built actually works |
| `/gsd:audit-milestone` | Before marking a version complete |
| `/gsd:complete-milestone` | Archive and tag a shipped version |
| `/gsd:new-milestone` | Start the next version cycle |
| `/gsd:debug` | Systematic bug investigation |
| `/gsd:quick` | Small task without full planning overhead |

---

## Project Type Cheat Sheet

### Landing Page / Business Site
```
Phases: Foundation → Content/Data → Sections → Nav/Footer → Polish → Deploy
Stack: Next.js + Tailwind + shadcn (no backend usually)
Turns: ~15-20
```

### Data Dashboard
```
Phases: Foundation → Data Layer → Charts → Nav → Polish → API → Features
Stack: Next.js + Tailwind + LWC/Recharts + TanStack Query + Zustand
Turns: ~25-35
Domain skill: skills/domains/dashboard-realtime/SKILL.md
```

### E-Commerce
```
Phases: Foundation → Product Data → Catalog UI → Cart → Checkout → Payment → Deploy
Stack: Next.js + Tailwind + Stripe/MercadoPago + DB
Turns: ~30-40
Domain skill: skills/domains/ecommerce/SKILL.md
```

### Client Portfolio / Agency Site
```
Phases: Foundation → Content → Project Gallery → About/Contact → Polish → Deploy
Stack: Next.js + Tailwind + CMS (optional)
Turns: ~12-18
```

---

*Last updated: 2026-03-20*
