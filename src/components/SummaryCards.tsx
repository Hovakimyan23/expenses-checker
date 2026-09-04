import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import type { TranslationKey } from '@/lib/i18n';

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function SummaryCards({ totalBalance, totalIncome, totalExpense }: SummaryCardsProps) {
  const { t, currency } = useSettings();

  const cards = [
    {
      labelKey: 'totalBalance' as TranslationKey,
      value: totalBalance,
      icon: Wallet,
      accent: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-100 dark:bg-brand-500/15',
      subKey: (totalBalance >= 0 ? 'inTheGreen' : 'negativeBalance') as TranslationKey,
      subIcon: totalBalance >= 0 ? ArrowUpRight : ArrowDownRight,
    },
    {
      labelKey: 'totalIncome' as TranslationKey,
      value: totalIncome,
      icon: TrendingUp,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-500/15',
      subKey: 'moneyIn' as TranslationKey,
      subIcon: ArrowUpRight,
    },
    {
      labelKey: 'totalExpenses' as TranslationKey,
      value: totalExpense,
      icon: TrendingDown,
      accent: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-500/15',
      subKey: 'moneyOut' as TranslationKey,
      subIcon: ArrowDownRight,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const SubIcon = c.subIcon;
        return (
          <div key={c.labelKey} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t(c.labelKey)}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight sm:text-[28px]">
                  {formatCurrency(c.value, currency)}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.accent}`} />
              </div>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${c.accent}`}>
              <SubIcon className="h-3.5 w-3.5" />
              {t(c.subKey)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
