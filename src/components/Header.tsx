import { useState, useRef, useEffect } from 'react';
import {
  Wallet, Moon, Sun, LayoutDashboard, ArrowLeftRight, Target,
  ClipboardCheck, Users, LogOut, ChevronDown, Building2, User,
} from 'lucide-react';
import type { ThemeMode, ViewId, AppMode, OrgRole } from '@/types';

interface HeaderProps {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  mode: AppMode;
  onSwitchMode: () => void;
  userEmail?: string;
  orgName?: string;
  role?: OrgRole | null;
  onSignOut?: () => void;
}

const PERSONAL_NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: Target },
];

const CORPORATE_NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard; roles?: OrgRole[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['admin', 'manager'] },
  { id: 'budgets', label: 'Budgets', icon: Target, roles: ['admin', 'manager'] },
  { id: 'team', label: 'Team', icon: Users, roles: ['admin'] },
];

export function Header({
  view, onNavigate, theme, onToggleTheme, mode, onSwitchMode,
  userEmail, orgName, role, onSignOut,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = mode === 'corporate'
    ? CORPORATE_NAV.filter((item) => !item.roles || (role && item.roles.includes(role)))
    : PERSONAL_NAV;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Logo + mode badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Finch</h1>
              <span className={`badge px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                mode === 'corporate'
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                  : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
              }`}>
                {mode}
              </span>
            </div>
            <p className="hidden text-[11px] text-gray-500 dark:text-gray-400 sm:block">
              {mode === 'corporate' && orgName ? orgName : 'Expense Tracker'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800/80">
          {navItems.map((item) => {
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
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: theme + user menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="btn-ghost h-9 w-9 rounded-xl p-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {mode === 'corporate' && userEmail ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  {userEmail[0]?.toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 animate-scale-in rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                    <p className="truncate text-sm font-medium">{userEmail}</p>
                    {role && (
                      <p className="mt-0.5 text-xs capitalize text-gray-500 dark:text-gray-400">
                        {role}
                        {orgName ? ` · ${orgName}` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onSwitchMode(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4" />
                    Switch to Personal
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onSignOut?.(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSwitchMode}
              className="btn-ghost h-9 rounded-xl px-3 text-sm"
              aria-label="Switch mode"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
