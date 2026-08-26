'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translations, type Language } from '../i18n/translations';

const STORAGE_KEY = 'parkshare-language';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (nextLanguage: Language) => void;
  t: (key: string) => string;
}>({
  language: 'en',
  setLanguage: () => undefined,
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && LANGUAGES.includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-language', language);
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: (nextLanguage: Language) => setLanguageState(nextLanguage),
    t: (key: string) => translations[language][key] ?? translations.en[key] ?? key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
