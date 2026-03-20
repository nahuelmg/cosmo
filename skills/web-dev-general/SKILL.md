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

### Data Issues

| Issue | Diagnosis | Fix |
|-------|----------|-----|
| Prices missing for "today" | Daily candle not closed until end of UTC day | Fall back to most recent available candle |
| Chart shows flat line for future dates | No data points for dates after last candle | Return sentinel data point (e.g., `{ time: cutoff, value: 0 }`) instead of empty array |
| Time series gaps | Not all assets have data for every date | Forward-fill: carry last known price forward |
| Mock data doesn't respond to interval changes | Mock provider ignores interval parameter | Route sub-daily intervals to hourly dataset |

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

*Last updated: 2026-03-20 — extracted from Asset Price Dashboard project (v1.0–v1.3)*
