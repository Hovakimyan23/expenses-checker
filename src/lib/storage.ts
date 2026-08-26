import type { Transaction, Budget } from '@/types';

export const STORAGE_KEYS = {
  transactions: 'finch.transactions',
  budgets: 'finch.budgets',
  theme: 'finch.theme',
} as const;

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.transactions);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Transaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

export function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.budgets);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Budget[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
}
