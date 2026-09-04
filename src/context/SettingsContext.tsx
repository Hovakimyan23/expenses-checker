import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CurrencyCode, LanguageCode } from '@/types';
import { translations, type TranslationKey } from '@/lib/i18n';

interface SettingsContextValue {
  currency: CurrencyCode;
  language: LanguageCode;
  setCurrency: (c: CurrencyCode) => void;
  setLanguage: (l: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const CURRENCY_KEY = 'finch.currency';
const LANGUAGE_KEY = 'finch.language';

function getStoredCurrency(): CurrencyCode {
  try {
    const c = localStorage.getItem(CURRENCY_KEY) as CurrencyCode;
    if (c) return c;
  } catch { /* ignore */ }
  return 'USD';
}

function getStoredLanguage(): LanguageCode {
  try {
    const l = localStorage.getItem(LANGUAGE_KEY) as LanguageCode;
    if (l === 'en' || l === 'ru' || l === 'hy') return l;
  } catch { /* ignore */ }
  return 'en';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getStoredCurrency);
  const [language, setLanguageState] = useState<LanguageCode>(getStoredLanguage);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try { localStorage.setItem(CURRENCY_KEY, c); } catch { /* ignore */ }
  }, []);

  const setLanguage = useCallback((l: LanguageCode) => {
    setLanguageState(l);
    try { localStorage.setItem(LANGUAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let str = translations[language][key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [language],
  );

  return (
    <SettingsContext.Provider value={{ currency, language, setCurrency, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
