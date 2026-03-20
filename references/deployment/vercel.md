# Vercel Deployment

> Source: Asset Dashboard project (2026-03-17). Verified in production.

## Setup

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main/master triggers auto-deploy
4. Build time: ~50-60 seconds for a medium Next.js app

## Environment Variables

- Set in Vercel dashboard → Settings → Environment Variables
- `NEXT_PUBLIC_*` vars available in browser code
- Non-prefixed vars only available in server-side code (API routes, SSR)
- Changing an env var requires **redeploy** (not just restart)

## Caching

### Server-Side (CDN Edge Cache)
```typescript
// In API route handlers
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59',
};
return Response.json(data, { headers: CACHE_HEADERS });
```

### Static Routes (ISR)
```typescript
// In route.ts — for routes WITHOUT query params
export const revalidate = 60; // seconds
```

**Note**: Routes with query params (e.g., `?range=1M`) are automatically **dynamic** in Next.js 15. Use `Cache-Control` headers instead of `revalidate` export for these.

## Serverless Functions

- API routes (`app/api/`) become serverless functions
- Run on AWS Lambda (Node.js runtime)
- Cold start: ~200-500ms
- Timeout: 10 seconds (free tier), 60s (pro)
- Memory: 1024MB default

## Known Issues

### External APIs blocking Vercel IPs
**Affected**: Binance, some payment providers, some geolocation APIs
**Cause**: Vercel runs on AWS — some services block cloud provider IP ranges
**Symptom**: 403, 451, or connection timeout from external API
**Solutions**:
1. Use a cloud-friendly API alternative
2. Route through a proxy on a VPS
3. Deploy the BFF portion separately

### Build cache issues
**Symptom**: Old code appears after deploy despite pushing new commits
**Fix**: Vercel dashboard → Deployments → redeploy latest, or clear build cache in Project Settings

### Edge function limitations
- No access to file system
- No native Node.js modules
- 1MB code size limit
- Use standard serverless functions (not Edge) for most BFF routes

---

*Last verified: 2026-03-18*
