'use server';

import { createClient } from '@/lib/supabase/server';
import type { FinancialOverview, BudgetSummaryRow } from '@/types';

export async function getFinancialOverview(
  year_month: string
): Promise<FinancialOverview> {
  const supabase = await createClient();

  const [{ data: txns, error: tErr }, { data: budgets, error: bErr }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('year_month', year_month),
      supabase
        .from('budgets')
        .select('allocated_budget')
        .eq('year_month', year_month),
    ]);

  if (tErr) throw new Error(tErr.message);
  if (bErr) throw new Error(bErr.message);

  const total_income = (txns ?? [])
    .filter((t) => t.type === 'Income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const total_expense = (txns ?? [])
    .filter((t) => t.type === 'Expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const total_remaining = total_income - total_expense;

  const total_allocated_budget = (budgets ?? []).reduce(
    (s, b) => s + Number(b.allocated_budget),
    0
  );

  const buffer = total_income - total_allocated_budget;

  return {
    total_income,
    total_expense,
    total_remaining,
    total_allocated_budget,
    buffer,
  };
}

export async function getBudgetSummaryRows(
  year_month: string
): Promise<BudgetSummaryRow[]> {
  const supabase = await createClient();

  const [{ data: budgets, error: bErr }, { data: txns, error: tErr }] =
    await Promise.all([
      supabase
        .from('budgets')
        .select('category_id, allocated_budget, category:categories(name, color)')
        .eq('year_month', year_month),
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('year_month', year_month)
        .eq('type', 'Expense'),
    ]);

  if (bErr) throw new Error(bErr.message);
  if (tErr) throw new Error(tErr.message);

  const spentMap: Record<string, number> = {};
  (txns ?? []).forEach((t) => {
    if (t.category_id) {
      spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + Number(t.amount);
    }
  });

  return (budgets ?? []).map((b) => {
    const spent = spentMap[b.category_id] ?? 0;
    const allocated = Number(b.allocated_budget);
    return {
      category_id: b.category_id,
      category_name: (b.category as unknown as { name: string } | null)?.name ?? '—',
      category_color: (b.category as unknown as { color: string } | null)?.color ?? '#6b7280',
      allocated_budget: allocated,
      spent,
      remaining: allocated - spent,
      used_percent: allocated > 0 ? (spent / allocated) * 100 : 0,
    };
  });
}
