'use client';

import {Suspense} from 'react';
import {useLocale} from 'next-intl';
import {useParams, useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';

type Locale = 'es' | 'en';

interface LocaleToggleProps {
  className?: string;
}

/**
 * Inner component — calls the hooks, renders the button.
 *
 * IMPORT SOURCES ARE DELIBERATE:
 *   - `usePathname`, `useRouter` come from `@/i18n/navigation`. They return
 *     the internal pathname key (e.g. `/research`) and accept internal keys in
 *     `router.replace`, which is what next-intl's `replace` signature expects.
 *   - `useParams`, `useSearchParams` come from `next/navigation`. They provide
 *     the raw dynamic segments (e.g. `{slug: 'foo'}`) and the current query
 *     string; next-intl does not wrap these.
 *
 * Threading `params` through `router.replace` is what makes the toggle work
 * on dynamic routes like `/people/[slug]`. Threading a query object built from
 * `searchParams` is what preserves filters like `/publications?year=2025`.
 *
 * See RESEARCH.md Pitfall #2 (`useSearchParams` must be inside `<Suspense>`)
 * and Open Question #4 (`params` cast to `any` reconciles next-intl's stricter
 * typed params against `useParams()`'s widened `Record<string, string | string[]>`).
 */
function LocaleToggleInner({className = ''}: LocaleToggleProps) {
  const locale = useLocale() as Locale;
  const otherLocale: Locale = locale === 'es' ? 'en' : 'es';

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  function handleSwitch() {
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    router.replace(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {pathname, params: params as any, query},
      {locale: otherLocale},
    );
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={
        locale === 'es'
          ? `Cambiar a ${otherLocale.toUpperCase()}`
          : `Switch to ${otherLocale.toUpperCase()}`
      }
      className={[
        'text-sm font-semibold tracking-wide',
        'text-ink-muted hover:text-ink',
        'transition-colors',
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:rounded',
        'px-2 py-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {otherLocale.toUpperCase()}
    </button>
  );
}

/**
 * Public export. Wraps `LocaleToggleInner` in `<Suspense>` so the inner
 * component's `useSearchParams()` call does not force the parent route out of
 * static rendering. `fallback={null}` is fine — the toggle is a 2-character
 * button and a single paint's absence is not a layout-shift concern.
 */
export function LocaleToggle(props: LocaleToggleProps) {
  return (
    <Suspense fallback={null}>
      <LocaleToggleInner {...props} />
    </Suspense>
  );
}
