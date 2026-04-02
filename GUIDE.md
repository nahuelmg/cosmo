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

## Step 0.5: Process Client Materials

The client gives you a folder with their materials — a PDF spec, logos, images, color palettes, whatever they have. Process it using the client intake template:

```
Read everything in the client folder at <path>.
Extract a structured brief following skills/web-dev-general/templates/client-intake.md.
```

Claude reads the PDF, catalogs images/logos, extracts brand colors, and produces a **`CLIENT-BRIEF.md`** in the project root with:
- Project summary and extracted requirements
- Pages/sections described
- Brand assets provided (logo, colors, fonts, photos)
- Functional requirements (forms, booking, payments, languages)
- **Gaps** — what's still needed from the client

**Blocking gaps** (cannot start without): project name, at least one logo, core page copy or enough context to draft it, primary brand color.

**Non-blocking gaps** (can start, need before launch): legal info, contact details, final images, domain credentials.

If the client gave you minimal materials, consult `skills/web-dev-general/templates/content-intake.md` for a checklist of what to ask for. Send them the relevant sections — not the whole form.

See `skills/web-dev-general/templates/client-intake.md` for the full process.

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

**Answer questions from `CLIENT-BRIEF.md`** (generated in Step 0.5):

| GSD asks | Answer from |
|----------|-------------|
| What does the client need? | CLIENT-BRIEF.md → Project Summary |
| Who are the users? | CLIENT-BRIEF.md → Project Summary |
| Core action? | CLIENT-BRIEF.md → Requirements (highest priority) |
| Design references? | CLIENT-BRIEF.md → Brand Direction → Reference sites |
| Deployment target? | CLIENT-BRIEF.md → Constraints |
| Timeline? | CLIENT-BRIEF.md → Constraints |
| Content ready? | CLIENT-BRIEF.md → Gaps section |

---

## Step 1.5: Generate the Design System

Before writing any code, establish the visual identity using ui-ux-pro-max:

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system --persist -p "Project Name"
```

Use the style keywords from `CLIENT-BRIEF.md → Brand Direction` in the query.

**Examples:**
```bash
# Dental clinic landing page
python3 skills/design/ui-ux-pro-max/scripts/search.py "healthcare dental clinic professional trust" --design-system --persist -p "Dental Clinic"

# SaaS analytics dashboard
python3 skills/design/ui-ux-pro-max/scripts/search.py "saas dashboard analytics modern data" --design-system --persist -p "Analytics Pro"
```

This creates `design-system/MASTER.md` — the source of truth for all visual decisions (style, colors, fonts, effects).

**Reconcile with client brand** (from `CLIENT-BRIEF.md → Brand Assets`):
- **Client provided colors** → override the recommended palette. Keep client's primary; supplement with ui-ux-pro-max for secondary/accent/backgrounds.
- **Client provided fonts** → use them. Skip ui-ux-pro-max font recommendations.
- **Client provided style references** → search for the closest style in ui-ux-pro-max and follow its implementation guidelines.
- **Client provided nothing visual** → use ui-ux-pro-max recommendations as-is.

Document any overrides in `design-system/MASTER.md` so they persist across sessions.

**Time estimate**: 1 conversation turn

---

## Step 2: Scaffold the Foundation

The first phase is always the same (adapted to the stack):

```
/gsd:plan-phase 1
/gsd:execute-phase 1
```

Foundation phase typically includes:
1. Framework scaffold (Next.js, Nuxt, etc.)
2. **Design tokens derived from `design-system/MASTER.md`** (colors, typography, spacing)
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

**Design consultation during build**: When building new components or pages, consult ui-ux-pro-max for specific guidance:
```bash
# Style details for a specific component pattern
python3 skills/design/ui-ux-pro-max/scripts/search.py "card pricing glassmorphism" --domain style

# UX patterns for forms, navigation, etc.
python3 skills/design/ui-ux-pro-max/scripts/search.py "form validation feedback" --domain ux

# Landing page section structure
python3 skills/design/ui-ux-pro-max/scripts/search.py "hero social-proof testimonial" --domain landing

# Chart type recommendations
python3 skills/design/ui-ux-pro-max/scripts/search.py "trend comparison realtime" --domain chart
```

Always check the persisted `design-system/MASTER.md` first — it's the baseline. Use domain searches for deeper dives into specific decisions.

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

## Step 6: Polish + Device Testing

Run a UX validation pass before polishing:
```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "animation accessibility z-index loading" --domain ux
```

Then apply polish:
- Dark/light mode toggle
- Loading skeletons (match final layout dimensions)
- Error states with helpful messages
- Responsive layout (mobile/tablet/desktop)
- Micro-interactions and transitions

### Mock Data Fidelity Check

Before moving to API integration, verify the mock data is realistic enough:

```
[ ] Every filter/selector visibly changes the displayed data
[ ] Loading states appear and resolve correctly
[ ] Error states render when simulated
[ ] Data looks plausible (right date ranges, reasonable values, proper formats)
[ ] Empty states handled (no items, no results, first-time user)
```

If a UI control does nothing with mock data, fix the mock provider now — don't wait until real data reveals it.

### Device Testing

Deploy to a preview URL and test on your **actual phone**:

```
[ ] Layout doesn't overflow horizontally
[ ] Text is readable without zooming
[ ] Touch targets are large enough (min 44x44px)
[ ] Charts/visualizations render correctly
[ ] Scroll behavior feels natural
[ ] No stale cached version (hard refresh if needed)
```

Do this after each milestone, not just at the end. Real devices expose problems that browser dev tools simulators miss.

**Time estimate**: 3-5 conversation turns

---

## Step 7: API Integration

When the UI is complete with mock data:

1. **Compatibility check first** — before building the full integration, deploy a minimal test route that calls the external API and returns the status code. Verify it works from your hosting platform (Vercel, Netlify, etc.). Some APIs block cloud provider IPs. Discovering this after building the full integration wastes hours.
   ```typescript
   // app/api/test-external/route.ts — deploy this FIRST
   export async function GET() {
     try {
       const res = await fetch('https://api.example.com/ping');
       return Response.json({ status: res.status, ok: res.ok });
     } catch (e) {
       return Response.json({ error: String(e) }, { status: 502 });
     }
   }
   ```
2. **Create the API client module** (`lib/[service]-client.ts`)
3. **Create BFF routes** (`app/api/[resource]/route.ts`)
4. **Implement ApiProvider** (same interface as MockProvider)
5. **Switch env var**: `NEXT_PUBLIC_DATA_SOURCE=api`
6. **Add polling/caching** (TanStack Query refetchInterval)
7. **Test error states** (disconnect API, test graceful degradation)

**If the API is blocked**: Check `references/apis/` for a documented fallback. If none exists, evaluate alternatives before building further.

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
3. **New research?** Extract validated findings to `references/` (libraries, APIs, deployment notes)
4. **Copy everything back** to the `web_dev` template repo so future projects benefit
5. **Fill in the retrospective** in your project tracker

```bash
# Copy updated skills and references back to template
cp -r skills/ ~/Desktop/web_dev/skills/
cp -r references/ ~/Desktop/web_dev/references/
cd ~/Desktop/web_dev
git add skills/ references/ && git commit -m "chore: update from <project-name>" && git push
```

---

## Multi-Session Projects

If a project spans multiple conversations (most will), **always end a session properly**:

```
/gsd:pause-work
```

This saves a context handoff file so the next session can resume without losing state. Starting the next session:

```
/gsd:resume-work
```

**Don't just close the conversation** — context is lost and the next session starts cold, wasting turns on re-orientation.

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
