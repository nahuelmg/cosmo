'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Monitor, Moon, Sun} from 'lucide-react';
import {type Theme, useTheme} from './ThemeProvider';

const ORDER: readonly Theme[] = ['light', 'dark', 'system'] as const;

interface ThemeToggleProps {
  className?: string;
}

/**
 * Three-way theme cycle button — light → dark → system → light.
 *
 * Design choices:
 *   - Icon reflects current theme (Sun / Moon / Monitor) so the state is
 *     legible at a glance; aria-label announces the *next* state so keyboard
 *     and SR users know what the click will do (e.g., "Switch to dark mode").
 *   - Mounted-gate renders a neutral Monitor icon until the client has
 *     reconciled with the cookie + system preference. Without it, SSR would
 *     render the icon for `initialTheme` (e.g. Monitor for 'system') while a
 *     system user actually sees dark surfaces — a visual contradiction.
 *   - Styling mirrors the LocaleToggle so the two sit as matched chips on the
 *     right of the header.
 */
export function ThemeToggle({className = ''}: ThemeToggleProps) {
  const {theme, setTheme} = useTheme();
  const t = useTranslations('layout');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleCycle() {
    const idx = ORDER.indexOf(theme);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
  }

  const nextTheme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const ariaLabel = t('themeToggle', {next: t(`theme_${nextTheme}`)});

  const Icon = !mounted
    ? Monitor
    : theme === 'dark'
      ? Moon
      : theme === 'light'
        ? Sun
        : Monitor;

  return (
    <button
      type="button"
      onClick={handleCycle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={[
        'inline-flex items-center justify-center',
        'w-9 h-9 rounded',
        'text-ink-muted hover:text-ink',
        'bg-surface-alt hover:shadow-sm',
        'transition-[color,transform,box-shadow] duration-75',
        'active:scale-95',
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="w-4 h-4" aria-hidden />
    </button>
  );
}
