import type { Transaction, Budget } from '@/types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function monthsAgoISO(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 's1', title: 'Monthly Salary', amount: 4200, category: 'salary', type: 'income', date: monthsAgoISO(0).slice(0, 8) + '01', paymentMethod: 'bank' },
  { id: 's2', title: 'Freelance Project', amount: 850, category: 'salary', type: 'income', date: daysAgo(12), paymentMethod: 'bank' },
  { id: 's3', title: 'Dividend Payout', amount: 320, category: 'investments', type: 'income', date: daysAgo(20), paymentMethod: 'bank' },

  { id: 's4', title: 'Grocery Run', amount: 87.4, category: 'food', type: 'expense', date: daysAgo(1), paymentMethod: 'card' },
  { id: 's5', title: 'Dinner with friends', amount: 64.2, category: 'food', type: 'expense', date: daysAgo(3), paymentMethod: 'card' },
  { id: 's6', title: 'Coffee', amount: 6.5, category: 'food', type: 'expense', date: daysAgo(5), paymentMethod: 'wallet' },
  { id: 's7', title: 'Weekly groceries', amount: 52.3, category: 'food', type: 'expense', date: daysAgo(8), paymentMethod: 'card' },

  { id: 's8', title: 'Electricity Bill', amount: 78.0, category: 'utilities', type: 'expense', date: daysAgo(6), paymentMethod: 'bank' },
  { id: 's9', title: 'Internet', amount: 49.99, category: 'utilities', type: 'expense', date: daysAgo(9), paymentMethod: 'card' },
  { id: 's10', title: 'Water Bill', amount: 32.5, category: 'utilities', type: 'expense', date: daysAgo(15), paymentMethod: 'bank' },

  { id: 's11', title: 'Movie Night', amount: 28.0, category: 'entertainment', type: 'expense', date: daysAgo(4), paymentMethod: 'card' },
  { id: 's12', title: 'Streaming Sub', amount: 15.99, category: 'entertainment', type: 'expense', date: daysAgo(10), paymentMethod: 'card' },
  { id: 's13', title: 'Concert Tickets', amount: 120.0, category: 'entertainment', type: 'expense', date: daysAgo(25), paymentMethod: 'card' },

  { id: 's14', title: 'Metro Pass', amount: 60.0, category: 'transport', type: 'expense', date: daysAgo(2), paymentMethod: 'wallet' },
  { id: 's15', title: 'Ride Share', amount: 18.75, category: 'transport', type: 'expense', date: daysAgo(7), paymentMethod: 'wallet' },
  { id: 's16', title: 'Fuel', amount: 45.0, category: 'transport', type: 'expense', date: daysAgo(14), paymentMethod: 'card' },

  // Last month for bar chart comparison
  { id: 's17', title: 'Monthly Salary', amount: 4200, category: 'salary', type: 'income', date: monthsAgoISO(1).slice(0, 8) + '01', paymentMethod: 'bank' },
  { id: 's18', title: 'Groceries', amount: 210.0, category: 'food', type: 'expense', date: monthsAgoISO(1).slice(0, 8) + '12', paymentMethod: 'card' },
  { id: 's19', title: 'Utilities', amount: 160.0, category: 'utilities', type: 'expense', date: monthsAgoISO(1).slice(0, 8) + '15', paymentMethod: 'bank' },
  { id: 's20', title: 'Fuel', amount: 90.0, category: 'transport', type: 'expense', date: monthsAgoISO(1).slice(0, 8) + '18', paymentMethod: 'card' },
];

export const SAMPLE_BUDGETS: Budget[] = [
  { category: 'food', limit: 300 },
  { category: 'utilities', limit: 200 },
  { category: 'entertainment', limit: 150 },
  { category: 'transport', limit: 150 },
];
