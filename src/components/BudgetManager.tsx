import { useState } from 'react';
import { Plus, X, AlertTriangle, Check, Pencil } from 'lucide-react';
import { EXPENSE_CATEGORIES, CATEGORY_MAP } from '@/constants';
import { formatCurrency, monthKey, formatMonthYear } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import type { Budget, Transaction, CategoryId } from '@/types';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAdd: (b: Budget) => void;
  onUpdate: (b: Budget) => void;
  onDelete: (categoryId: CategoryId) => void;
}

export function BudgetManager({ budgets, transactions, onAdd, onUpdate, onDelete }: BudgetManagerProps) {
  const { t, currency, language } = useSettings();
  const [editing, setEditing] = useState<CategoryId | null>(null);
  const [value, setValue] = useState('');
  const [adding, setAdding] = useState<CategoryId | null>(null);
  const [addValue, setAddValue] = useState('');

  const currentMonth = monthKey(new Date().toISOString().slice(0, 10));

  const spentByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (monthKey(tx.date) !== currentMonth) continue;
    spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount;
  }

  const budgetedIds = new Set(budgets.map((b) => b.category));
  const unbudgeted = EXPENSE_CATEGORIES.filter((c) => !budgetedIds.has(c.id));

  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'RUB' ? '₽' : '֏';

  function startEdit(cat: CategoryId, current: number) {
    setEditing(cat);
    setValue(String(current || ''));
  }

  function saveEdit() {
    if (!editing) return;
    const parsed = parseFloat(value);
    if (parsed > 0) {
      onUpdate({ category: editing, limit: Math.round(parsed * 100) / 100 });
    }
    setEditing(null);
  }

  function saveAdd() {
    if (!adding) return;
    const parsed = parseFloat(addValue);
    if (parsed > 0) {
      onAdd({ category: adding, limit: Math.round(parsed * 100) / 100 });
    }
    setAdding(null);
    setAddValue('');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t('monthlyBudgets')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('trackSpendingLimits', { month: formatMonthYear(language) })}
          </p>
        </div>
      </div>

      {budgets.length === 0 && unbudgeted.length === 0 ? (
        <div className="card p-12 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('allCategoriesBudgeted')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const cat = CATEGORY_MAP[b.category];
            const Icon = cat.icon;
            const spent = spentByCategory[b.category] ?? 0;
            const pct = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
            const rawPct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const over = rawPct > 100;
            const warning = rawPct > 80 && !over;

            const barColor = over
              ? 'bg-rose-500'
              : warning
                ? 'bg-amber-500'
                : cat.color;

            return (
              <div key={b.category} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.bgClass}`}>
                      <Icon className={`h-5 w-5 ${cat.textClass}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{t(cat.labelKey)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('limit')} {formatCurrency(b.limit, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(b.category, b.limit)} className="btn-ghost h-8 w-8 rounded-lg p-0">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(b.category)} className="btn-ghost h-8 w-8 rounded-lg p-0 text-rose-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {editing === b.category ? (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{symbol}</span>
                      <input
                        className="input pl-7"
                        type="number"
                        step="0.01"
                        min="0"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                    </div>
                    <button onClick={saveEdit} className="btn-primary">
                      {t('save')}
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-secondary">
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{formatCurrency(spent, currency)} {t('expense').toLowerCase()}</span>
                        <span
                          className={`text-xs font-semibold ${
                            over
                              ? 'text-rose-600 dark:text-rose-400'
                              : warning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {Math.round(rawPct)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs">
                      {over ? (
                        <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('overBudgetBy', { amount: formatCurrency(spent - b.limit, currency) })}
                        </span>
                      ) : warning ? (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('approachingLimit', { amount: formatCurrency(b.limit - spent, currency) })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          {t('remaining', { amount: formatCurrency(b.limit - spent, currency) })}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Add new budget */}
          {adding ? (
            <div className="card border-dashed p-5">
              <label className="mb-1.5 block text-sm font-medium">{t('category')}</label>
              <select
                className="input mb-3"
                value={adding}
                onChange={(e) => setAdding(e.target.value as CategoryId)}
              >
                {unbudgeted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
              <label className="mb-1.5 block text-sm font-medium">{t('limit')}</label>
              <div className="relative mb-3">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{symbol}</span>
                <input
                  className="input pl-7"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveAdd()}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveAdd} className="btn-primary">
                  {t('addBudget')}
                </button>
                <button onClick={() => setAdding(null)} className="btn-secondary">
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            unbudgeted.length > 0 && (
              <button
                onClick={() => {
                  setAdding(unbudgeted[0].id);
                  setAddValue('');
                }}
                className="card flex min-h-[140px] items-center justify-center gap-2 border-dashed text-sm font-medium text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
              >
                <Plus className="h-5 w-5" />
                {t('addBudget')}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
