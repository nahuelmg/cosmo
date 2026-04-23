'use client';

import {createContext, useCallback, useContext, useEffect, useState} from 'react';

export type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
});

function applyTheme(t: Theme) {
  const isDark =
    t === 'dark' ||
    (t === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

type Props = {
  initialTheme: Theme;
  children: React.ReactNode;
};

/**
 * Cookie-based theme provider — no next-themes dependency. Mirrors the pattern
 * in skills/domains/dark-mode/SKILL.md (extracted from dime.ar v2.4).
 *
 * No-flash strategy is two-layer:
 *   1. An inline <script> in [locale]/layout.tsx runs before body renders and
 *      sets `.dark` on <html> based on the theme cookie + prefers-color-scheme.
 *   2. This provider reconciles React state with that class on mount and keeps
 *      it in sync when the user toggles or the system preference changes.
 *
 * The cookie is set client-side (path=/, 1 year, SameSite=Lax) so it's
 * available to the server on the next request for SSR parity on `light`/`dark`.
 * `system` can't be read server-side, so system users accept the inline script
 * as their no-flash source of truth.
 */
export function ThemeProvider({initialTheme, children}: Props) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.cookie = `theme=${t};path=/;max-age=31536000;SameSite=Lax`;
    applyTheme(t);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{theme, setTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
