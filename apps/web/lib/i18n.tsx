'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LOCALE_KEY = 'vetflow_locale';
const DEFAULT_LOCALE = 'he';

type Translations = Record<string, unknown>;

interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
  dir: 'rtl',
});

function resolveKey(obj: Translations, key: string): string {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>({});
  const mountedRef = useRef(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && (stored === 'he' || stored === 'en')) {
      setLocaleState(stored);
    }
    mountedRef.current = true;
  }, []);

  // Fetch translations whenever locale changes
  useEffect(() => {
    let cancelled = false;
    fetch(`/locales/${locale}/common.json`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTranslations(data);
      })
      .catch(() => {
        if (!cancelled) setTranslations({});
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return resolveKey(translations, key);
    },
    [translations],
  );

  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return <I18nContext.Provider value={{ locale, setLocale, t, dir }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
