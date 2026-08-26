import { useEffect, useState } from 'react';
import { X, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants';
import { todayISO, generateId } from '@/lib/format';
import type { Transaction, TransactionType, CategoryId, PaymentMethod, AppMode, OrgRole, TxStatus } from '@/types';

interface TransactionFormProps {
  open: boolean;
  initial?: Transaction | null;
  onClose: () => void;
  onSave: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  mode?: AppMode;
  role?: OrgRole | null;
}

const STATUS_STYLES: Record<TxStatus, { bg: string; text: string; icon: typeof Clock }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  approved: { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { bg: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-400', icon: XCircle },
};

export function TransactionForm({ open, initial, onClose, onSave, onDelete, mode = 'personal', role }: TransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<CategoryId>('food');
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (initial) {
        setTitle(initial.title);
        setAmount(String(initial.amount));
        setType(initial.type);
        setCategory(initial.category);
        setDate(initial.date);
        setPaymentMethod(initial.paymentMethod);
        setNote(initial.note ?? '');
      } else {
        setTitle('');
        setAmount('');
        setType('expense');
        setCategory('food');
        setDate(todayISO());
        setPaymentMethod('card');
        setNote('');
      }
      setError('');
    }
  }, [open, initial]);

  useEffect(() => {
    const valid = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!valid.some((c) => c.id === category)) {
      setCategory(valid[0].id);
    }
  }, [type, category]);

  if (!open) return null;

  const availableCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isCorporate = mode === 'corporate';
  const canEdit = !isCorporate || !initial?.status || initial.status === 'pending' || role === 'admin';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!title.trim()) return setError('Please enter a title.');
    if (!parsed || parsed <= 0) return setError('Amount must be greater than zero.');
    onSave({
      id: initial?.id ?? generateId(),
      title: title.trim(),
      amount: Math.round(parsed * 100) / 100,
      type,
      category,
      date,
      paymentMethod,
      note: note.trim() || undefined,
      status: initial?.status,
      user_id: initial?.user_id,
      org_id: initial?.org_id,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="btn-ghost h-8 w-8 rounded-lg p-0" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {initial?.status && isCorporate && (
          <div className="mb-4">
            <StatusBadge status={initial.status} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                disabled={!canEdit}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition disabled:opacity-50 ${
                  type === t
                    ? t === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-rose-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grocery shopping"
              autoFocus
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  className="input pl-7"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {availableCategories.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    disabled={!canEdit}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                      active
                        ? `${c.bgClass} ${c.textClass} ${c.borderClass}`
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Payment Method</label>
            <select
              className="input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              disabled={!canEdit}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Note (optional)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              disabled={!canEdit}
            />
          </div>

          {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            {initial && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(initial.id); onClose(); }}
                className="btn border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              {canEdit && (
                <button type="submit" className="btn-primary">
                  {initial ? 'Save Changes' : 'Add Transaction'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: TxStatus }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
