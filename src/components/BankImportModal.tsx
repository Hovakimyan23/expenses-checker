import { useState, useRef, useCallback, useMemo } from 'react';
import {
  X, Upload, FileText, Check, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown,
  Wallet, Lightbulb, PieChart as PieIcon,
} from 'lucide-react';
import {
  parseBankStatement, rowToTransaction, isExcelFile, excelToCsvText,
  type ParsedRow,
} from '@/lib/bankImport';
import { analyzeImport, type ImportAnalysis } from '@/lib/importAnalysis';
import { CATEGORY_MAP, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import { formatCurrency, formatDate } from '@/lib/format';
import { useSettings } from '@/context/SettingsContext';
import type { Transaction, CategoryId, TransactionType } from '@/types';

interface BankImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => void;
}

interface ReviewableRow extends ParsedRow {
  selected: boolean;
  category: CategoryId;
  type: TransactionType;
}

type Phase = 'upload' | 'analysis' | 'review';

export function BankImportModal({ open, onClose, onImport }: BankImportModalProps) {
  const { t, currency, language } = useSettings();
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ReviewableRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase('upload');
    setFileName('');
    setRows([]);
    setSkipped(0);
    setError('');
    setLoading(false);
    setExpandedRow(null);
  }, []);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setError('');
    setLoading(true);
    try {
      let text: string;
      if (isExcelFile(file.name)) {
        const buffer = await file.arrayBuffer();
        text = excelToCsvText(buffer);
      } else {
        text = await file.text();
      }
      const result = parseBankStatement(text, file.name);
      if (result.rows.length === 0) {
        setError(t('noRowsFound'));
        setLoading(false);
        return;
      }
      setFileName(file.name);
      setSkipped(result.skipped);
      setRows(result.rows.map((r) => ({
        ...r,
        selected: true,
        category: r.suggestedCategory,
        type: r.type,
      })));
      setPhase('analysis');
    } catch {
      setError(t('importError'));
    }
    setLoading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function toggleRow(idx: number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  }

  function updateRow(idx: number, changes: Partial<ReviewableRow>) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...changes } : r));
  }

  function toggleAll(selected: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected })));
  }

  function handleImport() {
    const selected = rows.filter((r) => r.selected);
    const transactions = selected.map((r) => rowToTransaction(r, { type: r.type, category: r.category }));
    onImport(transactions);
    handleClose();
  }

  if (!open) return null;

  const selectedCount = rows.filter((r) => r.selected).length;
  const totalAmount = rows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  const analysis = useMemo<ImportAnalysis | null>(() => {
    if (phase !== 'analysis') return null;
    return analyzeImport(rows);
  }, [phase, rows]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col animate-slide-up rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
              <Upload className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {phase === 'analysis' ? t('importAnalysis') : t('importBankStatement')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {phase === 'upload' ? t('importDesc') : `${fileName} · ${rows.length} ${t('importedRows')}`}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-ghost h-8 w-8 rounded-lg p-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {phase === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center transition hover:border-brand-400 dark:border-gray-700 dark:hover:border-brand-500"
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <FileText className="h-7 w-7 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('dragAndDrop')}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('orDragHere')}</p>
                  </div>
                  <button onClick={() => fileRef.current?.click()} className="btn-primary">
                    <Upload className="h-4 w-4" />
                    {t('importFile')}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </>
              )}
            </div>
          )}

          {phase === 'analysis' && analysis && (
            <div className="space-y-5 animate-fade-in">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t('importAnalysisTotalIncome')}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(analysis.totalIncome, currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {t('importAnalysisTotalExpense')}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-rose-700 dark:text-rose-300">
                    {formatCurrency(analysis.totalExpense, currency)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${analysis.balance >= 0 ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${analysis.balance >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    <Wallet className="h-3.5 w-3.5" />
                    {t('importAnalysisBalance')}
                  </div>
                  <p className={`mt-1.5 text-sm font-bold ${analysis.balance >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {formatCurrency(analysis.balance, currency)}
                  </p>
                </div>
              </div>

              {/* Savings rate */}
              {analysis.savingsRate !== null && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('importAnalysisSavingsRate')}</span>
                    <span className={`text-lg font-bold ${
                      analysis.savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400'
                        : analysis.savingsRate >= 0 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {analysis.savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analysis.savingsRate >= 20 ? 'bg-emerald-500'
                          : analysis.savingsRate >= 0 ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, analysis.savingsRate))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Top categories */}
              {analysis.topCategories.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-semibold">{t('importAnalysisTopCategories')}</h3>
                  </div>
                  <div className="space-y-2.5">
                    {analysis.topCategories.map((cat) => {
                      const config = CATEGORY_MAP[cat.category];
                      const Icon = config.icon;
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgClass}`}>
                            <Icon className={`h-4 w-4 ${config.textClass}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{t(config.labelKey)}</span>
                              <span className="text-sm font-semibold">{formatCurrency(cat.total, currency)}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className={`h-full rounded-full ${config.bgClass}`}
                                style={{ width: `${cat.percentage}%` }}
                              />
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-xs text-gray-400">
                              <span>{cat.count} {t('importedRows').toLowerCase()}</span>
                              <span>{cat.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Savings tips */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div className="mb-2.5 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('importAnalysisInsights')}</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {t(insight.key, insight.params)}
                    </li>
                  ))}
                </ul>
              </div>

              {skipped > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t('rowsSkipped', { count: skipped })}
                </div>
              )}
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {selectedCount} / {rows.length}
                </label>
                <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>

              {skipped > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t('rowsSkipped', { count: skipped })}
                </div>
              )}

              <div className="space-y-2">
                {rows.map((row, idx) => {
                  const cat = CATEGORY_MAP[row.category];
                  const CatIcon = cat.icon;
                  const isExpanded = expandedRow === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 transition ${
                        row.selected
                          ? 'border-gray-200 dark:border-gray-700'
                          : 'border-gray-100 opacity-50 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRow(idx)}
                          className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.description}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(row.date, language)}</span>
                            <span>·</span>
                            <span className={`badge ${cat.bgClass} ${cat.textClass} px-1.5 py-0.5`}>
                              <CatIcon className="h-3 w-3" />
                              {t(cat.labelKey)}
                            </span>
                            {row.confidence < 0.6 && (
                              <span className="text-amber-500">!</span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(row.amount, currency)}
                        </span>
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          className="btn-ghost h-7 w-7 rounded-lg p-0"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('allTypes').replace('All ', '')}</label>
                            <div className="grid grid-cols-2 gap-1">
                              {(['expense', 'income'] as TransactionType[]).map((tp) => (
                                <button
                                  key={tp}
                                  onClick={() => updateRow(idx, { type: tp })}
                                  className={`rounded-lg py-1.5 text-xs font-medium transition ${
                                    row.type === tp
                                      ? tp === 'income'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-rose-500 text-white'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  {t(tp)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</label>
                            <select
                              className="input h-9 py-1 text-xs"
                              value={row.category}
                              onChange={(e) => updateRow(idx, { category: e.target.value as CategoryId })}
                            >
                              {(row.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                                <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'analysis' && (
          <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles className="h-3.5 w-3.5" />
              {t('smartCategorizationDesc')}
            </div>
            <div className="flex gap-2">
              <button onClick={handleClose} className="btn-secondary">{t('cancel')}</button>
              <button
                onClick={() => setPhase('review')}
                className="btn-primary"
              >
                <Check className="h-4 w-4" />
                {t('importAnalysisViewTransactions')} ({rows.length})
              </button>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className="flex items-center justify-between border-t border-gray-100 p-4 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles className="h-3.5 w-3.5" />
              {t('smartCategorizationDesc')}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPhase('analysis')} className="btn-secondary">{t('importAnalysis')}</button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="btn-primary"
              >
                <Check className="h-4 w-4" />
                {t('importSelected')} ({selectedCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
