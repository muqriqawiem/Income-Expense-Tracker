'use server';

import { createClient } from '@/lib/supabase/server';

export async function getMaskMoneyPreference(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('mask_money')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.mask_money ?? false;
}

export async function setMaskMoneyPreference(value: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: user.id, mask_money: value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(error.message);
}
