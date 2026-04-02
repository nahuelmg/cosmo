# State Management Libraries

> Last verified: 2026-03-16 in production.

## Comparison

| Library | Bundle | Boilerplate | Persistence | DevTools | Best For |
|---------|--------|------------|-------------|----------|----------|
| **Zustand v5** | ~1KB | Minimal | Built-in middleware | Via devtools ext | Client-side state, small-medium apps |
| **Redux Toolkit** | ~11KB | Medium | Manual (redux-persist) | Excellent | Large apps, complex state logic |
| **Jotai** | ~3KB | Minimal | Manual | Basic | Atomic state, many independent atoms |
| **Recoil** | ~80KB | Medium | Manual | Good | Facebook-style derived state |
| **Valtio** | ~3KB | Minimal | Manual | Basic | Mutable-style API |

## Recommendation

**Zustand v5** for most web projects. Reasons:
- Tiny bundle, zero boilerplate
- `persist` middleware handles localStorage with versioning for free
- Works outside React (useful for testing)
- No Provider wrapper needed

## Zustand Patterns Validated

**Persisted store (survives refresh)**:
```typescript
export const usePortfolioStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
    }),
    { name: 'storage-key', version: 1 }
  )
);
```

**Ephemeral store (UI state only)**:
```typescript
export const useComparisonStore = create<State>((set) => ({
  selectedIds: [],
  toggle: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter(i => i !== id)
      : [...s.selectedIds, id],
  })),
}));
```

**Key lesson**: Set `version: 1` on persisted stores even if you don't need migrations yet — it enables them later without a breaking change.

---

## Server State: TanStack Query v5

Not a state manager — it's a **data fetching/caching layer**. Use alongside Zustand.

| Feature | How It Works |
|---------|-------------|
| Caching | `queryKey` determines cache identity |
| Polling | `refetchInterval: 60_000` — background refetch |
| Stale tolerance | `staleTime: 30_000` — serves cache for 30s without spinner |
| Error resilience | Failed refetch preserves last good data |
| Parallel queries | `useQueries()` for N queries in parallel |
| DevTools | `@tanstack/react-query-devtools` — toggle in browser |

**Pattern**: Per-hook config (not global). Global `staleTime: Infinity` for mock mode, per-hook override for live polling:
```typescript
useQuery({
  queryKey: ['asset', id],
  queryFn: () => dataProvider.getAsset(id),
  staleTime: 30_000,
  refetchInterval: 60_000,
});
```

---

## URL State: nuqs

For state that should be shareable/bookmarkable (current page, filters, selected item):

```typescript
const [range, setRange] = useQueryState('range', parseAsString.withDefault('1M'));
```

**Gotcha**: In Next.js 15, `useSearchParams` (used internally by nuqs) requires a `<Suspense>` boundary.

---

*Last verified: 2026-03-18*
