'use client';

import { useEffect, useState, useCallback } from 'react';

export type Locale = 'en' | 'bn';

export function setLocalePreference(locale: Locale) {
  localStorage.setItem('locale', locale);
  window.dispatchEvent(new CustomEvent('app:locale-change', { detail: locale }));
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    const initialLocale = savedLocale === 'en' || savedLocale === 'bn' ? savedLocale : 'en';
    setLocale(initialLocale);

    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<Locale>).detail;
      setLocale(nextLocale);
    };

    window.addEventListener('app:locale-change', handleLocaleChange);
    return () => window.removeEventListener('app:locale-change', handleLocaleChange);
  }, []);

  const toggleLocale = useCallback(() => {
    const next = locale === 'en' ? 'bn' : 'en';
    setLocalePreference(next);
    setLocale(next);
  }, [locale]);

  return { locale, setLocale: setLocalePreference, toggleLocale };
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    const initialLocale = savedLocale === 'en' || savedLocale === 'bn' ? savedLocale : 'en';
    setLocalePreference(initialLocale);
  }, []);

  return <>{children}</>;
}
