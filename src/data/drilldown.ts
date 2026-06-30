'use server';

import { createClient } from '@/lib/supabase/server';
import type { Transaction } from '@/types';

export interface MonthlyTrend {
  year_month: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category_id: string | null;
  category_name: string;
  category_color: string;
  amount: number;
}

export interface WeeklyBreakdown {
  week: string; // "Week 1", "Week 2", etc.
  amount: number;
  start: string;
  end: string;
}

/** Last N months of income/expense/net totals */
export async function getMonthlyTrend(
  currentYearMonth: string,
  months = 6
): Promise<MonthlyTrend[]> {
  const supabase = await createClient();

  // Build list of year_month strings going back N months
  const [year, month] = currentYearMonth.split('-').map(Number);
  const yearMonths: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    yearMonths.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('year_month, type, amount')
    .in('year_month', yearMonths);

  if (error) throw new Error(error.message);

  const map: Record<string, { income: number; expense: number }> = {};
  yearMonths.forEach((ym) => (map[ym] = { income: 0, expense: 0 }));

  (data ?? []).forEach((t) => {
    if (!map[t.year_month]) return;
    if (t.type === 'Income') map[t.year_month].income += Number(t.amount);
    else map[t.year_month].expense += Number(t.amount);
  });

  return yearMonths.map((ym) => ({
    year_month: ym,
    income: map[ym].income,
    expense: map[ym].expense,
    net: map[ym].income - map[ym].expense,
  }));
}

/** Income or expense broken down by category for a given month */
export async function getCategoryBreakdown(
  year_month: string,
  type: 'Income' | 'Expense'
): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category:categories(id, name, color)')
    .eq('year_month', year_month)
    .eq('type', type);

  if (error) throw new Error(error.message);

  const map: Record<
    string,
    { name: string; color: string; amount: number }
  > = {};

  (data ?? []).forEach((t) => {
    const cat = t.category as unknown as
      | { id: string; name: string; color: string }
      | null;
    const id = cat?.id ?? '__none__';
    const name = cat?.name ?? 'Uncategorised';
    const color = cat?.color ?? '#6b7280';
    if (!map[id]) map[id] = { name, color, amount: 0 };
    map[id].amount += Number(t.amount);
  });

  return Object.entries(map)
    .map(([id, v]) => ({
      category_id: id === '__none__' ? null : id,
      category_name: v.name,
      category_color: v.color,
      amount: v.amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** All transactions for a specific category in a month */
export async function getCategoryTransactions(
  year_month: string,
  category_id: string
): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(id, name, is_active, color)')
    .eq('year_month', year_month)
    .eq('category_id', category_id)
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Weekly spending for a category in a given month */
export async function getCategoryWeeklyBreakdown(
  year_month: string,
  category_id: string
): Promise<WeeklyBreakdown[]> {
  const supabase = await createClient();

  const [y, m] = year_month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  // 4 weeks: 1-7, 8-14, 15-21, 22-end
  const weeks = [
    { label: 'Week 1', start: 1, end: 7 },
    { label: 'Week 2', start: 8, end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: daysInMonth },
  ];

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount')
    .eq('year_month', year_month)
    .eq('category_id', category_id)
    .eq('type', 'Expense');

  if (error) throw new Error(error.message);

  return weeks.map((w) => {
    const amount = (data ?? [])
      .filter((t) => {
        const day = new Date(t.transaction_date).getUTCDate();
        return day >= w.start && day <= w.end;
      })
      .reduce((s, t) => s + Number(t.amount), 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      week: w.label,
      amount,
      start: `${year_month}-${pad(w.start)}`,
      end: `${year_month}-${pad(w.end)}`,
    };
  });
}
