import type { Transaction, CurrencyCode, LanguageCode } from '@/types';
import { CURRENCY_MAP } from '@/lib/currencies';

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD', opts?: { compact?: boolean }): string {
  const cfg = CURRENCY_MAP[currency] ?? CURRENCY_MAP.USD;
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.code,
    notation: opts?.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(amount);
}

export function formatDate(iso: string, language: LanguageCode = 'en'): string {
  const locale = language === 'ru' ? 'ru-RU' : language === 'hy' ? 'hy-AM' : 'en-US';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-mm
}

export function monthLabel(key: string, language: LanguageCode = 'en'): string {
  const locale = language === 'ru' ? 'ru-RU' : language === 'hy' ? 'hy-AM' : 'en-US';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, {
    month: 'short',
    year: '2-digit',
  });
}

export function formatMonthYear(language: LanguageCode = 'en'): string {
  const locale = language === 'ru' ? 'ru-RU' : language === 'hy' ? 'hy-AM' : 'en-US';
  return new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function toCSV(transactions: Transaction[]): string {
  const header = ['Title', 'Amount', 'Type', 'Category', 'Date', 'Payment Method', 'Note'];
  const rows = transactions.map((t) => [
    escapeCSV(t.title),
    t.amount.toFixed(2),
    t.type,
    t.category,
    t.date,
    t.paymentMethod,
    escapeCSV(t.note ?? ''),
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function escapeCSV(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCSV(transactions: Transaction[]): void {
  const csv = toCSV(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finch-transactions-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
