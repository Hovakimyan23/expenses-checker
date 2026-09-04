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
import type { TranslationKey } from '@/lib/i18n';

export interface CategoryConfig {
  id: CategoryId;
  labelKey: TranslationKey;
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
    labelKey: 'food',
    icon: UtensilsCrossed,
    color: '#f97316',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-500/15',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
    type: 'expense',
  },
  {
    id: 'utilities',
    labelKey: 'utilities',
    icon: Lightbulb,
    color: '#eab308',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-500/15',
    borderClass: 'border-yellow-200 dark:border-yellow-500/30',
    type: 'expense',
  },
  {
    id: 'entertainment',
    labelKey: 'entertainment',
    icon: Clapperboard,
    color: '#ec4899',
    textClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-100 dark:bg-pink-500/15',
    borderClass: 'border-pink-200 dark:border-pink-500/30',
    type: 'expense',
  },
  {
    id: 'transport',
    labelKey: 'transport',
    icon: Bus,
    color: '#0ea5e9',
    textClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-500/15',
    borderClass: 'border-sky-200 dark:border-sky-500/30',
    type: 'expense',
  },
  {
    id: 'salary',
    labelKey: 'salary',
    icon: Wallet,
    color: '#10b981',
    textClass: 'text-brand-600 dark:text-brand-400',
    bgClass: 'bg-brand-100 dark:bg-brand-500/15',
    borderClass: 'border-brand-200 dark:border-brand-500/30',
    type: 'income',
  },
  {
    id: 'investments',
    labelKey: 'investments',
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

export const PAYMENT_METHODS: { id: PaymentMethod; labelKey: TranslationKey }[] = [
  { id: 'cash', labelKey: 'cash' },
  { id: 'card', labelKey: 'creditDebitCard' },
  { id: 'bank', labelKey: 'bankTransfer' },
  { id: 'wallet', labelKey: 'digitalWallet' },
];

export const PAYMENT_METHOD_KEYS: Record<PaymentMethod, TranslationKey> =
  PAYMENT_METHODS.reduce(
    (acc, m) => ({ ...acc, [m.id]: m.labelKey }),
    {} as Record<PaymentMethod, TranslationKey>,
  );
