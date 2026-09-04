export type TransactionType = 'income' | 'expense';

export type CategoryId =
  | 'food'
  | 'utilities'
  | 'entertainment'
  | 'transport'
  | 'salary'
  | 'investments';

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'wallet';

export type AppMode = 'personal' | 'corporate';

export type OrgRole = 'admin' | 'manager' | 'employee';

export type TxStatus = 'pending' | 'approved' | 'rejected';

export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'AMD' | 'GBP';

export type LanguageCode = 'en' | 'ru' | 'hy';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: CategoryId;
  type: TransactionType;
  date: string; // ISO yyyy-mm-dd
  paymentMethod: PaymentMethod;
  note?: string;
  // Corporate-only fields
  status?: TxStatus;
  user_id?: string;
  org_id?: string;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  authorName?: string; // joined from profile
}

export interface Budget {
  id?: string;
  category: CategoryId;
  limit: number;
  org_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  email?: string;
  name?: string;
  created_at: string;
}

export interface OrgMembership {
  org: Organization;
  role: OrgRole;
}

export type ThemeMode = 'light' | 'dark';

export type ViewId = 'dashboard' | 'transactions' | 'budgets' | 'approvals' | 'team';
