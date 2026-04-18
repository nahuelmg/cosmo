import dynamic from 'next/dynamic';
import type {EmailLinkInnerProps} from './EmailLinkInner';

export type EmailLinkProps = EmailLinkInnerProps;

const EmailLinkClient = dynamic(
  () => import('./EmailLinkInner').then((m) => m.EmailLinkInner),
  {ssr: false},
);

/**
 * Obfuscated contact-email link. The inner anchor is loaded exclusively on
 * the client via next/dynamic with server rendering disabled, so the
 * prerendered HTML source contains no reference to the message-scheme URI
 * at all. After hydration, React swaps in the real clickable anchor.
 *
 * See .planning/phases/03-layout-shell/03-RESEARCH.md — Pattern 3 (NAV-03).
 */
export function EmailLink(props: EmailLinkProps) {
  return <EmailLinkClient {...props} />;
}
