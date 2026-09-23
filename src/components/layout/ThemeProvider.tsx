'use client';

import {createContext, useCallback, useContext, useEffect, useSyncExternalStore} from 'react';

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

function readTheme(): Theme {
  try {
    const value = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/)?.[1];
    const theme = value ? decodeURIComponent(value) : 'system';
    return theme === 'light' || theme === 'dark' ? theme : 'system';
  } catch {
    return 'system';
  }
}

function subscribe(listener: () => void) {
  window.addEventListener('theme-change', listener);
  return () => window.removeEventListener('theme-change', listener);
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme);

  const setTheme = useCallback((value: Theme) => {
    document.cookie = `theme=${value};path=/;max-age=31536000;SameSite=Lax`;
    applyTheme(value);
    window.dispatchEvent(new Event('theme-change'));
  }, []);

  useEffect(() => {
    // Read the cookie directly even on the first hydration effect so the
    // server's system snapshot cannot overwrite the bootstrap script's theme.
    applyTheme(readTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(readTheme());
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
