'use client';

import dynamic from 'next/dynamic';
import type {EmailLinkInnerProps} from './EmailLinkInner';

export type EmailLinkProps = EmailLinkInnerProps;

/**
 * Obfuscated contact-email link. The inner anchor is loaded exclusively on
 * the client via next/dynamic with server rendering disabled, so the
 * prerendered HTML source contains no reference to the message-scheme URI
 * at all. After hydration, React swaps in the real clickable anchor.
 *
 * This wrapper is a Client Component so it can use `next/dynamic` with
 * `ssr: false` — Next.js 16 / Turbopack forbids that combination inside
 * Server Components, and SiteFooter (a server component) consumes this.
 * The 'use client' directive pushes the wrapper into the client bundle,
 * which is correct: the wrapper's job is exactly to gate server rendering.
 * The server still emits only the wrapper's placeholder (empty markup)
 * into the HTML source; the inner anchor with the assembled href appears
 * only after hydration. The Phase 3 NAV-03 guarantee (zero message-scheme
 * literal in prerendered HTML) is preserved.
 *
 * See .planning/phases/03-layout-shell/03-RESEARCH.md — Pattern 3 (NAV-03).
 */
const EmailLinkClient = dynamic(
  () => import('./EmailLinkInner').then((m) => m.EmailLinkInner),
  {ssr: false},
);

export function EmailLink(props: EmailLinkProps) {
  return <EmailLinkClient {...props} />;
}
