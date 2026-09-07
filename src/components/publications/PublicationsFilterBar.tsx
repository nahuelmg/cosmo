'use client';

import { useTranslations } from 'next-intl';

interface PublicationsFilterBarProps {
  query: string;
  onQueryChange: (next: string) => void;
  member: string;
  onMemberChange: (next: string) => void;
  memberOptions: { slug: string; name: string }[];
  total: number;
  active: boolean;
  onClear: () => void;
}

const field =
  'w-full rounded-md bg-surface-alt px-3 py-2 text-sm text-ink ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function PublicationsFilterBar({
  query,
  onQueryChange,
  member,
  onMemberChange,
  memberOptions,
  total,
  active,
  onClear,
}: PublicationsFilterBarProps) {
  const t = useTranslations('publications');

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label htmlFor="pub-search" className="sr-only">
            {t('search.label')}
          </label>
          <input
            id="pub-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className={`${field} placeholder:text-ink-subtle`}
          />
        </div>
        <div className="sm:w-72">
          <label htmlFor="pub-member" className="sr-only">
            {t('member.label')}
          </label>
          <select
            id="pub-member"
            value={member}
            onChange={(e) => onMemberChange(e.target.value)}
            className={`${field} [color-scheme:light] dark:[color-scheme:dark]`}
          >
            <option value="">{t('member.all')}</option>
            {memberOptions.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <span aria-live="polite">{t('results', { count: total })}</span>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="rounded underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {t('clear')}
          </button>
        )}
      </div>
    </div>
  );
}
