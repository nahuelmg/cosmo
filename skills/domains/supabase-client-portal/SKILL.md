# Domain Skill: Supabase Client Portal (Next.js App Router)

> Apply this skill alongside `web-dev-general/SKILL.md` when building an authenticated client portal with Supabase + Next.js App Router. Covers auth setup, middleware chaining with next-intl, RLS patterns, file uploads via signed URLs, and the portal/admin architecture. Extracted from dime.ar v2.0 milestone.

## When to Apply

- Agency/SaaS sites needing a client-facing portal behind authentication
- Projects with admin + client role separation
- Next.js App Router + Supabase Auth + Row Level Security
- Projects using next-intl that need authenticated routes outside the locale tree
- File sharing via Supabase Storage with signed URLs

---

## 1. Supabase Foundation

### Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Do NOT use** `@supabase/auth-helpers-nextjs` — it is deprecated.

### Client Utilities (4 files)

All in `src/lib/supabase/`:

| File | Purpose | Key Detail |
|------|---------|------------|
| `client.ts` | Browser client (`createBrowserClient`) | Singleton internally — safe to call anywhere |
| `server.ts` | Server client for RSC/Actions/Route Handlers | Must `await cookies()` (Next.js 15), create per-request (never module-level) |
| `middleware.ts` | `updateSession` helper | Accepts optional `NextResponse` for chaining with next-intl |
| `admin.ts` | Service role client | `SUPABASE_SERVICE_ROLE_KEY` — NO `NEXT_PUBLIC_` prefix, never client-side |

### Cookie API

Use `getAll/setAll` (current since @supabase/ssr v0.5+). The old `get/set/remove` API is deprecated and will cause TypeScript errors.

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only!
```

---

## 2. Middleware Chaining (next-intl + Supabase)

**This is the highest-risk integration point.** Both next-intl and Supabase need to run in middleware. The pattern:

```typescript
import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Portal/admin routes skip next-intl (outside [locale] tree)
  if (pathname.startsWith('/portal') || pathname.startsWith('/admin')) {
    return await updateSession(request);
  }

  // Marketing routes: i18n first, then Supabase session refresh
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: '/((?!api|trpc|auth|_next|_vercel|.*\\..*).*)',
};
```

**Critical details:**
- `/auth` excluded from matcher — PKCE callback must never be locale-prefixed
- `/portal` and `/admin` skip next-intl but still get Supabase session refresh
- `updateSession` accepts optional `existingResponse` — Supabase writes cookies onto the same response next-intl produced
- Named async export (not `export default`) required for composition

---

## 3. Auth: getUser() vs getSession()

**Always use `getUser()` for server-side auth checks.** This is a security-critical decision.

| Method | What it does | Use when |
|--------|-------------|----------|
| `getUser()` | Validates JWT with Supabase Auth server | Server Components, Server Actions, middleware — anywhere you gate access |
| `getSession()` | Reads cookie without server validation | NEVER for protection logic — cookie can be forged |
| `getClaims()` | Local JWT validation (no server roundtrip) | Optional performance optimization, one-line swap from getUser() later |

### PKCE Callback Route

Required for email-based auth (invites, password resets). Lives at `/auth/callback`:

```typescript
// src/app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

The `?next=` param controls where the user lands after code exchange. Use this for invite flows (`next=/portal/set-password`) and password resets (`next=/portal/reset-password`).

---

## 4. Database Schema + RLS

### is_admin() Helper

```sql
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.profiles
  where id = (select auth.uid()) and is_admin = true
); $$;
```

**Critical: Never call `is_admin()` inside the profiles table's own SELECT policy** — causes infinite recursion. Use `id = (select auth.uid())` directly for profiles.

### Two-Policy Pattern (all non-profiles tables)

```sql
-- Clients see own data (via project ownership chain)
create policy "Clients read own" on public.milestones for select to authenticated
using (project_id in (
  select id from public.projects where profile_id = (select auth.uid())
));

-- Admins see all
create policy "Admins read all" on public.milestones for select to authenticated
using ((select public.is_admin()));
```

### Performance: `(select auth.uid())` Wrapper

Always wrap `auth.uid()` in `(select ...)`. This caches the result per-statement instead of evaluating per-row (~95% performance improvement per Supabase benchmarks).

### Status Columns

Use `text + CHECK` constraints, not Postgres enums. Enums can't be altered inside transactions, making migrations risky.

---

## 5. Portal Architecture (Next.js App Router)

### Route Structure

```
src/app/
├── [locale]/        # Marketing site (next-intl, bilingual)
│   ├── layout.tsx   # SiteHeader + SiteFooter + auth redirect to /portal
│   └── login/       # Bilingual login page
├── portal/          # Client portal (outside [locale], Spanish hardcoded)
│   ├── layout.tsx   # getUser() gate → redirect to /login if unauthenticated
│   └── page.tsx     # Project overview, milestones, files
├── admin/           # Admin interface (outside [locale], Spanish hardcoded)
│   ├── layout.tsx   # getUser() + is_admin check → redirect if not admin
│   └── projects/    # Project CRUD, milestone management, file uploads
└── auth/
    └── callback/    # PKCE code exchange (already exists)
```

**Key architectural decisions:**
- Portal and admin are **separate layout roots** (parallel to `[locale]`)
- Each has its own `<html>` and `<body>` tags with `globals.css` + font import
- Portal text is hardcoded Spanish (outside NextIntlClientProvider)
- `[locale]/layout.tsx` redirects authenticated users to `/portal` (portal-only mode)
- Portal layout redirects unauthenticated users to `/login`

### Portal-Only Mode

When logged in, clients cannot see marketing pages. The `[locale]/layout.tsx` does a blanket redirect:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (user) redirect('/portal');
```

---

## 6. File Uploads (Signed URL Pattern)

Server Actions have a 1MB body limit. For files up to 100MB, use the signed URL pattern:

1. **Server Action** issues `createSignedUploadUrl` (via admin client — bypasses storage RLS)
2. **Browser** uploads directly to Supabase Storage via `uploadToSignedUrl`
3. **Server Action** saves file metadata to the `files` table

```typescript
// Server Action
const { data } = await adminClient.storage
  .from('deliverables')
  .createSignedUploadUrl(storagePath);

// Browser (client component)
const { error } = await browserClient.storage
  .from('deliverables')
  .uploadToSignedUrl(path, token, file);
```

**Storage path convention:** `{projectId}/{milestoneId|'project'}/{timestamp}-{filename}`

**Download:** Accept `fileId` (not `storage_path`) in the Server Action. Query the `files` table first (RLS validates ownership), then generate `createSignedUrl(path, 3600)` for 1-hour access.

---

## 7. Invite Flow

```
Admin calls inviteUserByEmail(email, { redirectTo: '/auth/callback?next=/portal/set-password' })
→ Client receives email with invite link
→ Client clicks link → /auth/callback exchanges code → session established
→ Client redirected to /portal/set-password (authenticated)
→ Client calls updateUser({ password }) → redirected to /portal
```

The `handle_new_user` trigger auto-creates the `profiles` row on signup. The admin can assign a project to the new user's profile during or after the invite.

---

## 8. Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| `getSession()` for protection | Forged cookies bypass auth | Use `getUser()` always |
| `is_admin()` in profiles SELECT policy | Infinite recursion error | Use direct `id = auth.uid()` for profiles |
| Portal routes inside `[locale]` | Marketing nav appears in portal | Separate layout root at `/portal` |
| next-intl runs on `/portal` routes | 404 — "portal" treated as locale | Skip next-intl in middleware for portal/admin paths |
| Large file upload via Server Action | 1MB body limit error | Signed URL pattern (browser uploads directly to Storage) |
| `auth.uid()` without `(select ...)` wrapper | Slow RLS (evaluates per-row) | Always wrap: `(select auth.uid())` |
| Old cookie API `get/set/remove` | TypeScript errors | Use `getAll/setAll` (@supabase/ssr v0.5+) |
| Supabase client at module level | Session bleeding between requests | Create inside function, per-request |
| PKCE callback locale-prefixed | 404 on invite/reset links | Exclude `/auth` from middleware matcher |
| Service role key with `NEXT_PUBLIC_` | Key exposed to browser | Never prefix service role key with `NEXT_PUBLIC_` |

---

## 9. Button UX (from ui-ux-pro-max)

All interactive buttons should have `active:scale-95` for immediate tactile press feedback. Without this, users perceive the interface as unresponsive due to server action latency.

```
className="... transition-all duration-150 active:scale-95"
```

---

*Extracted from: dime.ar v2.0 Client Portal milestone (Phases 19-24)*
*Date: 2026-04-05*
*Valid until: Supabase SSR patterns are stable; recheck @supabase/ssr version if > 6 months old*
