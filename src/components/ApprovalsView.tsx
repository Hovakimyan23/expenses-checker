import { ClipboardCheck, Check, X, Inbox } from 'lucide-react';
import { CATEGORY_MAP, PAYMENT_METHOD_MAP } from '@/constants';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/TransactionForm';
import type { Transaction } from '@/types';

interface ApprovalsViewProps {
  transactions: Transaction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalsView({ transactions, onApprove, onReject }: ApprovalsViewProps) {
  const pending = transactions.filter((t) => t.status === 'pending');
  const reviewed = transactions
    .filter((t) => t.status === 'approved' || t.status === 'rejected')
    .sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? ''))
    .slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold">Approvals</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review and approve pending expense submissions from your team.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Inbox className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold">No pending approvals</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All caught up — new submissions will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
            <ClipboardCheck className="h-4 w-4" />
            {pending.length} pending {pending.length === 1 ? 'request' : 'requests'}
          </div>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {pending.map((t) => {
              const cat = CATEGORY_MAP[t.category];
              const Icon = cat.icon;
              return (
                <div key={t.id} className="flex items-center gap-3 p-4">
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
                      {t.authorName && (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline">by {t.authorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(t.amount)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onApprove(t.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onReject(t.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 transition hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-400"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Recently Reviewed</h3>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {reviewed.map((t) => {
              const cat = CATEGORY_MAP[t.category];
              const Icon = cat.icon;
              return (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bgClass}`}>
                    <Icon className={`h-5 w-5 ${cat.textClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(t.date)}</span>
                      <span>·</span>
                      <span>{formatCurrency(t.amount)}</span>
                    </div>
                  </div>
                  <StatusBadge status={t.status!} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
