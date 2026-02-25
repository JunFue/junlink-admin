'use server'

import { createClient } from '@supabase/supabase-js'

export async function getAdminProfiles(adminIds: string[]) {
  if (!adminIds || adminIds.length === 0) return []
  
  // Use the service role key to bypass RLS and securely fetch admin profiles
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials for bypassing RLS.')
    return []
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('user_id, first_name, last_name, email')
    .in('user_id', adminIds)

  if (error) {
    console.error('Failed to fetch admin profiles:', error)
    return []
  }

  return data
}
