'use server';

import { createClient } from '@/lib/supabase/server';
import type { Category, CategoryType } from '@/types';

export async function getCategories(activeOnly = false): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from('categories').select('*').order('name');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategory(name: string, color: string, type: CategoryType = 'Expense'): Promise<Category> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), user_id: user.id, color, type })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'is_active' | 'color' | 'type'>>
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getCategoriesByUsage(activeOnly = false): Promise<Category[]> {
  const supabase = await createClient();

  let query = supabase.from('categories').select('*');
  if (activeOnly) query = query.eq('is_active', true);
  const { data: categories, error } = await query;
  if (error) throw new Error(error.message);

  const { data: txns, error: tErr } = await supabase
    .from('transactions')
    .select('category_id');
  if (tErr) throw new Error(tErr.message);

  const countMap: Record<string, number> = {};
  (txns ?? []).forEach((t) => {
    if (t.category_id) countMap[t.category_id] = (countMap[t.category_id] ?? 0) + 1;
  });

  // Frequency desc; ties fall back to name so the order is still deterministic
  return (categories ?? []).slice().sort((a, b) => {
    const diff = (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}