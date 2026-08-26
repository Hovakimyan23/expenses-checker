import { Wallet, Moon, Sun, LayoutDashboard, ArrowLeftRight, Target } from 'lucide-react';
import type { ThemeMode, ViewId } from '@/types';

interface HeaderProps {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: Target },
];

export function Header({ view, onNavigate, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight">Finch</h1>
            <p className="hidden text-[11px] text-gray-500 dark:text-gray-400 sm:block">
              Personal Expense Tracker
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/80">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-900 dark:text-brand-400'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={onToggleTheme}
          className="btn-ghost h-9 w-9 rounded-xl p-0"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
