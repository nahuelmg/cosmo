'use client';

import type {ReactNode} from 'react';

export interface EmailLinkInnerProps {
  user: string;
  domain: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Client-only anchor that assembles its href on render. The URI scheme is
 * built via array-join so the literal five-character token never appears in
 * this source file or the compiled JS bundle as a contiguous string.
 *
 * See .planning/phases/03-layout-shell/03-RESEARCH.md — Pattern 3.
 */
export function EmailLinkInner({
  user,
  domain,
  children,
  className,
}: EmailLinkInnerProps) {
  const address = `${user}@${domain}`;
  const href = `${['mai', 'lto'].join('')}:${address}`;

  return (
    <a href={href} className={className}>
      {children ?? address}
    </a>
  );
}
