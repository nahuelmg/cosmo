# Binance REST API

> Source: Asset Dashboard project (2026-03-17). Verified in production.

## Overview

Free public API, no authentication required for market data. 1200 requests/minute rate limit.

**Base URL**: `https://api.binance.com/api/v3`

## Endpoints Used

### GET /klines — OHLCV Candlestick Data

```
/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000
```

| Param | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair (e.g., `BTCUSDT`, `ETHUSDT`) |
| `interval` | string | Candle size: `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M` |
| `limit` | number | Max 1000 rows (default 500) |
| `startTime` | number | Optional — ms timestamp for range start |
| `endTime` | number | Optional — ms timestamp for range end |

**Response**: Array of arrays (not objects):
```json
[
  [1609459200000, "29000.00", "29600.00", "28800.00", "29300.00", "15000.5", ...],
  // [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, ...]
]
```

**Mapping**:
```typescript
function mapKlineToOHLCV(kline: unknown[]): OHLCVPoint {
  return {
    timestamp: kline[0] as number,       // Open time in milliseconds
    open: parseFloat(kline[1] as string),
    high: parseFloat(kline[2] as string),
    low: parseFloat(kline[3] as string),
    close: parseFloat(kline[4] as string),
    volume: parseFloat(kline[5] as string),
  };
}
```

### GET /ticker/24hr — Current Price & 24h Stats

```
/api/v3/ticker/24hr?symbol=BTCUSDT
```

**Response** (key fields):
```json
{
  "symbol": "BTCUSDT",
  "lastPrice": "94591.79",
  "priceChange": "1023.45",
  "priceChangePercent": "1.09",
  "highPrice": "97000.00",
  "lowPrice": "92000.00",
  "volume": "15234.567",
  "quoteVolume": "1432567890.12"
}
```

All numeric values are **strings** — parse with `parseFloat()`.

## Symbol Map

```typescript
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  solana: 'SOLUSDT',
  cardano: 'ADAUSDT',
  polkadot: 'DOTUSDT',
  avalanche: 'AVAXUSDT',
  chainlink: 'LINKUSDT',
  polygon: 'MATICUSDT',
};
```

## Limit Computation

Without `startTime`, Binance returns the **most recent** `limit` candles:

```typescript
function computeLimit(range: TimeRange, interval: string): number {
  if (range === 'ALL') return 1000;
  return Math.min(1000, Math.ceil(RANGE_MS[range] / INTERVAL_MS[interval]));
}
```

## Known Issues

### Binance blocks Vercel/AWS IPs
**Severity**: Blocker for production
**Symptom**: 451 or 403 errors from Binance when BFF route runs on Vercel serverless functions
**Cause**: Binance blocks requests from cloud provider IP ranges (AWS, GCP)
**Solutions**:
1. Use a different API (CoinGecko — free, cloud-friendly)
2. Set up a proxy on a VPS
3. Deploy the BFF separately (not on Vercel)
4. Use mock data for demo/portfolio purposes

### Daily candle not available for "today"
**Symptom**: Price lookup for today's date returns no match
**Cause**: Daily candle closes at UTC midnight — until then, no candle for today
**Fix**: Fall back to `points.at(-1)` (yesterday's close)

### No market cap in klines
**Symptom**: `marketCap` field always 0
**Cause**: Binance doesn't provide market cap data in ticker/klines endpoints
**Workaround**: Set to 0 or fetch from CoinGecko separately

### Rate limiting
**Rate**: 1200 requests/minute (IP-based)
**Mitigation**: BFF pattern with server-side caching (`Cache-Control: s-maxage=60`) reduces client requests to ~1/minute per asset

---

*Last verified: 2026-03-18*
