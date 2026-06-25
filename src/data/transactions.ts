'use server';

import { createClient } from '@/lib/supabase/server';
import type { Transaction, TransactionType } from '@/types';

export async function getTransactions(filters?: {
  year_month?: string;
  type?: TransactionType;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from('transactions')
    .select('*, category:categories(id, name, is_active, color)')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.year_month) query = query.eq('year_month', filters.year_month);
  if (filters?.type) query = query.eq('type', filters.type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTransaction(payload: {
  transaction_date: string;
  type: TransactionType;
  category_id: string;
  amount: number;
  description?: string;
}): Promise<Transaction> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...payload, user_id: user.id })
    .select('*, category:categories(id, name, is_active)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTransaction(
  id: string,
  payload: Partial<{
    transaction_date: string;
    type: TransactionType;
    category_id: string;
    amount: number;
    description: string;
  }>
): Promise<Transaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select('*, category:categories(id, name, is_active)')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
