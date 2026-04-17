# Cosmology Group — UBA / FCEN

Bilingual (Spanish default, English toggle) institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires.

## Development

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm build
pnpm typecheck
pnpm lint
```

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind v4 (`@theme` CSS-first) + OKLCH design tokens
- next-intl 4.9+ for i18n (Spanish default, English toggle)
- Self-hosted variable fonts via `next/font/google`

## Project Layout

- `src/app/[locale]/` — locale-prefixed pages
- `src/i18n/` — next-intl routing + navigation + request config
- `src/proxy.ts` — next-intl middleware (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- `messages/{es,en}.json` — UI chrome translations
- `content/` — Zod-validated JSON content (Phase 2+)
- `design-system/` — `ui-ux-pro-max` MASTER.md source of truth
- `.planning/` — GSD workflow docs (roadmap, requirements, phase plans)

## Status

Phase 1 in progress — see `.planning/ROADMAP.md`.
