'use server';

import { createClient } from '@/lib/supabase/server';
import type { Budget } from '@/types';

export async function getBudgets(year_month: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(id, name, is_active)')
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
    .select('*, category:categories(id, name, is_active)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
