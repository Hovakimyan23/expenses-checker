import { useCallback, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { TransactionList } from '@/components/TransactionList';
import { BudgetManager } from '@/components/BudgetManager';
import { TransactionForm } from '@/components/TransactionForm';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getInitialTheme, useThemeEffect } from '@/hooks/useTheme';
import { SAMPLE_TRANSACTIONS, SAMPLE_BUDGETS } from '@/lib/sampleData';
import type { Transaction, Budget, ThemeMode, ViewId } from '@/types';

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  useThemeEffect(theme);

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('finch.transactions', []);
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('finch.budgets', []);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('finch.theme', next);
      return next;
    });
  }, []);

  const openAdd = useCallback(() => {
    setEditingTx(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((t: Transaction) => {
    setEditingTx(t);
    setFormOpen(true);
  }, []);

  const saveTransaction = useCallback(
    (t: Transaction) => {
      setTransactions((prev) => {
        const exists = prev.some((x) => x.id === t.id);
        return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
      });
    },
    [setTransactions],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((x) => x.id !== id));
    },
    [setTransactions],
  );

  const loadSample = useCallback(() => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setBudgets(SAMPLE_BUDGETS);
  }, [setTransactions, setBudgets]);

  const addBudget = useCallback(
    (b: Budget) => {
      setBudgets((prev) => (prev.some((x) => x.category === b.category) ? prev.map((x) => (x.category === b.category ? b : x)) : [...prev, b]));
    },
    [setBudgets],
  );

  const updateBudget = useCallback(
    (b: Budget) => {
      setBudgets((prev) => prev.map((x) => (x.category === b.category ? b : x)));
    },
    [setBudgets],
  );

  const deleteBudget = useCallback(
    (category: Budget['category']) => {
      setBudgets((prev) => prev.filter((x) => x.category !== category));
    },
    [setBudgets],
  );

  const content = useMemo(() => {
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
    }
  }, [view, transactions, budgets, openAdd, openEdit, loadSample, addBudget, updateBudget, deleteBudget]);

  return (
    <div className="min-h-screen">
      <Header view={view} onNavigate={setView} theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{content}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-gray-400 dark:text-gray-600 sm:px-6">
        Finch · Your data is stored locally in your browser.
      </footer>

      <TransactionForm
        open={formOpen}
        initial={editingTx}
        onClose={() => setFormOpen(false)}
        onSave={saveTransaction}
        onDelete={deleteTransaction}
      />
    </div>
  );
}

export default App;
