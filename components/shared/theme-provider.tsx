'use client';

import { useEffect } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export function applyThemePreference(theme: ThemePreference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' || (theme === 'system' && prefersDark),
  );
}

export function setThemePreference(theme: ThemePreference) {
  localStorage.setItem('theme', theme);
  applyThemePreference(theme);
  window.dispatchEvent(new CustomEvent('app:theme-change', { detail: theme }));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    let preference: ThemePreference = savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'light';

    const handlePreferenceChange = (event: Event) => {
      const nextPreference = (event as CustomEvent<ThemePreference>).detail;
      if (nextPreference === 'light' || nextPreference === 'dark' || nextPreference === 'system') {
        preference = nextPreference;
      }
    };
    const handleSystemChange = () => applyThemePreference(preference);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

    applyThemePreference(preference);
    window.addEventListener('app:theme-change', handlePreferenceChange);
    systemTheme.addEventListener('change', handleSystemChange);

    return () => {
      window.removeEventListener('app:theme-change', handlePreferenceChange);
      systemTheme.removeEventListener('change', handleSystemChange);
    };
  }, []);

  return children;
}