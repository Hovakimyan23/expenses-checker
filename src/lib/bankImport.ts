import type { Transaction, CategoryId, TransactionType, PaymentMethod } from '@/types';
import * as XLSX from 'xlsx';

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategory: CategoryId;
  confidence: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  skipped: number;
  fileName: string;
}

export function isExcelFile(fileName: string): boolean {
  return /\.(xlsx|xls)$/i.test(fileName);
}

export function excelToCsvText(buffer: ArrayBuffer): string {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return '';
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' });
  return csv;
}

const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  food: ['restaurant', 'cafe', 'coffee', 'grocery', 'supermarket', 'food', 'bakery', 'pizza', 'burger', 'bar', 'pub', 'dining', 'snack', 'doordash', 'uber eats', 'grubhub', 'market', 'deli'],
  utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'mobile', 'utility', 'utilities', 'cable', 'heating', 'telecom', 'verizon', 'at&t', 'comcast', 'orange', 'vivacell', 'ucom'],
  entertainment: ['netflix', 'spotify', 'cinema', 'movie', 'theater', 'game', 'steam', 'playstation', 'xbox', 'concert', 'subscription', 'disney', 'hulu', 'youtube premium', 'twitch'],
  transport: ['fuel', 'gas station', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking', 'car', 'transport', 'yandex', 'bolt', 'oil change', 'auto', 'subway', 'flight', 'airline', 'airport'],
  salary: ['salary', 'wage', 'payroll', 'paycheck', 'payment received', 'deposit from employer', 'direct deposit'],
  investments: ['dividend', 'interest', 'investment', 'stock', 'bond', 'crypto', 'etf', 'mutual fund', 'brokerage', 'capital gain'],
  shopping: ['amazon', 'store', 'shop', 'purchase', 'retail', 'mall', 'ebay', 'aliexpress', 'clothing', 'shoes', 'electronics', 'ikea', 'walmart', 'target'],
  healthcare: ['pharmacy', 'doctor', 'hospital', 'medical', 'dental', 'dentist', 'clinic', 'health', 'drug', 'medication', 'prescription', 'insurance', 'lab'],
  other: ['transfer', 'fee', 'charge', 'atm', 'withdrawal', 'deposit', 'payment', 'refund', 'penalty', 'fine', 'comm'],
};

function matchCategory(description: string): { category: CategoryId; confidence: number } {
  const lower = description.toLowerCase();
  let best: CategoryId = 'other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const score = kw.length / lower.length + 0.5;
        if (score > bestScore) {
          bestScore = score;
          best = cat as CategoryId;
        }
      }
    }
  }

  return { category: best, confidence: bestScore > 0.6 ? 0.9 : bestScore > 0 ? 0.6 : 0.3 };
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    return `${m[3]}-${mo}-${d}`;
  }

  m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const mo = m[1].padStart(2, '0');
    const d = m[2].padStart(2, '0');
    return `${m[3]}-${mo}-${d}`;
  }

  m = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    const mo = m[2].padStart(2, '0');
    const d = m[3].padStart(2, '0');
    return `${m[1]}-${mo}-${d}`;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.abs(num);
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function detectColumns(headers: string[]): { date: number; desc: number; amount: number } | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  let date = -1, desc = -1, amount = -1;

  for (let i = 0; i < lower.length; i++) {
    if (date === -1 && /date|дата|ամսաթիվ/.test(lower[i])) date = i;
    if (desc === -1 && /desc|detail|memo|narrat|title|name|payee|merk|descript|описан|նկարագիր|վճարող/.test(lower[i])) desc = i;
    if (amount === -1 && /amount|sum|value|debit|credit|сумма|գումար/.test(lower[i])) amount = i;
  }

  if (date === -1 || amount === -1) return null;
  if (desc === -1) desc = date + 1;

  return { date, desc, amount };
}

export function parseBankStatement(text: string, fileName: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], skipped: 0, fileName };

  const headers = splitCSVLine(lines[0]);
  const cols = detectColumns(headers);

  let rows: ParsedRow[] = [];
  let skipped = 0;

  if (cols) {
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCSVLine(lines[i]);
      const dateStr = cells[cols.date];
      const desc = cells[cols.desc] ?? '';
      const amountStr = cells[cols.amount];

      const date = parseDate(dateStr);
      const amount = parseAmount(amountStr);

      if (!date || amount === null || amount === 0) {
        skipped++;
        continue;
      }

      const isIncome = !amountStr.includes('-') && /deposit|credit|salary|refund|received/i.test(desc);
      const type: TransactionType = isIncome ? 'income' : 'expense';
      const { category, confidence } = matchCategory(desc);

      rows.push({ date, description: desc, amount, type, suggestedCategory: category, confidence });
    }
  } else {
    for (const line of lines.slice(1)) {
      const cells = splitCSVLine(line);
      if (cells.length < 3) { skipped++; continue; }
      const date = parseDate(cells[0]);
      const amount = parseAmount(cells[cells.length - 1]);
      const desc = cells.slice(1, -1).join(' ');
      if (!date || amount === null || amount === 0) { skipped++; continue; }
      const { category, confidence } = matchCategory(desc);
      rows.push({ date, description: desc, amount, type: 'expense', suggestedCategory: category, confidence });
    }
  }

  const seen = new Set<string>();
  rows = rows.filter((r) => {
    const key = `${r.date}|${r.amount}|${r.description}`;
    if (seen.has(key)) { skipped++; return false; }
    seen.add(key);
    return true;
  });

  return { rows, skipped, fileName };
}

export function rowToTransaction(
  row: ParsedRow,
  overrides?: Partial<Pick<Transaction, 'type' | 'category'>>,
): Transaction {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: row.description.slice(0, 80) || 'Bank import',
    amount: Math.round(row.amount * 100) / 100,
    type: overrides?.type ?? row.type,
    category: overrides?.category ?? row.suggestedCategory,
    date: row.date,
    paymentMethod: 'bank' as PaymentMethod,
    note: 'Bank statement import',
  };
}
