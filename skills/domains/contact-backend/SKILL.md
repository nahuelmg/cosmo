# Domain Skill: Contact Form Backend (Server Action + Resend)

> Apply this skill alongside `web-dev-general/SKILL.md` when adding a contact form backend to a Next.js project. Covers the full path from Resend account creation to email arriving in inbox, using Server Actions and react-hook-form.

## When to Apply

- Contact forms on marketing sites or portfolios
- Lead capture forms for service businesses
- Inquiry forms (project requests, booking, quotes)
- Any Next.js App Router project that needs to send email without a third-party form service

---

## 1. Resend Setup

**1. Create account**

Sign up at [resend.com](https://resend.com). Free tier: 3,000 emails/month, 100/day.

**2. Add and verify your sending domain**

Go to Domains → Add Domain. Resend will give you DNS records to add:

- **MX record** — for receiving bounces
- **TXT/SPF record** — declares Resend as an authorized sender
- **DKIM records** (CNAME entries) — cryptographic signing

Add them to your DNS provider. Propagation can take up to 48 hours, though usually under 30 minutes.

**3. Testing before domain verification**

Use `onboarding@resend.dev` as the `from` address while your domain is pending. This works immediately, no verification needed.

**4. Generate an API key**

Go to API Keys → Create API Key. Copy the key — it is shown only once.

**CRITICAL:** Do NOT prefix this variable with `NEXT_PUBLIC_`. See Section 5.

---

## 2. Environment Variables

Add to `.env.local` (development) and your deployment platform (production):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Document in `.env.example` for teammates:

```bash
RESEND_API_KEY=    # Required for contact form emails (server-side only)
```

**Pitfall — NEXT_PUBLIC_ prefix:** If you name this `NEXT_PUBLIC_RESEND_API_KEY`, Next.js will embed the value in the client-side JavaScript bundle. Anyone can extract it from the page source. Never do this. The variable must be server-side only (no `NEXT_PUBLIC_` prefix).

---

## 3. Server Action (`'use server'`)

File: `src/app/actions/contact.ts`

```ts
'use server';

import { z } from 'zod';
import { Resend } from 'resend';

// Zod schema — validates input server-side even if client validation was bypassed
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

type ContactResult = { success: boolean; error?: string };

export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid form data' };
  }

  const { name, email, message } = parsed.data;

  // Guard: if no API key, log a warning and return success (dev-friendly no-op)
  // This allows the form to work locally without Resend credentials
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[contact] RESEND_API_KEY not set — skipping email send');
    return { success: true };
  }

  // Instantiate inside the function, not at module level
  // (module-level instantiation fails when key is undefined at import time)
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: 'Company Name <no-reply@yourdomain.com>',
      to: 'recipient@yourdomain.com',
      replyTo: email,   // <-- sender's email; allows you to reply directly
      subject: `New message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${message}</pre>
      `.trim(),
    });
    return { success: true };
  } catch (error) {
    console.error('[contact] Failed to send email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
```

**Key design decisions:**

- `safeParse` runs server-side validation even when the client already validated — protects against direct API calls
- API key guard returns `{ success: true }` (not an error) in development — the form still "works" without credentials
- `Resend` is instantiated inside the function body, not at module level, to avoid runtime errors when the key is missing at import time
- `replyTo` is set to the submitter's email — without it, replies from your inbox go to the `from` address (a no-reply dead end)

---

## 4. Form Wiring (react-hook-form + startTransition)

**Why not `useActionState` with `<form action=...>`?**

Next.js Server Actions can be called via `<form action={serverAction}>`, and React provides `useActionState` to track the result. This pattern works for basic forms but breaks when combined with react-hook-form: the `action=` wiring bypasses `handleSubmit`, so RHF's client-side validation never runs and field errors never appear.

**The correct pattern: `handleSubmit` + `startTransition`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendContactEmail } from '@/app/actions/contact';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Destructure as [, startTransition] — isPending not needed
  // The status state machine drives the UI instead
  const [, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormData) {
    setStatus('submitting');
    startTransition(async () => {
      const result = await sendContactEmail(data);
      setStatus(result.success ? 'success' : 'error');
    });
  }

  // Status-driven rendering
  if (status === 'success') {
    return <div>Message sent!</div>;
  }

  if (status === 'error') {
    return (
      <div>
        <p>Something went wrong.</p>
        <button type="button" onClick={() => setStatus('idle')}>Try again</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input {...register('name')} type="text" />
      {errors.name && <p>{errors.name.message}</p>}

      <input {...register('email')} type="email" />
      {errors.email && <p>{errors.email.message}</p>}

      <textarea {...register('message')} />
      {errors.message && <p>{errors.message.message}</p>}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

**Pattern breakdown:**

- `useForm` with `zodResolver` handles client-side validation and field error messages
- `handleSubmit(onSubmit)` is the `onSubmit` handler on the `<form>` element — RHF runs validation before calling `onSubmit`
- `onSubmit` sets status to `'submitting'` then calls the Server Action inside `startTransition`
- `[, startTransition]` — `isPending` is omitted because the `status` state machine already tracks the full lifecycle: `idle → submitting → success/error`
- "Try again" resets status to `'idle'`, restoring the form
- `noValidate` on the form disables browser native validation, letting RHF errors display instead

---

## 5. Known Pitfalls

- **`NEXT_PUBLIC_` prefix on API key** — Embeds the secret in the client bundle. Anyone can read it from the page source. Use `RESEND_API_KEY` (no prefix).

- **`useActionState` with `<form action=...>`** — Bypasses `handleSubmit`, so react-hook-form validation never runs. Use the `handleSubmit` + `startTransition` pattern instead.

- **Resend SDK instantiated at module level** — `new Resend(process.env.RESEND_API_KEY)` at the top of the file will throw when the key is undefined at import time (e.g., CI, test environments). Instantiate inside the function, after the key guard.

- **`from` address not on a verified domain** — Resend will reject the send. Use `onboarding@resend.dev` for testing, then switch to `no-reply@yourdomain.com` once your domain is verified.

- **Missing `replyTo` header** — Without it, when you reply to the notification email in your inbox, the reply goes to the `from` address (a no-reply dead end). Always set `replyTo` to the submitter's email.

- **DNS propagation delay** — After adding Resend's DNS records, verification can take up to 48 hours. Do not block a launch on domain verification; test with `onboarding@resend.dev` in the meantime.

---

## 6. Pre-launch Checklist

```
[ ] Resend account created
[ ] Sending domain added and DNS records configured
[ ] DNS propagation verified (Resend dashboard shows "Verified")
[ ] RESEND_API_KEY set in production environment (Vercel → Settings → Environment Variables)
[ ] RESEND_API_KEY is NOT prefixed with NEXT_PUBLIC_
[ ] from address updated from onboarding@resend.dev to no-reply@yourdomain.com
[ ] to address set to the correct recipient (company email)
[ ] replyTo wired to the submitter's email
[ ] Test submission on production — email arrives in inbox within seconds
[ ] Reply to the test email — confirm reply goes to the submitter's address
```
