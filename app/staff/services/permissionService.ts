import { SupabaseClient } from '@supabase/supabase-js'
import type { StaffPermissions } from '@/lib/types/database'

export async function getStaffPermissions(supabase: SupabaseClient, userId: string): Promise<StaffPermissions | null> {
  const { data, error } = await supabase
    .from('staff_permissions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching staff permissions:', error)
    throw error
  }
  return data || null
}

export async function updateStaffPermissions(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Omit<StaffPermissions, 'id' | 'user_id' | 'created_at'>>
): Promise<StaffPermissions> {
  // First check if a record exists
  const existing = await getStaffPermissions(supabase, userId)
  
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('staff_permissions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating staff permissions:', error)
      throw error
    }
    return data
  } else {
    // Insert new record with some defaults if necessary (though the DB should have defaults)
    const newRecord = {
      user_id: userId,
      ...updates
    }
    
    const { data, error } = await supabase
      .from('staff_permissions')
      .insert(newRecord)
      .select()
      .single()

    if (error) {
      console.error('Error inserting staff permissions:', error)
      throw error
    }
    return data
  }
}
