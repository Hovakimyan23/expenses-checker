import { Wallet, User, Building2, ArrowRight } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import type { AppMode } from '@/types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  const { t } = useSettings();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Finch</h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            {t('chooseMode')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => onSelect('personal')}
            className="card group p-6 text-left transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
              <User className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-bold">{t('personal')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('personalDesc')}
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
              {t('getStarted')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => onSelect('corporate')}
            className="card group p-6 text-left transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/15">
              <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="text-lg font-bold">{t('corporate')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('corporateDesc')}
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-400">
              {t('signInOrSignUp')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          {t('switchModeAnytime')}
        </p>
      </div>
    </div>
  );
}
