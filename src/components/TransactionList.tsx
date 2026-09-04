import { useMemo, useState } from 'react';
import { Search, Plus, Download, Sparkles, Pencil, ArrowUpRight, ArrowDownRight, Filter, Check, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_MAP, PAYMENT_METHOD_KEYS } from '@/constants';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import { StatusBadge } from '@/components/TransactionForm';
import type { Transaction, CategoryId, TransactionType, AppMode, OrgRole, TxStatus } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onLoadSample: () => void;
  mode?: AppMode;
  role?: OrgRole | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

type FilterType = 'all' | TransactionType;
type FilterCategory = 'all' | CategoryId;
type FilterStatus = 'all' | TxStatus;

export function TransactionList({
  transactions, onAdd, onEdit, onLoadSample, mode = 'personal', role, onApprove, onReject,
}: TransactionListProps) {
  const { t, currency, language } = useSettings();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isCorporate = mode === 'corporate';
  const canApprove = isCorporate && (role === 'admin' || role === 'manager');

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.category !== filterCategory) return false;
        if (isCorporate && filterStatus !== 'all' && (t.status ?? 'approved') !== filterStatus) return false;
        if (fromDate && t.date < fromDate) return false;
        if (toDate && t.date > toDate) return false;
        if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactions, filterType, filterCategory, filterStatus, fromDate, toDate, search, isCorporate]);

  const hasFilters = filterType !== 'all' || filterCategory !== 'all' || (isCorporate && filterStatus !== 'all') || fromDate || toDate || search;

  function clearFilters() {
    setFilterType('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setFromDate('');
    setToDate('');
    setSearch('');
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder={t('searchByTitle')}
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
            {t('filters')}
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
          </button>
          {!isCorporate && (
            <button onClick={onLoadSample} className="btn-secondary">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t('sampleData')}</span>
            </button>
          )}
          <button onClick={() => downloadCSV(filtered)} className="btn-secondary" disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('export')}</span>
          </button>
          <button onClick={onAdd} className="btn-primary">
            <Plus className="h-4 w-4" />
            {t('add')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card animate-scale-in p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('allTypes').replace('All ', '')}</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)}>
                <option value="all">{t('allTypes')}</option>
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</label>
              <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}>
                <option value="all">{t('allCategories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>
            {isCorporate && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('allStatuses').replace('All ', '')}</label>
                <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}>
                  <option value="all">{t('allStatuses')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="approved">{t('approved')}</option>
                  <option value="rejected">{t('rejected')}</option>
                </select>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('fromDate')}</label>
              <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('toDate')}</label>
              <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              {t('clearFilters')}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold">{t('noTransactionsFound')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasFilters ? t('tryAdjustingFilters') : t('addFirstTransaction')}
            </p>
          </div>
          {!hasFilters && (
            <button onClick={onAdd} className="btn-primary">
              <Plus className="h-4 w-4" />
              {t('addTransaction')}
            </button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((tx) => {
            const cat = CATEGORY_MAP[tx.category];
            const Icon = cat.icon;
            const isIncome = tx.type === 'income';
            const status = tx.status;
            const isPending = status === 'pending';
            const isRejected = status === 'rejected';
            return (
              <div
                key={tx.id}
                className="group flex w-full items-center gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <button onClick={() => onEdit(tx)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bgClass}`}>
                    <Icon className={`h-5 w-5 ${cat.textClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`badge ${cat.bgClass} ${cat.textClass} px-2 py-0.5`}>{t(cat.labelKey)}</span>
                      <span>{formatDate(tx.date, language)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{t(PAYMENT_METHOD_KEYS[tx.paymentMethod])}</span>
                      {isCorporate && status && (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <StatusBadge status={status} />
                        </>
                      )}
                      {tx.note && (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden truncate sm:inline">{tx.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isRejected ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                  )}
                  {canApprove && isPending && onApprove && onReject && (
                    <div className="ml-1 flex gap-1">
                      <button
                        onClick={() => onApprove(tx.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"
                        title={t('approved')}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onReject(tx.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 transition hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-400"
                        title={t('rejected')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => onEdit(tx)} className="p-0">
                    <Pencil className="h-4 w-4 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="px-1 text-xs text-gray-400 dark:text-gray-500">
        {t('showingTransactions', { shown: filtered.length, total: transactions.length })}
      </p>
    </div>
  );
}
