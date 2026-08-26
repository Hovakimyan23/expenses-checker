import {
  UtensilsCrossed,
  Lightbulb,
  Clapperboard,
  Bus,
  Wallet,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId, PaymentMethod, TransactionType } from '@/types';

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  color: string; // hex for charts
  textClass: string;
  bgClass: string;
  borderClass: string;
  type: TransactionType | 'both';
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    color: '#f97316',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-500/15',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
    type: 'expense',
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: Lightbulb,
    color: '#eab308',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-500/15',
    borderClass: 'border-yellow-200 dark:border-yellow-500/30',
    type: 'expense',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: Clapperboard,
    color: '#ec4899',
    textClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-100 dark:bg-pink-500/15',
    borderClass: 'border-pink-200 dark:border-pink-500/30',
    type: 'expense',
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: Bus,
    color: '#0ea5e9',
    textClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-500/15',
    borderClass: 'border-sky-200 dark:border-sky-500/30',
    type: 'expense',
  },
  {
    id: 'salary',
    label: 'Salary',
    icon: Wallet,
    color: '#10b981',
    textClass: 'text-brand-600 dark:text-brand-400',
    bgClass: 'bg-brand-100 dark:bg-brand-500/15',
    borderClass: 'border-brand-200 dark:border-brand-500/30',
    type: 'income',
  },
  {
    id: 'investments',
    label: 'Investments',
    icon: TrendingUp,
    color: '#8b5cf6',
    textClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-500/15',
    borderClass: 'border-violet-200 dark:border-violet-500/30',
    type: 'income',
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryConfig> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, CategoryConfig>,
);

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense');
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'income');

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Credit/Debit Card' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'wallet', label: 'Digital Wallet' },
];

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> =
  PAYMENT_METHODS.reduce(
    (acc, m) => ({ ...acc, [m.id]: m.label }),
    {} as Record<PaymentMethod, string>,
  );
