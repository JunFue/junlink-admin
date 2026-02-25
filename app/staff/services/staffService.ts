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
    .eq('role', 'member')
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

export async function removeStaffMember(supabase: SupabaseClient, targetStaffId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_staff_member', {
    target_staff_id: targetStaffId
  })

  if (error) {
    console.error('Error removing staff member:', error)
    throw error
  }
}
