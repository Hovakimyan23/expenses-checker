import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { TransactionList } from '@/components/TransactionList';
import { BudgetManager } from '@/components/BudgetManager';
import { TransactionForm } from '@/components/TransactionForm';
import { ModeSelector } from '@/components/ModeSelector';
import { AuthForm } from '@/components/AuthForm';
import { ApprovalsView } from '@/components/ApprovalsView';
import { TeamView } from '@/components/TeamView';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getInitialTheme, useThemeEffect } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { SAMPLE_TRANSACTIONS, SAMPLE_BUDGETS } from '@/lib/sampleData';
import type { Transaction, Budget, ThemeMode, ViewId, AppMode } from '@/types';

const MODE_KEY = 'finch.mode';

function getStoredMode(): AppMode | null {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === 'personal' || m === 'corporate' ? m : null;
  } catch {
    return null;
  }
}

function AppContent() {
  const auth = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  useThemeEffect(theme);

  const [mode, setMode] = useState<AppMode | null>(getStoredMode);
  const [view, setView] = useState<ViewId>('dashboard');

  // Personal state (localStorage)
  const [pTransactions, setPTransactions] = useLocalStorage<Transaction[]>('finch.transactions', []);
  const [pBudgets, setPBudgets] = useLocalStorage<Budget[]>('finch.budgets', []);

  // Corporate state (Supabase)
  const [cTransactions, setCTransactions] = useState<Transaction[]>([]);
  const [cBudgets, setCBudgets] = useState<Budget[]>([]);
  const [cLoading, setCLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('finch.theme', next);
      return next;
    });
  }, []);

  function selectMode(m: AppMode) {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
    setView('dashboard');
  }

  function switchMode() {
    setMode(null);
    localStorage.removeItem(MODE_KEY);
  }

  // Load corporate data when authenticated
  const loadCorporateData = useCallback(async () => {
    if (!auth.orgId) return;
    setCLoading(true);

    const [txRes, budgetRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('org_id', auth.orgId).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('org_id', auth.orgId),
    ]);

    if (txRes.data) {
      setCTransactions(txRes.data.map((t) => ({
        id: t.id,
        title: t.title,
        amount: Number(t.amount),
        category: t.category,
        type: t.type,
        date: t.date,
        paymentMethod: t.payment_method,
        note: t.note ?? undefined,
        status: t.status,
        user_id: t.user_id,
        org_id: t.org_id,
        reviewer_id: t.reviewer_id,
        reviewed_at: t.reviewed_at,
        created_at: t.created_at,
      })));
    }

    if (budgetRes.data) {
      setCBudgets(budgetRes.data.map((b) => ({
        id: b.id,
        category: b.category,
        limit: Number(b.budget_limit),
        org_id: b.org_id,
      })));
    }

    setCLoading(false);
  }, [auth.orgId]);

  useEffect(() => {
    if (mode === 'corporate' && auth.orgId) {
      loadCorporateData();
    }
  }, [mode, auth.orgId, loadCorporateData]);

  // Realtime subscription for corporate transactions
  useEffect(() => {
    if (mode !== 'corporate' || !auth.orgId) return;

    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `org_id=eq.${auth.orgId}`,
      }, () => {
        loadCorporateData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'budgets',
        filter: `org_id=eq.${auth.orgId}`,
      }, () => {
        loadCorporateData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, auth.orgId, loadCorporateData]);

  // Determine which data set to use
  const isCorporate = mode === 'corporate';
  const transactions = isCorporate ? cTransactions : pTransactions;
  const budgets = isCorporate ? cBudgets : pBudgets;
  const role = isCorporate ? auth.role : null;

  // CRUD operations
  const openAdd = useCallback(() => {
    setEditingTx(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((t: Transaction) => {
    setEditingTx(t);
    setFormOpen(true);
  }, []);

  const saveTransaction = useCallback(
    async (t: Transaction) => {
      if (isCorporate && auth.orgId) {
        const payload = {
          org_id: auth.orgId,
          user_id: t.user_id ?? auth.user?.id,
          title: t.title,
          amount: t.amount,
          category: t.category,
          type: t.type,
          date: t.date,
          payment_method: t.paymentMethod,
          note: t.note ?? null,
          status: t.status ?? 'approved',
        };

        const exists = cTransactions.some((x) => x.id === t.id);
        if (exists) {
          await supabase.from('transactions').update({
            title: t.title,
            amount: t.amount,
            category: t.category,
            type: t.type,
            date: t.date,
            payment_method: t.paymentMethod,
            note: t.note ?? null,
          }).eq('id', t.id);
        } else {
          // Employees submit as pending; managers/admins auto-approve
          const status = (auth.role === 'admin' || auth.role === 'manager') ? 'approved' : 'pending';
          await supabase.from('transactions').insert({ ...payload, status });
        }
        loadCorporateData();
      } else {
        setPTransactions((prev) => {
          const exists = prev.some((x) => x.id === t.id);
          return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
        });
      }
    },
    [isCorporate, auth.orgId, auth.user?.id, auth.role, cTransactions, setPTransactions, loadCorporateData],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (isCorporate) {
        await supabase.from('transactions').delete().eq('id', id);
        loadCorporateData();
      } else {
        setPTransactions((prev) => prev.filter((x) => x.id !== id));
      }
    },
    [isCorporate, setPTransactions, loadCorporateData],
  );

  const approveTransaction = useCallback(
    async (id: string) => {
      await supabase.from('transactions').update({
        status: 'approved',
        reviewer_id: auth.user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      loadCorporateData();
    },
    [auth.user?.id, loadCorporateData],
  );

  const rejectTransaction = useCallback(
    async (id: string) => {
      await supabase.from('transactions').update({
        status: 'rejected',
        reviewer_id: auth.user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      loadCorporateData();
    },
    [auth.user?.id, loadCorporateData],
  );

  const loadSample = useCallback(() => {
    setPTransactions(SAMPLE_TRANSACTIONS);
    setPBudgets(SAMPLE_BUDGETS);
  }, [setPTransactions, setPBudgets]);

  const addBudget = useCallback(
    async (b: Budget) => {
      if (isCorporate && auth.orgId) {
        const exists = cBudgets.some((x) => x.category === b.category);
        if (exists) {
          await supabase.from('budgets').update({ budget_limit: b.limit }).eq('org_id', auth.orgId).eq('category', b.category);
        } else {
          await supabase.from('budgets').insert({ org_id: auth.orgId, category: b.category, budget_limit: b.limit });
        }
        loadCorporateData();
      } else {
        setPBudgets((prev) => (prev.some((x) => x.category === b.category) ? prev.map((x) => (x.category === b.category ? b : x)) : [...prev, b]));
      }
    },
    [isCorporate, auth.orgId, cBudgets, setPBudgets, loadCorporateData],
  );

  const updateBudget = useCallback(
    async (b: Budget) => {
      if (isCorporate && auth.orgId) {
        await supabase.from('budgets').update({ budget_limit: b.limit }).eq('org_id', auth.orgId).eq('category', b.category);
        loadCorporateData();
      } else {
        setPBudgets((prev) => prev.map((x) => (x.category === b.category ? b : x)));
      }
    },
    [isCorporate, auth.orgId, setPBudgets, loadCorporateData],
  );

  const deleteBudget = useCallback(
    async (category: Budget['category']) => {
      if (isCorporate && auth.orgId) {
        await supabase.from('budgets').delete().eq('org_id', auth.orgId).eq('category', category);
        loadCorporateData();
      } else {
        setPBudgets((prev) => prev.filter((x) => x.category !== category));
      }
    },
    [isCorporate, auth.orgId, setPBudgets, loadCorporateData],
  );

  // Render logic
  if (mode === null) {
    return <ModeSelector onSelect={selectMode} />;
  }

  if (isCorporate) {
    if (auth.loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      );
    }

    if (!auth.session) {
      return <AuthForm />;
    }
  }

  const content = useMemo(() => {
    if (cLoading && isCorporate) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard transactions={transactions} />;
      case 'transactions':
        return (
          <TransactionList
            transactions={transactions}
            onAdd={openAdd}
            onEdit={openEdit}
            onLoadSample={loadSample}
            mode={mode ?? 'personal'}
            role={role}
            onApprove={approveTransaction}
            onReject={rejectTransaction}
          />
        );
      case 'budgets':
        return (
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            onAdd={addBudget}
            onUpdate={updateBudget}
            onDelete={deleteBudget}
          />
        );
      case 'approvals':
        return (
          <ApprovalsView
            transactions={transactions}
            onApprove={approveTransaction}
            onReject={rejectTransaction}
          />
        );
      case 'team':
        return auth.orgId ? (
          <TeamView orgId={auth.orgId} currentUserId={auth.user?.id ?? ''} />
        ) : null;
      default:
        return null;
    }
  }, [view, transactions, budgets, mode, role, cLoading, isCorporate, openAdd, openEdit, loadSample, addBudget, updateBudget, deleteBudget, approveTransaction, rejectTransaction, auth.orgId, auth.user?.id]);

  return (
    <div className="min-h-screen">
      <Header
        view={view}
        onNavigate={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        mode={mode}
        onSwitchMode={switchMode}
        userEmail={isCorporate ? auth.user?.email : undefined}
        orgName={isCorporate ? auth.membership?.org.name : undefined}
        role={isCorporate ? auth.role : null}
        onSignOut={auth.signOut}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{content}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-gray-400 dark:text-gray-600 sm:px-6">
        {isCorporate
          ? `Finch Corporate · ${auth.membership?.org.name ?? ''} · Shared workspace`
          : 'Finch · Your data is stored locally in your browser.'}
      </footer>

      <TransactionForm
        open={formOpen}
        initial={editingTx}
        onClose={() => setFormOpen(false)}
        onSave={saveTransaction}
        onDelete={deleteTransaction}
        mode={mode ?? 'personal'}
        role={role}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
