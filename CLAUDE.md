# Project Instructions

## Skill Library

Before starting any work, read the relevant skill files:

1. **Always read first**: `skills/web-dev-general/SKILL.md` — general methodology, architecture patterns, quality standards
2. **If domain matches**: Check `skills/domains/` for a matching domain skill
3. **For design decisions**: Read `skills/design/README.md` and use the ui-ux-pro-max search tool (see below)
4. **For prompt guidance**: See `skills/web-dev-general/prompt-patterns.md`
5. **Before researching a library/API**: Check `references/` first — may already have validated findings

## Design Decisions (ui-ux-pro-max)

All visual and UX design decisions **must** be informed by the ui-ux-pro-max toolkit. Do not guess colors, fonts, styles, or layouts — search for recommendations first.

**At project start (Phase 1 — Foundation):**
```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system --persist -p "Project Name"
```
This generates a design system (style, colors, fonts, effects) and persists it to `design-system/MASTER.md`. Use the output to define your CSS design tokens.

**During UI build (Phase 3+):**
```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>
```
Domains: `product`, `style`, `color`, `typography`, `chart`, `ux`, `landing`, `prompt`

**Before delivery (Phase 5 — Polish):**
```bash
python3 skills/design/ui-ux-pro-max/scripts/search.py "animation accessibility z-index loading" --domain ux
```

See `skills/design/README.md` for full usage reference.

## Project Startup

Follow `GUIDE.md` for the step-by-step process from zero to deployed site.

## Conventions

- **TypeScript strict mode** — always
- **Tailwind v4** with OKLCH design tokens — default CSS approach
- **Mock data first** — build UI with fake data, connect real API later
- **DataProvider pattern** — abstract interface with MockProvider/ApiProvider swap via env var
- **Atomic commits** — `feat(phase):`, `fix(phase):`, `test(phase):`, `docs(phase):`
- **No over-engineering** — build for current needs, not hypothetical futures
- **GitHub repos are always private** unless explicitly stated otherwise

## Planning

This project uses the GSD workflow. Planning files live in `.planning/`.
Config is in `.planning/config.json`.

## After Project Completion

1. Run `/gsd:audit-milestone` then `/gsd:complete-milestone`
2. Fill in project tracker retrospective (`skills/web-dev-general/templates/project-tracker.md`)
3. Extract domain skill if new domain (see `skills/README.md`)
4. Update general skill with new patterns
5. Extract research findings to `references/` (see `references/README.md`)
6. Sync back to template: `./extract-learnings.sh`
