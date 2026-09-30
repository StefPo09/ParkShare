'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = Exclude<Theme, 'system'>;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
};

const STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => undefined,
  resolvedTheme: 'light',
});

function resolveSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme: Theme =
      savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
        ? savedTheme
        : 'system';
    const systemTheme = resolveSystemTheme();
    const initialResolvedTheme = initialTheme === 'system' ? systemTheme : initialTheme;

    setThemeState(initialTheme);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialResolvedTheme);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme: Theme =
        event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system'
          ? event.newValue
          : 'system';
      const nextResolvedTheme = nextTheme === 'system' ? resolveSystemTheme() : nextTheme;
      setThemeState(nextTheme);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const applyResolvedTheme = (nextResolvedTheme: ResolvedTheme) => {
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    const nextResolvedTheme = theme === 'system' ? resolveSystemTheme() : theme;
    applyResolvedTheme(nextResolvedTheme);

    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyResolvedTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
