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
