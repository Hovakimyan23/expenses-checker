import { useMemo, useState } from 'react';
import { Search, Plus, Download, Sparkles, Pencil, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, PAYMENT_METHOD_MAP } from '@/constants';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/format';
import type { Transaction, CategoryId, TransactionType } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onLoadSample: () => void;
}

type FilterType = 'all' | TransactionType;
type FilterCategory = 'all' | CategoryId;

export function TransactionList({ transactions, onAdd, onEdit, onLoadSample }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (fromDate && t.date < fromDate) return false;
        if (toDate && t.date > toDate) return false;
        if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactions, filterType, filterCategory, fromDate, toDate, search]);

  const hasFilters = filterType !== 'all' || filterCategory !== 'all' || fromDate || toDate || search;

  function clearFilters() {
    setFilterType('all');
    setFilterCategory('all');
    setFromDate('');
    setToDate('');
    setSearch('');
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`btn-secondary ${hasFilters ? 'border-brand-400 text-brand-700 dark:text-brand-400' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
          </button>
          <button onClick={onLoadSample} className="btn-secondary">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Sample Data</span>
          </button>
          <button onClick={() => downloadCSV(filtered)} className="btn-secondary" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={onAdd} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card animate-scale-in p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
              <select
                className="input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
              <select
                className="input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">From date</label>
              <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">To date</label>
              <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold">No transactions found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasFilters ? 'Try adjusting your filters.' : 'Add your first transaction to get started.'}
            </p>
          </div>
          {!hasFilters && (
            <button onClick={onAdd} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((t) => {
            const cat = CATEGORY_MAP[t.category];
            const Icon = cat.icon;
            const isIncome = t.type === 'income';
            return (
              <button
                key={t.id}
                onClick={() => onEdit(t)}
                className="group flex w-full items-center gap-3 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bgClass}`}>
                  <Icon className={`h-5 w-5 ${cat.textClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className={`badge ${cat.bgClass} ${cat.textClass} px-2 py-0.5`}>{cat.label}</span>
                    <span>{formatDate(t.date)}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{PAYMENT_METHOD_MAP[t.paymentMethod]}</span>
                    {t.note && (
                      <>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden truncate sm:inline">{t.note}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  )}
                  <Pencil className="h-4 w-4 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="px-1 text-xs text-gray-400 dark:text-gray-500">
        Showing {filtered.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
