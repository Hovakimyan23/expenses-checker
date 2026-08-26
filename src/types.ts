export type TransactionType = 'income' | 'expense';

export type CategoryId =
  | 'food'
  | 'utilities'
  | 'entertainment'
  | 'transport'
  | 'salary'
  | 'investments';

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'wallet';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: CategoryId;
  type: TransactionType;
  date: string; // ISO yyyy-mm-dd
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface Budget {
  category: CategoryId;
  limit: number;
}

export type ThemeMode = 'light' | 'dark';

export type ViewId = 'dashboard' | 'transactions' | 'budgets';
