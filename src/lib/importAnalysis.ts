import type { CategoryId } from '@/types';
import type { ParsedRow } from '@/lib/bankImport';
import { CATEGORY_MAP } from '@/constants';
import type { TranslationKey } from '@/lib/i18n';

export interface CategoryBreakdown {
  category: CategoryId;
  count: number;
  total: number;
  percentage: number;
}

export interface ImportAnalysis {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategories: CategoryBreakdown[];
  savingsRate: number | null;
  insights: { key: TranslationKey; params?: Record<string, string> }[];
}

export function analyzeImport(rows: ParsedRow[]): ImportAnalysis {
  const income = rows.filter((r) => r.type === 'income');
  const expenses = rows.filter((r) => r.type === 'expense');
  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  const categoryMap = new Map<CategoryId, { count: number; total: number }>();
  for (const r of expenses) {
    const entry = categoryMap.get(r.suggestedCategory) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += r.amount;
    categoryMap.set(r.suggestedCategory, entry);
  }

  const topCategories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, v]) => ({
      category,
      count: v.count,
      total: v.total,
      percentage: totalExpense > 0 ? (v.total / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;

  const insights: { key: TranslationKey; params?: Record<string, string> }[] = [];

  if (savingsRate !== null) {
    if (savingsRate >= 20) {
      insights.push({ key: 'importAnalysisSavingsGood', params: { pct: savingsRate.toFixed(0) } });
    } else if (savingsRate >= 0) {
      insights.push({ key: 'importAnalysisSavingsLow', params: { pct: savingsRate.toFixed(0) } });
    } else {
      insights.push({ key: 'importAnalysisOverspending' });
    }
  }

  if (topCategories.length > 0) {
    const top = topCategories[0];
    const catLabel = top.category as CategoryId;
    insights.push({
      key: 'importAnalysisTopCategory',
      params: { category: catLabel, pct: top.percentage.toFixed(0) },
    });
  }

  const foodCategory = topCategories.find((c) => c.category === 'food');
  if (foodCategory && foodCategory.percentage > 25) {
    insights.push({ key: 'importAnalysisFoodHigh', params: { pct: foodCategory.percentage.toFixed(0) } });
  }

  const entertainmentCategory = topCategories.find((c) => c.category === 'entertainment');
  if (entertainmentCategory && entertainmentCategory.percentage > 15) {
    insights.push({ key: 'importAnalysisEntertainmentHigh', params: { pct: entertainmentCategory.percentage.toFixed(0) } });
  }

  const utilitiesCategory = categoryMap.get('utilities');
  if (utilitiesCategory && utilitiesCategory.total > 0) {
    insights.push({ key: 'importAnalysisUtilitiesTip' });
  }

  if (insights.length === 0) {
    insights.push({ key: 'importAnalysisGeneric' });
  }

  return { totalIncome, totalExpense, balance, topCategories, savingsRate, insights };
}

export function getCategoryColorClass(category: CategoryId): string {
  return CATEGORY_MAP[category]?.bgClass ?? 'bg-gray-100 dark:bg-gray-800';
}
