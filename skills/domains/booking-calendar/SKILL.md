# Domain Skill: Booking Calendar (Cal.com API + Custom UI)

> Apply this skill alongside `web-dev-general/SKILL.md` when adding a Cal.com booking calendar to a Next.js project. Covers Cal.com account setup, the custom UI approach using Cal.com API v2, and all known pitfalls. Updated from the v1.4 embed approach to the v1.5 custom UI approach.

## When to Apply

- Agency/service sites that need meeting booking
- Contact pages with scheduled calls
- Any Next.js App Router project needing Cal.com integration
- Projects wanting full design control over the booking UI

## Approach Decision

| Approach | When to Use | Effort | Design Control |
|----------|-------------|--------|----------------|
| **Custom UI (recommended)** | Full design control needed, no "Powered by Cal.com" branding | Medium | Full |
| Embed (legacy) | Quick MVP, design control not important | Low | None (iframe) |

This skill documents the **Custom UI** approach. For the legacy embed approach, see git tag `v1.4`.

---

## 1. Cal.com Account Setup

See `.planning/docs/calcom-setup.md` for the full walkthrough. Key steps:

1. Create account at cal.com
2. Set timezone on account AND on each availability schedule
3. Connect Google Calendar (Apps > Google Calendar)
4. Install Google Meet app (Apps > Google Meet)
5. Create event types (set Google Meet as location on EACH type)
6. Configure per-event: buffer time, minimum notice, booking window
7. Create API key: Settings > Security > API keys
8. Test end-to-end: book a slot, verify calendar block + email + Meet link

**Free plan covers:** Unlimited event types, Google Calendar sync, Google Meet, email confirmations, availability scheduling, API access (v2), 120 req/min rate limit.

**Free plan does NOT cover:** Branding removal on embed, custom email templates, SMS reminders.

---

## 2. API Layer: Route Handler Proxy

### Architecture

Cal.com API v2 calls go through Next.js Route Handlers — the API key never touches the client.

```
Browser → /api/cal/event-types → Cal.com API v2
Browser → /api/cal/slots       → Cal.com API v2
Browser → /api/cal/bookings    → Cal.com API v2
```

### Critical: `cal-api-version` Header

Each Cal.com API endpoint requires a **different** `cal-api-version` header value. Using the wrong value causes silent failures or wrong response shapes.

| Endpoint | cal-api-version | Method | Cache |
|----------|----------------|--------|-------|
| `/v2/event-types` | `2024-06-14` | GET | 1 hour |
| `/v2/slots` | `2024-09-04` | GET | 5 minutes |
| `/v2/bookings` | `2024-08-13` | POST | Never |

### Route Handler Pattern

```typescript
// src/app/api/cal/slots/route.ts
import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const eventTypeId = searchParams.get('eventTypeId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const timeZone = searchParams.get('timeZone') ?? 'UTC';

  if (!eventTypeId || !start || !end) {
    return NextResponse.json(
      { error: 'MISSING_PARAMS', message: 'eventTypeId, start, end are required' },
      { status: 400 }
    );
  }

  // Cache key must be INSIDE handler (varies per request params)
  const fetchSlots = unstable_cache(
    async () => {
      const res = await fetch(`https://api.cal.com/v2/slots?${new URLSearchParams({ eventTypeId, start, end, timeZone })}`, {
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          'cal-api-version': '2024-09-04',  // CRITICAL — wrong version = 404
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Cal.com error ${res.status}`);
      return res.json();
    },
    [`cal-slots-${eventTypeId}-${start}-${end}-${timeZone}`],
    { revalidate: 300 }
  );

  try {
    const data = await fetchSlots();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'CAL_API_ERROR', message: 'Failed to fetch slots' }, { status: 502 });
  }
}
```

### Environment Variables

```
CAL_API_KEY=cal_live_xxx     # Server-side only — NO NEXT_PUBLIC_ prefix
```

### Slots Response Shape

```typescript
// data["YYYY-MM-DD"][] — date keys directly on data, NOT under data.slots
type CalSlotsResponse = {
  status: 'success' | 'error';
  data: Record<string, Array<{ start: string; end?: string }>>;
};
```

---

## 3. Custom UI Components

### File Structure

```
src/components/booking/
├── BookingWizard.tsx       # 'use client' — top-level orchestrator
├── EventTypePicker.tsx     # Step 1: event type buttons with descriptions
├── DatePicker.tsx          # Step 2: react-day-picker calendar grid
├── TimeSlotPicker.tsx      # Step 3: native <select> dropdown + timezone
├── BookingForm.tsx         # Step 4: name + email form (react-hook-form + zod)
├── ConfirmationView.tsx    # Final: meeting summary card with Meet link
├── useBookingSlots.ts      # SWR hook for /api/cal/slots
└── timezones.ts            # Common timezone list + formatSlotTime utility
```

### Packages

```bash
npm install react-day-picker swr date-fns @date-fns/tz
```

- `react-day-picker@9.x` — calendar grid. Do NOT use shadcn Calendar (wraps v8, incompatible with v9).
- `swr` — per-month availability fetching. Cache key = URL string.
- `date-fns` + `@date-fns/tz` — date formatting + timezone conversion. Use `@date-fns/tz` (official v4 package), NOT `date-fns-tz` (deprecated third-party).

### Progressive Reveal Wizard

Single view, progressive reveal — no step-by-step cards. State managed with `useState`:

```typescript
type WizardStep = 'event-type' | 'date' | 'time' | 'done' | 'confirmed';

const [step, setStep] = useState<WizardStep>('event-type');
const [eventTypeId, setEventTypeId] = useState<number | null>(null);
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
const [timeZone, setTimeZone] = useState(() =>
  Intl.DateTimeFormat().resolvedOptions().timeZone
);
```

Calendar stays visible after date selection — time dropdown appears below it. Auto-advance on time slot selection.

### SWR Hook

```typescript
import useSWR from 'swr';

function useBookingSlots(eventTypeId: number | null, month: Date, timeZone: string) {
  const start = month.toISOString().slice(0, 7) + '-01';
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);

  const key = eventTypeId
    ? `/api/cal/slots?eventTypeId=${eventTypeId}&start=${start}&end=${end}&timeZone=${encodeURIComponent(timeZone)}`
    : null;  // null key = no fetch until event type selected

  return useSWR(key, (url) => fetch(url).then(r => r.json()));
}
```

### react-day-picker v9 with Tailwind

Import `DayPicker` from `'react-day-picker'` — do NOT import `react-day-picker/style.css`. Use pure `classNames` prop:

```typescript
<DayPicker
  mode="single"
  month={displayMonth}
  onMonthChange={setDisplayMonth}
  selected={selectedDate}
  onSelect={handleDateSelect}
  startMonth={new Date()}  // prevent past-month navigation
  disabled={isUnavailable}
  modifiers={{ unavailable: isUnavailable }}
  modifiersClassNames={{ unavailable: 'line-through' }}
  classNames={{
    root: 'relative text-base',
    month_caption: 'flex items-center font-semibold text-base h-10 px-2',
    day: 'inline-flex items-center justify-center rounded hover:bg-muted size-11',
    today: 'ring-1 ring-ring font-semibold',
    selected: 'bg-primary text-primary-foreground',
    disabled: 'text-muted-foreground opacity-30 cursor-not-allowed',
    // ... (see full classNames in implementation)
  }}
/>
```

**v9 key names differ from v8:** `root` not `calendar`, `month_caption` not `caption`, `disabled` not `day_disabled`.

### Date Parsing: Anchor to Noon

```typescript
// Cal.com returns date keys like "2026-05-01"
// new Date("2026-05-01") parses as UTC midnight — shifts to previous day in UTC-X timezones
// Fix: anchor to noon
const availableDays = Object.keys(data).map(d => new Date(d + 'T12:00:00'));
```

### Timezone Formatting

```typescript
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

function formatSlotTime(isoStart: string, timeZone: string): string {
  const tzDate = new TZDate(isoStart, timeZone);
  return format(tzDate, 'h:mm a'); // "2:30 PM"
}
```

### Timezone Detection

```typescript
// Client-side only — SSR returns server timezone (UTC on Vercel)
const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
```

---

## 4. Booking Flow

### Form Pattern

Follow the existing ContactForm pattern: `react-hook-form` + `zodResolver` with bilingual schema.

```typescript
// Bilingual schema factory
const schema = z.object({
  name: z.string().min(2, locale === 'es' ? 'Mínimo 2 caracteres' : 'At least 2 characters'),
  email: z.string().email(locale === 'es' ? 'Email inválido' : 'Invalid email'),
});
```

Submit via `fetch` to `/api/cal/bookings` (not Server Action — Route Handler owns the `cal-api-version` header).

### Error Handling

| Scenario | Status | UX |
|----------|--------|-----|
| Slot taken | 409 | Inline error + "Pick another time" button (keeps form data) |
| API down | 502/503 | "Something went wrong" + show fallback email/WhatsApp |
| Validation | Client | Inline bilingual field errors |

### Confirmation View

After successful booking (201), replace entire wizard with a summary card:
- Event type, date, time, timezone
- Google Meet link (from `booking.location`)
- "Back to home" link

---

## 5. Known Cal.com API Bugs

### #23121: Empty Slots with Non-Default Schedules
**Symptom:** `/v2/slots` returns `{ data: {} }` with no error.
**Cause:** Event type uses a named custom schedule instead of "Default".
**Fix:** Verify in Cal.com dashboard that event types use the Default availability schedule.

### #25009: Booking Without Calendar Sync
**Symptom:** POST returns 201 + `status: "accepted"` but host doesn't get email and Google Calendar isn't updated.
**Cause:** Intermittent Cal.com backend issue.
**Fix:** Always verify with a real test booking during implementation. No code workaround.

### cal-api-version Mismatch
**Symptom:** 404 or wrong response shape from a previously-working endpoint.
**Cause:** Using the wrong `cal-api-version` header value.
**Fix:** Each endpoint has its own version. See table in Section 2. Do NOT use a single version for all endpoints.

---

## 6. Pitfalls

### P1: cal-api-version Header Wrong (CRITICAL)
**Cause:** Using same version for all endpoints (e.g., `2024-08-13` for slots).
**Fix:** Slots requires `2024-09-04`, event-types `2024-06-14`, bookings `2024-08-13`.

### P2: API Key Exposed Client-Side
**Cause:** Using `NEXT_PUBLIC_CAL_API_KEY` or calling Cal.com directly from browser.
**Fix:** Route Handler proxy. Key stays in `CAL_API_KEY` (no `NEXT_PUBLIC_` prefix).

### P3: Date Parsing Shifts Day by One
**Cause:** `new Date('2026-05-01')` parsed as UTC midnight, shifts in UTC-X zones.
**Fix:** Anchor to noon: `new Date(dateStr + 'T12:00:00')`.

### P4: Timezone Detection on SSR Returns Server TZ
**Cause:** `Intl.DateTimeFormat().resolvedOptions().timeZone` returns UTC on Vercel.
**Fix:** Initialize in `useState` lazy initializer (runs client-side only).

### P5: react-day-picker v9 Class Names Differ from v8
**Cause:** Using v8 names like `day_selected`, `caption`.
**Fix:** v9 uses `selected`, `month_caption`, `root` (not `calendar`).

### P6: shadcn Calendar Incompatible with react-day-picker v9
**Cause:** shadcn wraps v8 internals.
**Fix:** Use `DayPicker` from `react-day-picker` directly with `classNames` prop.

### P7: SWR Fetches Before Event Type Selected
**Cause:** SWR key is not null when eventTypeId is null.
**Fix:** Return `null` key when eventTypeId is null — SWR skips the fetch.

### P8: Timezone Set on Account but Not Schedule
**Cause:** Cal.com has separate timezone settings for account and availability schedules.
**Fix:** Set timezone on the schedule itself (Availability > Edit Schedule > Timezone).

### P9: Google Meet Not in Booking Confirmation
**Cause:** Google Meet app installed but not set as location on the event type.
**Fix:** Edit each event type > Setup > Location > explicitly select Google Meet.

---

## 7. Pre-Launch Checklist

### Cal.com Dashboard
- [ ] Cal.com account created and configured
- [ ] Google Calendar connected and conflict checking enabled
- [ ] Google Meet installed and set as location on each event type
- [ ] Availability schedule timezone matches business timezone
- [ ] Buffer, notice, and booking window set on all event types
- [ ] Email reminder workflow active
- [ ] API key created (Settings > Security)
- [ ] End-to-end test booking completed via API

### Code
- [ ] `CAL_API_KEY` set in `.env.local` (server-side only)
- [ ] All 3 Route Handlers tested (event-types, slots, bookings)
- [ ] `cal-api-version` headers verified per endpoint
- [ ] `npm run build` passes (not just dev)
- [ ] Booking form creates real booking with Google Meet link
- [ ] Bilingual validation errors display correctly (ES + EN)
- [ ] Mobile tested (375px viewport, no overflow)
- [ ] Fallback contact section visible below calendar
- [ ] Old embed code removed (no booking-calendar.tsx, no embed.js references)

---

*Skill updated: 2026-04-03 from dime agency website project (v1.5)*
*Stack: Next.js 15, React 19, Tailwind v4, Cal.com API v2, react-day-picker v9, SWR, date-fns + @date-fns/tz*
