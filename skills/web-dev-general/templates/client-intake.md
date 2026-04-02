# Client Intake Process

> When a client hands you a folder with their materials, follow this process to extract a structured brief before writing any code.

---

## Expected Input

The client provides a folder containing some combination of:
- **PDF** with project specifications, requirements, or a brief
- **Images** (photos, product shots, team headshots, etc.)
- **Logo files** (SVG, PNG, AI, EPS)
- **Color palettes** (image, PDF, or text file with hex codes)
- **Reference links** (competitor sites, inspiration, mood boards)
- **Text content** (copy, descriptions, bios — in any format)

Not all clients will provide everything. Some will give you a detailed 20-page PDF; others will give you a logo and a WhatsApp message. This process handles both extremes.

---

## Step 1: Process the Client Folder

Point Claude at the client's folder:

```
Read everything in the client folder at <path>.
Extract a structured brief following skills/web-dev-general/templates/client-intake.md.
```

Claude will:
1. **Read the PDF** — extract requirements, scope, preferences, and constraints
2. **Catalog images** — identify logos, photos, palettes, and their intended use
3. **Extract brand info** — colors (hex codes from palettes or PDF), fonts, style preferences
4. **Note reference sites** — any URLs or competitor mentions

---

## Step 2: Produce the Client Brief

After processing, Claude creates `CLIENT-BRIEF.md` in the project root with this structure:

```markdown
# Client Brief — {{Project Name}}

> Auto-generated from client materials at {{folder path}}
> Date: {{date}}

## Project Summary
<!-- 2-3 sentences: what the client needs, who it's for, core action -->

## Requirements
<!-- Extracted from the PDF. Bullet list of what the client explicitly asked for -->

## Pages / Sections
<!-- What pages or sections were described? List each with its purpose -->

## Brand Assets Provided
<!-- What was in the folder? -->
- Logo: {{filename, format, quality assessment}}
- Colors: {{hex codes extracted from palette or PDF}}
- Fonts: {{if specified}}
- Photos: {{list with descriptions and intended use}}

## Brand Direction
<!-- Style/mood keywords extracted from the PDF or inferred from references -->
- Style keywords: {{e.g., professional, modern, minimal, warm}}
- Reference sites: {{any URLs mentioned}}
- Things to avoid: {{any stated dislikes}}

## Functional Requirements
<!-- Interactive features extracted from the PDF -->
- Contact form: {{yes/no, where submissions go}}
- Booking system: {{yes/no, which service}}
- Payments: {{yes/no, provider}}
- Languages: {{single/multi, which languages}}
- Other: {{any other interactive features}}

## Constraints
<!-- Timeline, budget, hosting, technical requirements -->

## Gaps — Still Needed from Client
<!-- What's missing that we need before building? -->
- [ ] {{item 1}}
- [ ] {{item 2}}
```

---

## Step 3: Gap Analysis

Compare what was provided against what's needed to start building. Categorize gaps:

### Blocking (cannot start Phase 1 without these)
- Company/project name
- At least one logo file (any format)
- Core page copy OR enough context to draft it
- Primary brand color (from palette, logo, or explicit preference)

### Blocking for launch (can start building, but need before deploy)
- Legal entity info (name, registration number, address) — for legal pages
- Contact info (phone, email, address, business hours)
- Final images (hero photos, product shots, team headshots)
- Domain and hosting credentials
- Form submission endpoint credentials

### Nice to have (can generate recommendations if missing)
- Full color palette (ui-ux-pro-max can recommend based on industry)
- Font choices (ui-ux-pro-max can recommend pairings)
- Explicit style preferences (can infer from references + industry)

---

## Step 4: Feed Into Project Definition

The `CLIENT-BRIEF.md` becomes the primary input for `/gsd:new-project`. When Claude asks scope questions during project definition, answer from the brief:

| GSD question | Answer from |
|-------------|-------------|
| What does the client need? | Client Brief → Project Summary |
| Who are the users? | Client Brief → Project Summary |
| Core action? | Client Brief → Requirements (highest priority item) |
| Design references? | Client Brief → Brand Direction → Reference sites |
| Deployment target? | Client Brief → Constraints |
| Timeline? | Client Brief → Constraints |
| Content ready? | Client Brief → Gaps section |

---

## Step 5: Feed Into Design System

After project definition, generate the design system using client brand as constraints:

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <style_keywords>" --design-system --persist -p "Project Name"
```

Then reconcile with client brand:
- **Client provided colors** → override the recommended palette. Use client's primary color; supplement with ui-ux-pro-max suggestions for secondary, accent, backgrounds.
- **Client provided fonts** → use them. Only consult ui-ux-pro-max if the client has no font preference.
- **Client provided style references** → search for the closest matching style in ui-ux-pro-max and use its implementation guidelines.
- **Client provided nothing** → use ui-ux-pro-max recommendations as-is.

---

## Quick Example

Client gives you: `~/Desktop/dental-clinic/`
```
dental-clinic/
  brief.pdf          ← 3 pages: scope, pages needed, timeline
  logo.svg           ← clinic logo
  palette.png        ← screenshot of preferred colors
  clinic-photo-1.jpg ← interior shot
  clinic-photo-2.jpg ← exterior shot
  team/              ← 4 headshots of dentists
```

You run:
```
Read everything in ~/Desktop/dental-clinic/.
Extract a structured brief following skills/web-dev-general/templates/client-intake.md.
```

Claude produces `CLIENT-BRIEF.md` with extracted requirements, cataloged assets, identified gaps. Then:

```
/gsd:new-project
```
Answer questions from the brief. Then:

```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "healthcare dental clinic professional trust" --design-system --persist -p "Dental Clinic"
```
Override the palette with the client's extracted colors. Build.
