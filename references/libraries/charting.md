# Charting Libraries

> Last verified: 2026-03-16 in production.

## Comparison

| Library | Type | Performance | Financial Charts | Bundle Size | Learning Curve |
|---------|------|------------|-----------------|-------------|---------------|
| **Lightweight Charts (TradingView)** | Canvas | Excellent (10K+ points) | Native (candlestick, OHLCV) | ~45KB | Medium |
| **Recharts** | SVG/DOM | Good (< 5K points) | Basic (line, bar, area) | ~120KB | Low |
| **Chart.js** | Canvas | Good | Basic | ~60KB | Low |
| **D3.js** | SVG/DOM | Depends on implementation | Manual | ~80KB | High |
| **Visx** | SVG (React) | Good | Manual | ~varies | Medium |
| **Nivo** | SVG (React/D3) | Good | No | ~large | Low |

## Recommendation

- **Financial/time-series data** → Lightweight Charts v5
- **Standard dashboards (bar, pie, line)** → Recharts
- **Highly custom visualizations** → D3 or Visx
- **Quick prototypes** → Chart.js

## Lightweight Charts v5 Notes

**Install**: `npm install lightweight-charts`

**Key APIs**:
- `createChart(container, options)` — creates chart instance
- `chart.addSeries(CandlestickSeries | LineSeries | AreaSeries | HistogramSeries)`
- `series.setData(data)` — set OHLCV or line data
- `createSeriesMarkers(series, markers)` — v5 marker API (replaces removed `series.setMarkers()`)
- `chart.subscribeCrosshairMove(callback)` — tooltip/hover data
- `chart.applyOptions(options)` — update theme, grid, etc.

**Gotchas**:
- Canvas cannot read CSS variables — must pass hex/rgb colors imperatively
- React StrictMode double-invokes cleanup — null out series refs in useEffect return
- `hoveredObjectId` in crosshair callback can be inconsistent — use time-based fallback lookup
- Empty data array renders blank canvas — use sentinel data point instead
- Volume pane: use `priceScaleId: 'volume'` with `scaleMargins` for split layout

**TypeScript**:
- Use `Time` type (not `number`) for timestamps
- `ISeriesMarkersPluginApi<Time>` not `<unknown>`
- OHLCV data shape: `{ time: UTCTimestamp, open, high, low, close }`

**Theme switching**:
```typescript
const CHART_THEMES = {
  dark: { background: '#1a1a1a', text: '#d1d5db', grid: '#2d2d2d' },
  light: { background: '#ffffff', text: '#1f2937', grid: '#e5e7eb' },
};
// Apply via chart.applyOptions() on theme change
```

---

*Last verified: 2026-03-18*
