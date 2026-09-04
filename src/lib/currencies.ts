import type { CurrencyCode, LanguageCode } from '@/types';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'RUB', label: 'Russian Ruble', symbol: '₽', locale: 'ru-RU' },
  { code: 'AMD', label: 'Armenian Dram', symbol: '֏', locale: 'hy-AM' },
  { code: 'GBP', label: 'British Pound', symbol: '£', locale: 'en-GB' },
];

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyConfig> =
  CURRENCIES.reduce(
    (acc, c) => ({ ...acc, [c.code]: c }),
    {} as Record<CurrencyCode, CurrencyConfig>,
  );

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ru', label: 'Русский', flag: 'RU' },
  { code: 'hy', label: 'Հայերեն', flag: 'HY' },
];

export const LANGUAGE_MAP: Record<LanguageCode, LanguageConfig> =
  LANGUAGES.reduce(
    (acc, l) => ({ ...acc, [l.code]: l }),
    {} as Record<LanguageCode, LanguageConfig>,
  );
