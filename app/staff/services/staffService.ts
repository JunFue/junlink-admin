import { SupabaseClient } from '@supabase/supabase-js'
import type { Staff, Store } from '@/lib/types/database'

export interface StaffWithStore extends Staff {
  stores?: Store | null
}

export async function getStaff(supabase: SupabaseClient): Promise<StaffWithStore[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      stores!users_store_id_fkey (store_id, store_name)
    `)
    .order('first_name')
    .limit(100)

  if (error) {
    console.error('Error fetching staff:', error)
    throw error
  }
  return data || []
}

export async function getStores(supabase: SupabaseClient): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .is('deleted_at', null)
    .order('store_name')

  if (error) throw error
  return data || []
}
