# Web Development General Methodology

> A reusable skill for Claude. Read this at the start of any new web project to replicate proven workflow, standards, and quality patterns.

## How to Use This Skill

1. **Always read this file first** when starting a new web project
2. **Then check `skills/domains/`** for a matching domain skill (dashboard, landing page, ecommerce, etc.)
3. **For design decisions**, defer to ui-ux-pro-max — this skill covers engineering, not aesthetics
4. **Update this file** after each project with new patterns learned (see `skills/README.md` for the extraction process)

---

## 1. Project Scaffolding Process

Follow this exact order. Each step builds on the previous one. Do not skip ahead.

### Phase Order (proven across projects)

```
1. Foundation       → Scaffold, design tokens, types, formatting utilities
2. Data Layer       → Fake data, provider abstraction, hooks
3. Core Components  → Primary UI (charts, cards, forms — whatever the domain needs)
4. Navigation       → Routes, nav bar, URL state, asset/item switching
5. Polish           → Theme toggle, comparison/filtering, skeletons, error states
6. API Integration  → Real backend, BFF routes, polling/caching
7. Feature Layers   → Domain-specific features (portfolio, cart, booking, etc.)
```

### Why This Order Works

- **Foundation first**: Types and formatting utils are consumed by everything. Getting these wrong early means refactoring everything later.
- **Fake data before real data**: Decouples frontend from backend. You can build and demo the entire UI without a working API. The provider abstraction makes the swap seamless later.
- **Core components before navigation**: Build one complete view first. Multi-page routing adds complexity that distracts from getting the core UI right.
- **Polish before API**: Loading skeletons, error states, and theming are easier to build with predictable mock data. Debugging loading states against a flaky API is painful.
- **API last**: By the time you integrate real data, every component already works perfectly with mock data. The swap is a one-line env var change.

### Scaffolding Checklist

```
[ ] Create project with latest stable framework (Next.js, Nuxt, SvelteKit, etc.)
[ ] Set up TypeScript strict mode
[ ] Install CSS framework (Tailwind v4 recommended)
[ ] Define design tokens (colors, spacing, typography) in CSS variables
[ ] Create shared types file for all data shapes
[ ] Create formatting utilities with tests (currency, percentage, dates)
[ ] Verify dev server runs, types compile, tests pass
```

<!-- Added from 3d-printing-landing retrospective -->
```
[ ] Validate package name: no capitals, spaces, or special characters (npm rejects them)
    — "3D_company" fails; use "3d-printing-company". Check BEFORE running create-next-app.
[ ] If using --src-dir: middleware goes at src/middleware.ts (NOT project root)
    — Root middleware.ts is silently ignored by Turbopack with --src-dir projects.
    — Also use relative imports in middleware (./i18n/routing), not @/ aliases (Edge runtime limitation).
[ ] If project template includes non-code directories (skills/, docs/, scripts/):
    — Add them to tsconfig "exclude" array before first build.
    — Default tsconfig **/*.ts includes everything, causing "untyped module" build failures.
[ ] Create .env.example in the same commit as the first env var:
    — List every NEXT_PUBLIC_* and server-only var with a description and example value.
    — Deployment without this will silently use wrong defaults (localhost in sitemap, etc.).
```

<!-- Added from crypto-dashboard retrospective -->
### Pre-Scaffolding Validation (do BEFORE writing any code)

These checks take 5–10 minutes and have each saved hours of rework:

```
[ ] Verify Node version compatibility with ALL core deps (Vite, vitest, Tailwind, etc.)
    — Node 18 conflicts with Vite 5.4+, vitest 4.x. Pin with npm overrides if needed.
[ ] Check what the component library installer actually installs (shadcn defaults change)
    — shadcn@latest now defaults to Base UI (base-nova), not Radix UI. APIs differ.
[ ] Verify target deployment environment can reach external APIs
    — Binance, some payment APIs, block AWS/Vercel IPs. Test with: curl from a Vercel
      function OR check the API's known blocklist before building the entire data layer.
[ ] For any 3rd-party API: read the ACTUAL response JSON before designing types
    — CoinGecko /ohlc returns [ts, o, h, l, c] — NO volume. Volume requires a second
      endpoint. Don't design a 5-field type assuming all 5 values come from one call.
[ ] For Tailwind v4: add @custom-variant dark (&:is(.dark *)) in globals.css
    — Without this, .dark class toggling has ZERO effect on dark: utilities.
[ ] For Tailwind v4 + vitest: disable PostCSS in vitest config
    — String-form @tailwindcss/postcss plugin is incompatible with vitest's environment.
[ ] For Linux + Node 18: add @tailwindcss/oxide-linux-x64-gnu as explicit dependency
    — Native binary not auto-resolved as optional dep on this platform/version combo.
```

<!-- Added from 3d-printing-landing retrospective -->
```
[ ] After running shadcn init, immediately restore your design tokens:
    — shadcn init rewrites :root in globals.css with its default palette.
    — This is not a one-time risk — it WILL happen every time you run shadcn init.
    — Treat shadcn init + token restoration as a paired atomic action, not two separate steps.
```

---

## 2. Directory Structure Conventions

```
src/
├── app/                    # Pages/routes (Next.js App Router or equivalent)
│   ├── api/                # BFF route handlers (server-side proxy)
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home/main page
│   └── [feature]/page.tsx  # Feature pages
├── components/
│   ├── [domain]/           # Domain components (chart/, portfolio/, product/)
│   ├── nav/                # Navigation components
│   └── ui/                 # Primitive UI components (shadcn or equivalent)
├── hooks/                  # Custom React hooks (useAsset, useCart, etc.)
├── lib/                    # Pure utility functions (formatting, math, helpers)
│   └── __tests__/          # Unit tests for lib functions
├── providers/              # Data provider abstraction
│   ├── types.ts            # DataProvider interface
│   ├── mock-provider.ts    # Fake data implementation
│   ├── api-provider.ts     # Real API implementation
│   └── index.ts            # Factory: create provider based on env var
├── stores/                 # Zustand stores (client-side state)
├── types/                  # Shared TypeScript interfaces
│   └── index.ts            # All domain types in one file
└── data/                   # Static JSON data files (for mock provider)
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ChartHeader.tsx`, `AssetPicker.tsx` |
| Files | kebab-case | `chart-header.tsx`, `asset-picker.tsx` |
| Hooks | camelCase with `use` prefix | `useAsset.ts`, `usePriceHistory.ts` |
| Stores | kebab-case with `-store` suffix | `portfolio-store.ts`, `interval-store.ts` |
| Types | PascalCase interfaces | `Asset`, `Transaction`, `OHLCVPoint` |
| Utilities | camelCase functions | `formatCurrency()`, `formatPercent()` |
| Tests | Same name with `.test.ts` | `formatting.test.ts` |
| API routes | Folder per resource | `api/assets/[id]/history/route.ts` |

---

## 3. Component Architecture

### Design Principles

1. **Self-contained over prop-heavy**: Components that own their own data fetching (via hooks) are easier to use than components requiring 10 props. Example: `<PortfolioStatsRow />` takes zero props — it reads from its own hook internally.

2. **Props for variation, hooks for data**: Use props for visual configuration (size, variant, className). Use hooks for data fetching and state.

3. **Composition over configuration**: Prefer composing small components over building one mega-component with many flags. A chart page is `<ChartHeader />` + `<ChartContainer />` + `<ChartControls />`, not `<Chart showHeader showControls headerVariant="full" />`.

4. **Domain components vs UI primitives**: Domain components (`chart/`, `portfolio/`) contain business logic. UI primitives (`ui/`) are pure visual components (Button, Dialog, Skeleton) — use a component library like shadcn/ui for these.

### State Management Hierarchy

Choose the simplest option that works:

```
URL state (nuqs/searchParams)  → Shareable, bookmarkable (current page, filters, search)
Zustand store (persist)         → Client-side data that survives refresh (transactions, preferences)
Zustand store (ephemeral)       → UI state shared across components (comparison selections)
React state (useState)          → Component-local state (form inputs, open/closed)
Server state (TanStack Query)   → Remote data with caching, polling, refetch
```

**Decision rule**: If a user would want to share a link and see the same view, it belongs in URL state. If it needs to survive a refresh but isn't URL-worthy, use Zustand persist. If it's just UI coordination, use ephemeral Zustand. If it's a form field, use useState.

### Component Patterns

**Hook-driven data component:**
```typescript
// hooks/use-something.ts
export function useSomething(id: string) {
  return useQuery({
    queryKey: ['something', id],
    queryFn: () => dataProvider.getSomething(id),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// components/domain/something-display.tsx
export function SomethingDisplay({ id }: { id: string }) {
  const { data, isPending, isError } = useSomething(id);
  if (isPending) return <Skeleton />;
  if (isError) return <ErrorState />;
  return <div>{/* render data */}</div>;
}
```

**Controlled dialog pattern:**
```typescript
// Parent controls open/close, no DialogTrigger needed
const [editItem, setEditItem] = useState<Item | null>(null);
<ItemModal
  open={editItem !== null}
  onOpenChange={(open) => !open && setEditItem(null)}
  editItem={editItem}
  onSubmit={handleSubmit}
/>
```

---

## 4. Design Token Management

### Approach: CSS Variables + Framework Theme

Define all design tokens as CSS custom properties. Use OKLCH color space for perceptual uniformity. Map tokens to the CSS framework's theme system.

```css
/* globals.css */
:root {
  --primary: oklch(0.7 0.15 175);      /* Brand color */
  --background: oklch(1 0 0);           /* Page background */
  --foreground: oklch(0.145 0 0);       /* Text color */
  --gain: oklch(0.72 0.17 155);         /* Positive/success */
  --loss: oklch(0.63 0.21 25);          /* Negative/error */
  --muted-foreground: oklch(0.556 0 0); /* Secondary text */
  --border: oklch(0.922 0 0);           /* Border color */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.98 0 0);
  /* ... override all tokens for dark mode */
}

@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* Map CSS vars to Tailwind theme */
}
```

### Key Lessons

- **Canvas-based libraries can't read CSS vars**: Libraries like Lightweight Charts render on `<canvas>` and need hex/rgb colors passed imperatively. Create a theme object (`CHART_THEMES`) with dark/light variants and update it on theme change.
- **`tabular-nums` on body**: Financial/data-heavy UIs need tabular (monospace) numbers so columns align. Set `font-variant-numeric: tabular-nums` on body.
- **shadcn/ui integration**: shadcn uses CSS variable naming conventions. Install it early and let it generate the token structure — then customize the values.

---

## 5. Data Layer Architecture

### The Provider Pattern

This is the single most important architectural pattern. It decouples your entire frontend from any specific backend.

```
DataProvider interface
    ├── MockProvider (fake data, works offline, instant)
    ├── ApiProvider (real API via BFF routes)
    └── [future] PythonApiProvider (different backend, same interface)
```

```typescript
// providers/types.ts — define the contract
export interface DataProvider {
  getAsset(id: string): Promise<Asset>;
  getItems(filters: Filters): Promise<Item[]>;
  // ... whatever your domain needs
}

// providers/index.ts — factory
function createDataProvider(): DataProvider {
  const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock';
  if (source === 'api') return new ApiProvider();
  return new MockProvider();
}
export const dataProvider = createDataProvider();
```

### Why Mock Data First

1. **Development speed**: No API delays, no rate limits, no auth tokens
2. **Deterministic demos**: Same data every time — perfect for screenshots and client presentations
3. **Offline development**: Works on planes, trains, coffee shops
4. **Test isolation**: Tests run against predictable data
5. **Seamless swap**: Change one env var to switch to real data

### Mock Data Fidelity

Mock data must be realistic enough that every UI control has a visible effect. If a control does nothing with mock data, bugs hide until real data arrives — which is always the worst time to discover them.

**Fidelity checklist** (verify before moving to API integration):

```
[ ] Every filter/selector visibly changes the displayed data
[ ] Every parameter the API accepts is respected by the mock (intervals, ranges, etc.)
[ ] Data timestamps are recent enough to look plausible
[ ] Loading states appear and resolve (add artificial delay if needed)
[ ] Empty states handled (no items, no search results, first-time user)
[ ] Multi-entity mocks are distinct (not all identical — vary names, values, images)
[ ] Error states can be triggered (e.g., invalid ID returns error)
```

**Lesson learned**: A mock provider that ignores parameters (e.g., always returns daily data regardless of interval selection) ships a UI control that does nothing — and you only discover it when a user tests on their phone in production.

### BFF (Backend For Frontend) Pattern

Never call external APIs directly from the browser. Route through server-side API handlers:

```
Browser → /api/assets/[id] → Server-side route → External API (Binance, Stripe, etc.)
```

Benefits:
- **Security**: API keys stay server-side
- **Caching**: Server-side `Cache-Control` headers
- **CORS avoidance**: Your domain, your rules
- **Rate limit control**: One server IP, not thousands of client IPs

### Polling vs WebSocket

**Default to polling** unless you need sub-second updates. Polling with TanStack Query is trivial:

```typescript
useQuery({
  queryKey: ['data', id],
  queryFn: () => dataProvider.getData(id),
  refetchInterval: 60_000,  // Poll every 60 seconds
  staleTime: 30_000,        // Consider fresh for 30 seconds
});
```

WebSocket adds reconnection logic, heartbeat management, message parsing, and state sync complexity. Only use it for chat, live collaboration, or trading — not for dashboards showing prices that update every minute.

---

## 6. API Integration Patterns

### When Adding a New External API

1. **Create a client module** (`lib/[service]-client.ts`):
   - Pure mapping functions (API response → your types)
   - Fetch functions with error handling
   - Type-safe error class (`ServiceApiError`)
   - Document the API contract with a header comment

2. **Create BFF routes** (`app/api/[resource]/route.ts`):
   - Parse params and query string
   - Call client module
   - Return JSON with cache headers
   - Normalize errors (404, API error, 500)

3. **Implement the provider** (`providers/api-provider.ts`):
   - Call your own BFF routes (not the external API directly)
   - Implement the same `DataProvider` interface as MockProvider

4. **Thread through hooks** — hooks already call `dataProvider`, so they work automatically

### Caching Strategy

```typescript
// BFF route — server-side CDN cache
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59',
};

// Client-side — TanStack Query
{
  staleTime: 30_000,      // Serves from cache for 30s (no spinner)
  refetchInterval: 60_000, // Background refetch every 60s
}
```

**Error resilience**: When a refetch fails, TanStack Query preserves the last successful data. The user sees stale-but-valid data instead of an error screen. Only show error state when there's NO cached data at all.

---

## 7. Testing Strategy

### What to Test

| Layer | Test Type | Priority |
|-------|----------|----------|
| Pure functions (formatting, math) | Unit tests (vitest) | **High** — these are your foundation |
| API client mapping functions | Unit tests with mocked fetch | **High** — catch API contract changes |
| Hooks | Integration tests | Medium — complex but valuable |
| Components | Visual/manual | Low — UI changes too fast for snapshot tests |

### TDD for Utility Functions

For pure computation modules, use TDD (Red-Green):

1. **Red**: Write failing tests that define the expected behavior
2. **Green**: Implement the function to make tests pass
3. **Commit separately**: `test: add failing tests for X` then `feat: implement X`

This is especially valuable for math-heavy functions (financial calculations, data transformations) where edge cases matter.

### Testing Gotchas

- **Node 18 compatibility**: `crypto.randomUUID()` is not available in Node 18 test environments. Use counter-based IDs in tests.
- **Test isolation**: Never import real providers in tests — mock the data layer.

---

## 8. Deployment & Configuration

### Environment Variables

```
NEXT_PUBLIC_DATA_SOURCE=mock|api  # Switch data source
NEXT_PUBLIC_API_URL=...           # API base URL (if separate backend)
```

**Rule**: Only `NEXT_PUBLIC_*` vars are available in browser code. Keep secrets (API keys) in server-only env vars.

### Vercel Deployment

- **Auto-deploy**: Push to `main`/`master` triggers build
- **Build time**: ~50-60 seconds for a medium Next.js app
- **Serverless functions**: API routes become serverless functions — they run in AWS, which some APIs block (e.g., Binance blocks AWS IPs)
- **Cache**: `s-maxage` in response headers enables Vercel's CDN edge caching

### Known Deployment Issues

- **Blocked APIs from Vercel**: Some services (Binance, certain payment providers) block requests from cloud provider IPs. Solutions: use a proxy, switch to a cloud-friendly API (CoinGecko), or deploy the BFF elsewhere.
- **Environment variable propagation**: Vercel caches builds — changing an env var requires a redeploy, not just a restart.

---

## 9. Development Workflow

### The Build Loop

```
1. Discuss scope → Define what this phase delivers (not how)
2. Research       → Read relevant code, check library APIs, identify unknowns
3. Plan           → Break into 2-4 tasks with clear deliverables
4. Execute        → Build each task, commit atomically
5. Verify         → Run tests, check types, visual inspection
6. Human check    → User reviews on device, approves or requests changes
```

### Commit Convention

```
feat(phase): description    — New feature
fix(phase): description     — Bug fix
test(phase): description    — Test addition
docs(phase): description    — Documentation
chore(phase): description   — Build/config changes
```

### Decision-Making Criteria

When choosing between options, evaluate in this order:

1. **Simplicity**: Does it solve the problem without over-engineering?
2. **Existing patterns**: Does the codebase already have a convention for this?
3. **Future-proofing**: Does it create a seam for future changes without building for them now?
4. **Dependencies**: Does it avoid adding new dependencies when existing ones suffice?
5. **User experience**: Does it prioritize what the end user sees and feels?

### Anti-patterns to Avoid

- **Don't build for hypothetical futures**: Build what's needed now. A `version` field on a Zustand persist store is enough forward-compatibility — you don't need a migration framework.
- **Don't abstract prematurely**: Three similar lines of code is better than a premature utility function. Extract when you see the pattern a third time.
- **Don't mock in integration tests**: If the test is supposed to verify the real data flow, use the real thing. Mocks hide bugs.
- **Don't add config flags for one-off variations**: If there's only one place that needs different behavior, just write different code there.
- **Don't define shared types speculatively**: Only extract a type to `types/index.ts` when it's actually imported by 2+ consumers. Speculative shared types accumulate naming drift and dead code. <!-- Added from crypto-dashboard retrospective -->
- **Don't over-specify interfaces at definition time**: Only add methods to an interface when there is a concrete caller. A `getCurrentPrice()` method on a DataProvider that nothing calls is dead code from day one. <!-- Added from crypto-dashboard retrospective -->
- **Don't add parallel API calls without budgeting rate limits**: Adding a second parallel fetch effectively halves your calls-per-minute budget. Calculate total request volume before implementing. <!-- Added from crypto-dashboard retrospective -->
- **Don't defer form service validation to deployment**: If a contact form is the primary conversion mechanism, test it with a real endpoint during development. A form that silently simulates success is untestable until it fails in production. <!-- Added from 3d-printing-landing retrospective -->

---

## 10. Common Issues and Fixes

### Build & Dependency Issues

| Issue | Diagnosis | Fix |
|-------|----------|-----|
| `crypto.randomUUID()` not available | Node 18 doesn't expose this in all contexts | Use counter-based IDs or `Math.random().toString(36)` |
| Tailwind v4 classes not applying | Missing `@theme inline` block or wrong import | Ensure `@import "tailwindcss"` and `@theme inline` section maps vars |
| shadcn component conflicts with base-ui | shadcn uses Radix; mixing with @base-ui causes API clashes | Use native HTML elements instead of conflicting primitives |
| vitest 4.x fails on Node 18 | Requires Node >= 20 | Pin to vitest 1.6.0 |
| Next.js 15 `params` is now a Promise | Breaking change from 14 → 15 | `const { id } = await params;` in route handlers |
| Tailwind v4 `dark:` utilities have no effect | `@custom-variant dark` not configured | Add `@custom-variant dark (&:is(.dark *));` to globals.css <!-- Added from crypto-dashboard retrospective --> |
| Tailwind v4 custom animations not working | Keyframes in `@theme inline {}` instead of `@theme {}` | Put keyframes in `@theme {}` (generates utilities); put CSS var mappings in `@theme inline {}` <!-- Added from crypto-dashboard retrospective --> |
| Vite fails on Node 18 with rolldown error | Vite 5.4+ requires Node 20+ | Pin `"vite": "5.3.6"` via npm overrides in package.json <!-- Added from crypto-dashboard retrospective --> |
| `@tailwindcss/oxide` fails on Linux/Node 18 | Native platform binary not resolved as optional dep | Add `@tailwindcss/oxide-linux-x64-gnu` as explicit dependency <!-- Added from crypto-dashboard retrospective --> |
| vitest + Tailwind v4 PostCSS conflict | String-form PostCSS plugin incompatible with vitest env | `css: { postcss: { plugins: [] } }` in vitest.config.mts <!-- Added from crypto-dashboard retrospective --> |
| npm rejects project directory name | Capital letters, underscores, or special chars in directory name | Pre-validate: lowercase letters, hyphens, numbers only. Use temp dir + move if needed. <!-- Added from 3d-printing-landing retrospective --> |
| middleware.ts at project root ignored (--src-dir) | Next.js --src-dir layout expects middleware at src/middleware.ts, not root | Move to src/middleware.ts; use relative imports for Edge runtime compat <!-- Added from 3d-printing-landing retrospective --> |
| Build fails on template-level non-code directories | tsconfig **/*.ts glob includes skills/, docs/, scripts/ in the project template | Add non-code dirs to tsconfig "exclude": ["node_modules", "skills", "docs"] <!-- Added from 3d-printing-landing retrospective --> |
| .env.example missing from repo | First env var added without creating documentation | Create .env.example in same commit as first env var usage <!-- Added from 3d-printing-landing retrospective --> |

### Runtime Issues

| Issue | Diagnosis | Fix |
|-------|----------|-----|
| Chart crashes in React StrictMode | `series` refs become stale after double-mount/unmount | Clear series refs in cleanup function |
| Canvas library ignores CSS variables | Canvas renders outside the DOM's CSS cascade | Maintain a hex color theme object, update imperatively on theme change |
| Layout shift on data load | Container size changes when data arrives | Use fixed heights or skeleton placeholders that match final dimensions |
| API works locally but not on Vercel | External API blocks cloud provider IPs | Use a cloud-friendly API or proxy |
| Dropdown items not responding to clicks | Wrong event handler (`onSelect` vs `onClick`) | Check the component library's actual event API (Base UI vs Radix) |
| Component crashes with context error | Base UI `GroupLabel` requires `Menu.Group` parent | Check composition rules — they differ between component libraries |
| Stale closure in event handlers | `useEffect` captures old state in callback | Use `useRef` for lookup maps that change independently of the handler lifecycle |
| OHLCV row causes layout jitter on hover | Conditionally rendered crosshair info changes height | Use `invisible` class to reserve height; show/hide with opacity, not mount/unmount |
| Volume bars invisible in light mode | Colors hardcoded to dark theme hex values | Accept theme-aware colors as params; compute from `resolvedTheme` |
| `useSearchParams` crashes in Next.js 15 | nuqs/useSearchParams requires Suspense boundary | Wrap with `<Suspense fallback={...}>` |
| Native `<select>` text invisible in dark themes | `text-white` inherits to `<option>`; browser renders native dropdown with light background | Add `[color-scheme:dark]` class to `<select>` to force browser dark-mode native rendering <!-- Added from crypto-dashboard retrospective --> |
| Header/nav controls shift when dynamic content appears left | Controls in left-to-right flex row shift right when left content width changes | Group controls in `ml-auto` div — always right-anchor controls that should be fixed in position <!-- Added from crypto-dashboard retrospective --> |
| `React.MutableRefObject` TypeScript error in React 19 | `MutableRefObject` deprecated; `RefObject` is now mutable by default | Use `React.RefObject<T>` instead of `React.MutableRefObject<T>` <!-- Added from crypto-dashboard retrospective --> |
| TanStack Query v5 skeleton gate doesn't trigger | Using `isLoading` instead of `isPending` | In TanStack v5, `isPending` = "no data yet" (skeleton gate); `isLoading` = "fetching + no data" — use `isPending` for the "show skeleton" check <!-- Added from crypto-dashboard retrospective --> |
| Combobox/popup content clipped to one line | `overflow-hidden` on the popup element clips scrollable children | Never put `overflow-hidden` on a popup container that has a scrollable child list — let the inner list handle `overflow-y-auto` <!-- Added from crypto-dashboard retrospective --> |
| ThemeProvider starts in light mode for dark-first UI | `enableSystem` defaults to `true`, uses OS preference | Set `enableSystem={false}` and `defaultTheme="dark"` for dashboards that are always dark <!-- Added from crypto-dashboard retrospective --> |
| z.coerce.number() breaks zodResolver type inference | z.coerce changes inferred input type to unknown; z.infer<> propagates this to useForm<> | Define explicit type manually instead of z.infer<>: type QuoteFormData = { quantity: number; ... } <!-- Added from 3d-printing-landing retrospective --> |
| Radix/shadcn Select (and similar) reject register() | react-hook-form register() requires native DOM inputs with ref/onChange/name; Radix Select is controlled | Use <Controller> for any non-native input: Select, Switch, RadioGroup, DatePicker, Combobox <!-- Added from 3d-printing-landing retrospective --> |
| Translation keys missing when client component renders | Wave ordering placed message file updates in task 2, but component needing the keys was in task 1 | When splitting into server/client waves, verify all translation keys exist BEFORE (or in same task as) the component that needs them <!-- Added from 3d-printing-landing retrospective --> |
| External form service untested with real endpoint | Formspree/Resend URL not configured during dev; form used simulated success throughout | Create the form endpoint during the phase that builds the form. Test a real submission before marking the phase complete. <!-- Added from 3d-printing-landing retrospective --> |

### Data Issues

| Issue | Diagnosis | Fix |
|-------|----------|-----|
| Prices missing for "today" | Daily candle not closed until end of UTC day | Fall back to most recent available candle |
| Chart shows flat line for future dates | No data points for dates after last candle | Return sentinel data point (e.g., `{ time: cutoff, value: 0 }`) instead of empty array |
| Time series gaps | Not all assets have data for every date | Forward-fill: carry last known price forward |
| Mock data doesn't respond to interval changes | Mock provider ignores interval parameter | Route sub-daily intervals to hourly dataset |
| API returns different field count than expected | Assumed endpoint returns all fields (e.g., OHLCV) | Always check actual JSON response shape — many APIs omit fields (e.g., CoinGecko /ohlc has no volume) <!-- Added from crypto-dashboard retrospective --> |

---

## 11. Performance Standards

### Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): 0 (use skeletons)

### Implementation Patterns

- **Skeleton loading**: Every data-dependent section should show a skeleton that matches the final layout dimensions
- **No layout shifts**: Use fixed heights for containers, `tabular-nums` for number columns
- **Stale-while-revalidate**: Show cached data immediately, refresh in background
- **Lazy loading**: Only load heavy libraries (charting, maps) on pages that use them
- **Image optimization**: Use `next/image` or equivalent framework image component

---

## 12. Quality Checklist (Pre-Delivery)

Run this before considering any milestone complete:

```
[ ] TypeScript compiles with zero errors (npx tsc --noEmit)
[ ] All tests pass (npm test)
[ ] No console errors in browser dev tools
[ ] Dark mode and light mode both look correct
[ ] Loading states show skeletons, not blank screens
[ ] Error states show helpful messages, not crashes
[ ] URL state is shareable (copy URL, paste in new tab, same view)
[ ] Mobile viewport doesn't overflow horizontally
[ ] Numbers are formatted consistently (currency, percentage, dates)
[ ] No hardcoded strings that should be in constants or config
[ ] Git history is clean (atomic commits, conventional messages)
```

---

## 13. Technology Preferences

These are defaults based on proven results. Override when project requirements demand it.

| Category | Default Choice | Why |
|----------|---------------|-----|
| Framework | Next.js 15 (App Router) | Best DX, Vercel deployment, API routes built in |
| Language | TypeScript (strict) | Type safety prevents entire categories of bugs |
| Styling | Tailwind v4 | Utility-first, design tokens via CSS vars, tiny bundle |
| UI Components | shadcn/ui | Copy-paste ownership, no version lock-in, Tailwind native |
| Server State | TanStack Query v5 | Caching, polling, stale-while-revalidate for free |
| Client State | Zustand v5 | Minimal API, persist middleware, no boilerplate |
| URL State | nuqs | Type-safe URL search params, Next.js integrated |
| Testing | vitest | Fast, ESM-native, Jest-compatible API |
| Icons | lucide-react | Tree-shakeable, consistent style, large library |
| Charts | lightweight-charts (TradingView) | Canvas performance, financial chart features |
| Deployment | Vercel | Zero-config Next.js deployment |

---

*Last updated: 2026-03-22 — retrospective additions from 3D Printing Barcelona landing page project*
