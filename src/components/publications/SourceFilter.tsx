'use client';

import { useTranslations } from 'next-intl';

export type SourceFilterValue = 'all' | 'inspirehep' | 'arxiv' | 'manual';

interface SourceFilterProps {
  value: SourceFilterValue;
  onChange: (next: SourceFilterValue) => void;
}

export function SourceFilter({ value, onChange }: SourceFilterProps) {
  const t = useTranslations('publications');

  const options: { key: SourceFilterValue; label: string }[] = [
    { key: 'all', label: t('filter.all') },
    { key: 'inspirehep', label: t('filter.inspirehep') },
    { key: 'arxiv', label: t('filter.arxiv') },
    { key: 'manual', label: t('filter.manual') },
  ];

  return (
    <div
      role="group"
      aria-label={t('filter.all')}
      className="mt-4 flex flex-wrap items-center gap-2"
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => {
              // Non-Todos pills do not toggle off when clicked while active.
              // Todos is the explicit all-state.
              if (active && opt.key !== 'all') return;
              onChange(opt.key);
            }}
            className={
              active
                ? 'rounded-full bg-accent px-3 py-1 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
                : 'rounded-full bg-surface-alt px-3 py-1 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring'
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
