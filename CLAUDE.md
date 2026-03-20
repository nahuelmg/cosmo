# Project Instructions

## Skill Library

Before starting any work, read the relevant skill files:

1. **Always read first**: `skills/web-dev-general/SKILL.md` — general methodology, architecture patterns, quality standards
2. **If domain matches**: Check `skills/domains/` for a matching domain skill
3. **For design decisions**: Defer to ui-ux-pro-max (referenced in `skills/design/README.md`)
4. **For prompt guidance**: See `skills/web-dev-general/prompt-patterns.md`

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

1. Extract domain skill if new domain (see `skills/README.md`)
2. Update general skill with new patterns
3. Copy updated `skills/` back to the `web_dev` template repo
4. Fill in project tracker retrospective
