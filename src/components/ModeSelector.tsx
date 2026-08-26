import { Wallet, User, Building2, ArrowRight } from 'lucide-react';
import type { AppMode } from '@/types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Finch</h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Choose how you want to use Finch
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Personal */}
          <button
            onClick={() => onSelect('personal')}
            className="card group p-6 text-left transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
              <User className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-bold">Personal</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track your own expenses and budgets. Data stays in your browser — no account needed.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
              Get started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>

          {/* Corporate */}
          <button
            onClick={() => onSelect('corporate')}
            className="card group p-6 text-left transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/15">
              <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="text-lg font-bold">Corporate</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Shared workspace with team members, roles, expense approvals, and org-wide budgets.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-400">
              Sign in or sign up
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          You can switch modes anytime from the header.
        </p>
      </div>
    </div>
  );
}
