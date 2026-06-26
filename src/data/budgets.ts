'use server';

import { createClient } from '@/lib/supabase/server';
import type { Budget } from '@/types';

export async function getBudgets(year_month: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, is_active, color)')
    .eq('year_month', year_month)
    .order('created_at');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertBudget(payload: {
  category_id: string;
  year_month: string;
  allocated_budget: number;
}): Promise<Budget> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { ...payload, user_id: user.id },
      { onConflict: 'user_id,category_id,year_month' }
    )
    .select('*, category:categories(id, name, is_active, color)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function copyBudgetsFromMonth(
  fromMonth: string,
  toMonth: string
): Promise<Budget[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: sourceBudgets, error: fetchError } = await supabase
    .from('budgets')
    .select('category_id, allocated_budget')
    .eq('year_month', fromMonth)
    .eq('user_id', user.id);

  if (fetchError) throw new Error(fetchError.message);
  if (!sourceBudgets || sourceBudgets.length === 0) return [];

  const rows = sourceBudgets.map((b) => ({
    user_id: user.id,
    category_id: b.category_id,
    year_month: toMonth,
    allocated_budget: b.allocated_budget,
  }));

  const { data, error } = await supabase
    .from('budgets')
    .upsert(rows, { onConflict: 'user_id,category_id,year_month' })
    .select('*, category:categories(id, name, is_active, color)');

  if (error) throw new Error(error.message);
  return data ?? [];
}
