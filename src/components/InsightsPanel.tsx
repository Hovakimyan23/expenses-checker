import {
  TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Target, PiggyBank,
} from 'lucide-react';
import { formatCurrency, monthKey } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import { CATEGORY_MAP } from '@/constants';
import type { Transaction } from '@/types';
import type { TranslationKey } from '@/lib/i18n';

interface InsightsPanelProps {
  transactions: Transaction[];
  budgets: { category: string; limit: number }[];
}

interface Insight {
  icon: typeof Lightbulb;
  color: string;
  bgColor: string;
  text: string;
}

export function InsightsPanel({ transactions, budgets }: InsightsPanelProps) {
  const { t, currency } = useSettings();

  const insights: Insight[] = [];
  const currentMonth = monthKey(new Date().toISOString().slice(0, 10));

  const monthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && monthKey(tx.date) === currentMonth,
  );
  const monthIncome = transactions.filter(
    (tx) => tx.type === 'income' && monthKey(tx.date) === currentMonth,
  );
  const monthExpenseTotal = monthExpenses.reduce((s, tx) => s + tx.amount, 0);
  const monthIncomeTotal = monthIncome.reduce((s, tx) => s + tx.amount, 0);

  if (monthIncomeTotal > 0) {
    const savingsRate = ((monthIncomeTotal - monthExpenseTotal) / monthIncomeTotal) * 100;
    if (savingsRate >= 20) {
      insights.push({
        icon: PiggyBank,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-500/15',
        text: t('insightSavingsGood', { pct: Math.round(savingsRate) }),
      });
    } else if (savingsRate < 0) {
      insights.push({
        icon: AlertTriangle,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-100 dark:bg-rose-500/15',
        text: t('insightOverspending'),
      });
    } else {
      insights.push({
        icon: Lightbulb,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-500/15',
        text: t('insightSavingsLow', { pct: Math.round(savingsRate) }),
      });
    }
  }

  if (monthExpenses.length > 0) {
    const byCat = new Map<string, number>();
    for (const tx of monthExpenses) {
      byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amount);
    }
    const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const cat = CATEGORY_MAP[top[0] as keyof typeof CATEGORY_MAP];
      if (cat) {
        insights.push({
          icon: TrendingDown,
          color: cat.textClass,
          bgColor: cat.bgClass,
          text: t('insightTopCategory', {
            category: t(cat.labelKey as TranslationKey),
            amount: formatCurrency(top[1], currency),
          }),
        });
      }
    }
  }

  for (const b of budgets) {
    const spent = monthExpenses
      .filter((tx) => tx.category === b.category)
      .reduce((s, tx) => s + tx.amount, 0);
    if (b.limit > 0 && spent / b.limit > 0.8) {
      const cat = CATEGORY_MAP[b.category as keyof typeof CATEGORY_MAP];
      if (cat) {
        const over = spent > b.limit;
        insights.push({
          icon: over ? AlertTriangle : Target,
          color: over ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
          bgColor: over ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-amber-100 dark:bg-amber-500/15',
          text: over
            ? t('insightBudgetOver', { category: t(cat.labelKey as TranslationKey), amount: formatCurrency(spent - b.limit, currency) })
            : t('insightBudgetNear', { category: t(cat.labelKey as TranslationKey), amount: formatCurrency(b.limit - spent, currency) }),
        });
      }
    }
  }

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);
  const lastMonthExpenses = transactions
    .filter((tx) => tx.type === 'expense' && monthKey(tx.date) === lastMonthKey)
    .reduce((s, tx) => s + tx.amount, 0);

  if (lastMonthExpenses > 0 && monthExpenseTotal > 0) {
    const change = ((monthExpenseTotal - lastMonthExpenses) / lastMonthExpenses) * 100;
    if (Math.abs(change) > 5) {
      insights.push({
        icon: change > 0 ? TrendingUp : TrendingDown,
        color: change > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
        bgColor: change > 0 ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-emerald-100 dark:bg-emerald-500/15',
        text: t('insightMoMChange', { pct: Math.abs(Math.round(change)), dir: change > 0 ? '↑' : '↓' }),
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      text: t('insightNoData'),
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-500" />
        <h2 className="text-sm font-semibold">{t('insightsTitle')}</h2>
      </div>
      <div className="space-y-2.5">
        {insights.slice(0, 5).map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}>
                <Icon className={`h-4 w-4 ${insight.color}`} />
              </div>
              <p className="pt-1 text-sm text-gray-700 dark:text-gray-300">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
