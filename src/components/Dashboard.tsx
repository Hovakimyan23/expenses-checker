import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { SummaryCards } from '@/components/SummaryCards';
import { SpendingPieChart } from '@/components/SpendingPieChart';
import { MonthlyBarChart } from '@/components/MonthlyBarChart';
import { CATEGORIES } from '@/constants';
import { monthKey } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import type { Transaction, CategoryId } from '@/types';

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  const { t } = useSettings();

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const spendingByCategory: { category: CategoryId; value: number }[] = CATEGORIES.map((c) => ({
    category: c.id,
    value: expenseTransactions
      .filter((t) => t.category === c.id)
      .reduce((s, t) => s + t.amount, 0),
  }));

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const k = monthKey(t.date);
    const entry = monthlyMap.get(k) ?? { income: 0, expense: 0 };
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
    monthlyMap.set(k, entry);
  }
  const monthlyData = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  return (
    <div className="space-y-6 animate-fade-in">
      <SummaryCards totalBalance={totalBalance} totalIncome={totalIncome} totalExpense={totalExpense} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold">{t('spendingByCategory')}</h2>
          </div>
          <SpendingPieChart data={spendingByCategory} />
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold">{t('monthlyComparison')}</h2>
          </div>
          <MonthlyBarChart data={monthlyData} />
        </div>
      </div>
    </div>
  );
}
