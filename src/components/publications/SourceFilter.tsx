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

  const base = 'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

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
                ? `${base} bg-accent text-white`
                : `${base} bg-surface-alt text-ink-muted hover:text-ink`
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
