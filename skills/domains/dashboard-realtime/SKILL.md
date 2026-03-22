# Domain Skill: Real-Time Data Dashboard

> Consult this skill when a project involves dashboards, real-time data display, financial charts, or data visualization. Ignore for static sites, landing pages, or content-heavy projects.

## When to Apply This Skill

- Price/stock/crypto dashboards
- Monitoring dashboards (server health, IoT, analytics)
- Any UI showing data that updates periodically
- Financial data visualization (candlesticks, OHLCV, time series)
- Portfolio trackers or investment tools

---

## 1. Charting Library Selection

### Decision Matrix

| Library | Best For | Avoid When |
|---------|----------|------------|
| **Lightweight Charts (TradingView)** | Financial charts, candlesticks, high-performance time series | Non-financial charts, pie/bar/scatter |
| **Recharts** | Standard dashboards, bar/line/pie charts | High-frequency updates, 10K+ data points |
| **D3.js** | Custom, unconventional visualizations | You need something standard — too low-level |
| **Chart.js** | Simple charts, quick prototypes | Complex interactions, financial data |
| **Visx** | React-native D3 wrappers, custom charts | Simple use cases where Recharts suffices |

### Lightweight Charts v5 Specifics

**Critical API patterns:**
```typescript
// Create chart
const chart = createChart(container, { width, height, ...options });
const series = chart.addSeries(CandlestickSeries, styleOptions);
series.setData(ohlcvData);

// Markers (v5 — NOT series.setMarkers which was removed)
import { createSeriesMarkers } from 'lightweight-charts';
const markersPlugin = createSeriesMarkers(series, markers);
// Update: markersPlugin.setMarkers(newMarkers);

// Crosshair tooltip
chart.subscribeCrosshairMove((param) => {
  const hoveredId = param.hoveredObjectId; // marker ID
  const time = param.time; // current crosshair time
  // Use hoveredObjectId for marker detection, time as fallback
});
```

**Dark/light theme handling:**
```typescript
// Canvas can't read CSS variables — maintain a hex theme object
const CHART_THEMES = {
  dark: {
    background: '#1a1a1a',
    text: '#d1d5db',
    grid: '#2d2d2d',
    upColor: '#26a69a',
    downColor: '#ef5350',
  },
  light: {
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb',
    upColor: '#26a69a',
    downColor: '#ef5350',
  },
};

// Apply on theme change
chart.applyOptions({
  layout: { background: { color: theme.background }, textColor: theme.text },
  grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
});
```

**React integration pattern:**
```typescript
export function ChartComponent({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, options);
    chartRef.current = chart;
    const series = chart.addSeries(CandlestickSeries);
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null; // Clear refs to prevent StrictMode crash
    };
  }, []);

  // Update data separately
  useEffect(() => {
    seriesRef.current?.setData(data);
  }, [data]);

  return <div ref={containerRef} />;
}
```

**Common pitfalls:**
- Always clear series refs in cleanup — React StrictMode double-mounts cause crashes otherwise
- Use `useRef` for lookup maps accessed in `subscribeCrosshairMove` — avoids stale closures
- `ISeriesMarkersPluginApi<Time>` not `<unknown>` — TypeScript generics must match
- Empty data array makes chart render blank canvas — use sentinel data point instead

<!-- Added from crypto-dashboard retrospective -->
**Critical: `subscribeCrosshairMove` fires synchronously during `setData()`**

This is not documented prominently but is the source of two classes of bugs:

1. **Infinite loop**: If `setData()` fires the crosshair callback → callback updates state → re-render → effect calls `setData()` again → repeat. Fix: use a `prevDataRef` to skip `setData()` when data reference hasn't changed.

2. **Stale series ref**: When switching chart types (remove old series, add new), calling `newSeries.setData(data)` before updating `seriesRef.current = newSeries` means the crosshair callback reads the stale ref → `param.seriesData.get(oldSeries)` returns undefined → crosshair shows dashes. **Always update `seriesRef.current = newSeries` BEFORE calling `newSeries.setData(data)`.**

```typescript
// WRONG — crosshair fires during setData, reads old/removed series
const newSeries = chart.addSeries(LineSeries, options)
newSeries.setData(lineData)          // ← crosshair fires here with stale ref
priceSeriesRef.current = newSeries   // ← too late

// CORRECT
const newSeries = chart.addSeries(LineSeries, options)
priceSeriesRef.current = newSeries   // ← update ref first
newSeries.setData(lineData)          // ← crosshair now reads correct ref
```

**`prevDataRef` pattern for multi-series charts (breaks the infinite loop):**

```typescript
const prevDataRef = useRef<Map<string, DataType[] | undefined>>(new Map())

// In effect:
if (prevDataRef.current.get(assetId) !== queryResult.data) {
  prevDataRef.current.set(assetId, queryResult.data)
  series.setData(queryResult.data ?? [])
}
// On series removal:
prevDataRef.current.delete(assetId)
```

---

## 2. Data Pipeline Architecture

### OHLCV Data Flow

```
External API (Binance, Yahoo, etc.)
    ↓ Server-side fetch (BFF route)
    ↓ Map to typed OHLCVPoint[]
    ↓ Cache-Control headers (60s CDN cache)
    ↓
Client-side (TanStack Query)
    ↓ queryKey: ['priceHistory', assetId, range, interval]
    ↓ staleTime: 30_000 (serve from cache for 30s)
    ↓ refetchInterval: 60_000 (poll every 60s)
    ↓
Hook (useAsset, usePriceHistory)
    ↓ Returns { data, isPending, isError, dataUpdatedAt }
    ↓
Component
    ↓ Renders chart, handles loading/error states
```

### Multi-Asset Parallel Fetching

```typescript
// Fetch price history for N assets in parallel
const results = useQueries({
  queries: assetIds.map(id => ({
    queryKey: ['priceHistory', id, 'ALL', '1d'],
    queryFn: () => dataProvider.getPriceHistory(id, 'ALL', '1d'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })),
});

const allLoaded = results.every(r => r.data);
const anyError = results.some(r => r.isError);
```

### Time Range and Interval Management

**Range**: How much history to show (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
**Interval**: Candle size (1m, 5m, 15m, 1h, 4h, 1d)

```typescript
// Default interval per range — user can override
const DEFAULT_INTERVAL: Record<TimeRange, CandleInterval> = {
  '1H': '1m',   // 60 one-minute candles
  '1D': '1h',   // 24 hourly candles
  '1W': '1h',   // 168 hourly candles
  '1M': '1d',   // 30 daily candles
  '3M': '1d',
  '6M': '1d',
  '1Y': '1d',
  'ALL': '1d',  // 1000 daily candles (Binance limit)
};
```

**Limit computation:**
```typescript
function computeLimit(range: TimeRange, interval: string): number {
  if (range === 'ALL') return 1000; // Binance max
  return Math.min(1000, Math.ceil(RANGE_MS[range] / INTERVAL_MS[interval]));
}
```

### Full-Then-Filter Pattern

For features like portfolio charts where the user changes the display range frequently:

```typescript
// Fetch ALL data once
const fullSeries = useMemo(() => computeTimeSeries(transactions, priceHistories), [deps]);

// Filter client-side based on selected range
const filteredData = useMemo(() => {
  if (range === 'ALL') return fullSeries.data;
  const cutoff = Date.now() / 1000 - RANGE_SECONDS[range];
  return fullSeries.data.filter(p => p.time >= cutoff);
}, [fullSeries, range]);
```

**Why**: Avoids re-fetching data when user clicks different range buttons. Compute once, filter instantly.

---

## 3. Binance API Integration

### Endpoints Used

| Endpoint | Purpose | Rate Limit |
|----------|---------|-----------|
| `GET /api/v3/klines` | OHLCV candlestick data | 1200/min |
| `GET /api/v3/ticker/24hr` | Current price, 24h change, volume | 1200/min |

### Symbol Mapping

```typescript
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  solana: 'SOLUSDT',
  // ... map app IDs to Binance trading pairs
};
```

### Kline Response Mapping

```typescript
// Binance returns arrays of arrays — map to typed objects
function mapKlineToOHLCV(kline: unknown[]): OHLCVPoint {
  return {
    timestamp: kline[0] as number,   // Open time (ms)
    open: parseFloat(kline[1] as string),
    high: parseFloat(kline[2] as string),
    low: parseFloat(kline[3] as string),
    close: parseFloat(kline[4] as string),
    volume: parseFloat(kline[5] as string),
  };
}
```

### Known Issues

- **Binance blocks AWS/Vercel IPs**: Serverless functions from Vercel (running on AWS) get 451/403 errors. Solutions: use CoinGecko instead, set up a proxy, or deploy BFF elsewhere.
- **No `startTime` in request**: Binance returns the most recent `limit` candles. For historical data at specific dates, you'd need `startTime` parameter.
- **Daily candle not closed until UTC midnight**: Today's candle isn't available until end of day. Fall back to yesterday's close for "current day" lookups.

---

## 4. Portfolio / Transaction Tracking

### Data Model

```typescript
interface Transaction {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  amount: number;
  pricePerUnit: number;
  date: string; // ISO date (YYYY-MM-DD)
}
```

### Portfolio Math (Pure Functions)

```typescript
// Weighted average cost basis
computePortfolioSummary(transactions, priceMap) → {
  holdings: Map<assetId, { quantity, avgCost, currentValue, unrealizedPnl }>,
  totalValue, totalInvested, totalPnl, totalPnlPercent
}

// Time series for portfolio chart
computePortfolioTimeSeries(transactions, priceHistories) → {
  data: { time, value }[],
  markers: { time, type, assetId, amount, pricePerUnit }[]
}
```

**Key decisions:**
- `totalInvested` = current cost basis (qty * avgCost), not historical sum of all buys
- Sells exceeding buys clamp quantity to 0 (no negative holdings)
- Assets missing from price map are silently skipped
- Zero-quantity holdings filtered from display but their realized P&L contributes to totals
- Forward-fill missing prices using last known value per asset

### Marker Visualization

```typescript
// Buy/sell markers on portfolio chart
const markers = transactions.map(tx => ({
  time: dateToTimestamp(tx.date),
  position: tx.type === 'buy' ? 'belowBar' : 'aboveBar',
  color: tx.type === 'buy' ? '#26a69a' : '#ef5350',
  shape: 'circle',
  id: tx.id,
}));

// Group same-day markers — use amber (#f59e0b) for mixed buy/sell
```

---

## 5. Comparison / Normalization

### Normalized % Returns

When overlaying multiple assets on one chart, normalize to percentage returns from a common start point:

```typescript
function normalizeToPercent(data: OHLCVPoint[]): { time: number; value: number }[] {
  const basePrice = data[0].close;
  return data.map(p => ({
    time: p.timestamp / 1000,
    value: ((p.close - basePrice) / basePrice) * 100,
  }));
}
```

### Multi-Series Management

```typescript
// Use Map for O(1) add/remove by asset ID
const seriesMap = useRef(new Map<string, ISeriesApi<'Line'>>());

// Add asset
const series = chart.addSeries(LineSeries, { color, lineWidth: 2 });
series.setData(normalizedData);
seriesMap.current.set(assetId, series);

// Remove asset
const series = seriesMap.current.get(assetId);
if (series) chart.removeSeries(series);
seriesMap.current.delete(assetId);
```

<!-- Added from crypto-dashboard retrospective -->
**`useQueries` result array always has a new reference** — TanStack Query v5 structural sharing operates on individual query results, but the array wrapper returned by `useQueries` is always a new object. Putting `results` directly in `useEffect` dependencies triggers the effect on every render. Use `prevDataRef` to guard each `series.setData()` call individually, rather than trying to stabilize the array reference.

---

## 6. Mock Data Strategy for Dashboards

### What to Mock

- **Daily OHLCV data**: 1000+ real candles from a public API, committed as JSON
- **Hourly data**: 168 points (7 days) for sub-daily interval testing
- **Multi-asset**: Apply price scaling factors to one base dataset for other assets
- **Asset metadata**: Name, symbol, current price derived from latest candle

### Scaling Pattern

```typescript
// Generate 8 assets from 1 real BTC dataset
const MOCK_ASSETS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', priceFactor: 1 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', priceFactor: 0.035 },
  // Price = btcPrice * priceFactor (approximate real ratios)
];
```

### Interval-Aware Mock

```typescript
async getPriceHistory(id, range, interval) {
  // Use hourly data for sub-daily intervals, daily for daily+
  const useHourly = interval && !['1d', '3d', '1w', '1M'].includes(interval);
  const source = useHourly ? this.hourly : this.daily;
  return filterByTimeRange(source, range);
}
```

---

## 7. Number Formatting for Financial Data

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    signDisplay: 'exceptZero', // +$1,234.56 / -$1,234.56
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent', minimumFractionDigits: 2,
  }).format(value / 100);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact', maximumFractionDigits: 2,
  }).format(value);
}
```

**Always use `Intl.NumberFormat`** — never manual string concatenation for numbers. It handles locales, edge cases, and negative formatting correctly.

---

---

<!-- Added from crypto-dashboard retrospective -->
## 8. API Validation Before Phase Planning

Do this BEFORE designing the provider interface and BFF routes for any real-time data API:

```
[ ] Can the API be reached from the target deployment? (Vercel/AWS blocks some APIs)
    — Test: deploy a minimal BFF route to Vercel and curl it, or check the API's known blocklist.
    — Binance REST API returns 451/403 from Vercel. CoinGecko works.

[ ] Does the API return ALL the fields your UI needs from a single endpoint?
    — CoinGecko /ohlc returns [ts, o, h, l, c] — no volume. Volume is a second endpoint.
    — Check the actual JSON response shape in a browser or curl before designing types.

[ ] What granularity does the API use per time range?
    — CoinGecko free /ohlc auto-selects: 30min (1d), 4h (1w/1m), 4-day (6m+).
    — This means "current price" differs across ranges. Design your UI expecting this.

[ ] What is the rate limit and how many requests does your UI make per user interaction?
    — If switching ranges makes 2 parallel requests × 6 ranges = 12 calls, and limit is 30/min,
      you can only support 2.5 users switching simultaneously before hitting limits.

[ ] Does the API require auth, and where does the key live?
    — Client-side = leaked. Server-side BFF = safe. Plan the key location upfront.

[ ] Does the API's free tier cover your UX design?
    — CoinGecko free OHLC only supports 1d candle granularity effectively.
      If your UI shows 1m/5m/1h intervals, they may not work with the free tier.
```

---

## 9. Known Pitfalls (CryptoDash v1.0 Retrospective)

These cost real debugging time. Documenting here so the next dashboard project avoids them:

### Chart Library

| Pitfall | Impact | Solution |
|---------|--------|----------|
| `series.setData()` fires `subscribeCrosshairMove` synchronously | Infinite render loop in multi-series charts | `prevDataRef` pattern: guard each `setData()` with reference equality check |
| Series ref must be updated BEFORE `setData()` when switching types | Crosshair shows `—` for all line/area candles | `seriesRef.current = newSeries` then `newSeries.setData(data)`, never after |
| Empty `data` array crashes on crosshair move | Chart appears blank, broken | Use sentinel data point or guard `setData()` against empty arrays |

### Dark Theme

| Pitfall | Impact | Solution |
|---------|--------|----------|
| Native `<select>` text invisible | Users can't see dropdown options | Add `[color-scheme:dark]` to every `<select>` in dark UIs |
| `ThemeProvider` starts in light mode | Dark dashboard briefly flashes light | `enableSystem={false}` `defaultTheme="dark"` |
| `dark:` utilities do nothing | All dark mode styling missing | `@custom-variant dark (&:is(.dark *))` in globals.css (Tailwind v4 only) |

### Layout

| Pitfall | Impact | Solution |
|---------|--------|----------|
| Header controls shift when OHLCV values appear | Jarring UX every time user hovers chart | Right-anchor all controls with `ml-auto` — never let dynamic left content push controls |
| Popup/dropdown content clipped | Combobox shows 1 item only | Never use `overflow-hidden` on a popup container with a scrollable child list |

### API Integration

| Pitfall | Impact | Solution |
|---------|--------|----------|
| Entire API provider invalid (Binance blocked) | Phase 7 replanned | Spike API connectivity from Vercel before designing the data layer |
| Missing fields (CoinGecko has no volume) | Volume always 0 in live mode | Check actual JSON response before designing types |
| Price inconsistency across ranges | User confusion | Document as expected behavior from auto-granularity; not all APIs work the same way |
| Parallel requests double rate limit consumption | Rate limit hit 2x faster | Budget total requests per user action before adding parallel fetches |

---

*Last updated: 2026-03-21 — retrospective additions from CryptoDash v1.0 project*
