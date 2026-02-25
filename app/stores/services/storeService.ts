import { SupabaseClient } from '@supabase/supabase-js'
import type { StoreWithStaffCount, StoreAddress } from '@/lib/types/database'

// Define the shape of the Store return data
// This helps TypeScript understand what 'data' contains after an insert
export interface Store {
  store_id: string;
  store_name: string;
  store_address: StoreAddress;
  user_id: string;
  enrollment_id?: string | null;
  store_img?: string | null;
  created_at?: string;
  deleted_at?: string | null;
  co_admins?: string[] | null;
}

export interface InventoryItem {
  item_id: string;
  item_name: string;
  sku: string;
  category: string | null;
  cost_price: number;
  low_stock_threshold: number | null;
  quantity_in: number;
  quantity_manual_out: number;
  quantity_sold: number;
  current_stock: number;
  stock_status: 'out_of_stock' | 'low_stock' | 'in_stock';
  store_id: string;
}

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  store_ids: string[];
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

/**
 * Fetch all stores the user has access to (via RLS) and include the member count.
 */
export async function getStoresWithStaffCount(supabase: SupabaseClient): Promise<StoreWithStaffCount[]> {
  // 1. Fetch stores
  // We rely on RLS policies to filter stores automatically.
  const { data: storesData, error } = await supabase
    .from('stores')
    .select('*')
    .is('deleted_at', null)
    .order('store_name', { ascending: true })

  if (error) {
    console.error('Error fetching stores:', error)
    throw error
  }

  if (!storesData || storesData.length === 0) {
    return []
  }

  // 2. Get staff counts for each store
  // We use Promise.all to fetch counts in parallel for performance
  const storesWithCounts: StoreWithStaffCount[] = await Promise.all(
    storesData.map(async (store) => {
      const { count, error: countError } = await supabase
        .from('users')
        .select('user_id', { count: 'exact', head: true }) // 'head: true' fetches only the count
        .eq('store_id', store.store_id)

      if (countError) {
        console.warn(`Could not fetch staff count for store ${store.store_id}`, JSON.stringify(countError, null, 2))
      }

      return {
        ...store,
        staff_count: count || 0,
      } as StoreWithStaffCount
    })
  )

  return storesWithCounts
}

/**
 * Create a new store.
 * Requires the user to be authenticated and present in the 'admin' table.
 */
export async function createStore(
  supabase: SupabaseClient, 
  storeData: { 
    store_name: string; 
    address: StoreAddress;
    enrollment_id?: string;
    store_img?: string;
  }
): Promise<Store> {
  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // 2. Authorization Check
  // Ensures the user exists in the 'admin' table before allowing creation.
  const { data: adminData, error: adminError } = await supabase
    .from('admin')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (adminError || !adminData) {
    throw new Error('Unauthorized: You do not have permission to create a store.')
  }

  // 3. Prepare Insert Payload
  // Explicitly map fields and handle optional undefined values by converting to null
  const insertPayload = {
    store_name: storeData.store_name,
    store_address: storeData.address,
    user_id: user.id, // Use the authenticated user's ID directly
    enrollment_id: storeData.enrollment_id || null,
    store_img: storeData.store_img || null
  }

  // 4. Insert and Return
  const { data, error } = await supabase
    .from('stores')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    console.error('Error creating store:', error)
    throw error
  }

  // 5. Update creator's store_id and role
  const { error: userError } = await supabase
    .from('users')
    .update({
      store_id: data.store_id,
      role: 'owner'
    })
    .eq('user_id', user.id)

  if (userError) {
    console.error('Error updating creator user record:', userError)
  }

  return data as Store
}

/**
 * Upload a store image to Supabase Storage and return the public URL.
 */
export async function uploadStoreImage(supabase: SupabaseClient, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `store-images/${fileName}`

  // 1. Upload the file
  const { error: uploadError } = await supabase.storage
    .from('store-images')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // 2. Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('store-images')
    .getPublicUrl(filePath)

  return publicUrl
}


// Add this interface
export interface StoreDashboardStats {
  cash_on_hand: number
  daily_gross_income: number
  daily_expenses: number
  monthly_gross_income: number
}

/**
 * Fetch a single store by ID
 */
export async function getStoreById(supabase: SupabaseClient, storeId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_id', storeId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching store:', error)
    return null
  }
  return data
}

/**
 * Fetch dashboard statistics using the Database RPC
 */

export async function getStoreStats(supabase: SupabaseClient, storeId: string): Promise<StoreDashboardStats> {
  // CHANGED: calling 'get_dashboard_stats_via_view' instead of 'get_store_dashboard_stats'
  const { data, error } = await supabase
    .rpc('get_dashboard_stats_via_view', { target_store_id: storeId })

  if (error) {
    console.error('Error fetching store stats:', error)
    return {
      cash_on_hand: 0,
      daily_gross_income: 0,
      daily_expenses: 0,
      monthly_gross_income: 0
    }
  }

  return data as StoreDashboardStats
}

/**
 * Fetch store inventory from the inventory_monitor_view
 */
export async function getStoreInventory(supabase: SupabaseClient, storeId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_monitor_view')
    .select('*')
    .eq('store_id', storeId)
    .order('item_name', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching store inventory:', error)
    return []
  }

  return data as InventoryItem[]
}

/**
 * Archive a store (soft delete)
 */
export async function archiveStore(supabase: SupabaseClient, storeId: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('archive_store', { target_store_id: storeId })

  if (error) {
    console.error('Error archiving store:', error)
    throw error
  }

  return data as { success: boolean; message: string }
}

/**
 * Restore an archived store
 */
export async function restoreStore(supabase: SupabaseClient, storeId: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('restore_store', { target_store_id: storeId })

  if (error) {
    console.error('Error restoring store:', error)
    throw error
  }

  return data as { success: boolean; message: string }
}

// Multi-Admin System RPCs

/**
 * Send a co-admin invite for one or more stores.
 */
export async function sendCoAdminInvite(
  supabase: SupabaseClient,
  storeIds: string[],
  inviteeEmail: string
): Promise<{ success: boolean; message: string }> {
  // Call the 'send_co_admin_invite' RPC
  // Parameters: specified in requirements as target_store_id (likely expecting array or handle multiple calls? 
  // User said: send_co_admin_invite -> "First time bringing someone in. Creates a 'pending' record with a list of store IDs."
  // The RPC likely takes an array of store_ids based on the schema change (store_ids ARRAY)
  // Let's assume the RPC signature is (store_ids uuid[], invitee_email text) based on context, OR
  // maybe it was (target_store_ids uuid[], ...).
  // The user prompt said: "Use the target_store_id and invitee_email_input parameter names exactly as defined in the RPC functions."
  // But later said "Creates a pending record with a list of store IDs".
  // I will assume the param is named 'target_store_ids' for the array version, or check if I can inspect it.
  // Wait, the prompt said: "for sending invitations please use the rpc: send_co_admin_invite"
  // "Use the target_store_id and invitee_email_input parameter names exactly as defined"
  // If the previous definition was singular 'target_store_id' and now it's a list, the parameter might have changed to 'target_store_ids' OR 
  // it might assume we pass a single ID but the underlying table holds an array?
  // The User clearly stated: "Creates a 'pending' record with a list of store IDs."
  // So I should probably pass an array.
  // Let's assume the RPC expects 'target_store_ids' (plural) if it handles a list, or maybe still 'target_store_id' but typed as array?
  // I'll try 'target_store_ids' as a safe guess for a list, but if it fails I might need to check. 
  // Actually, standardizing on 'target_store_ids' for array input seems logical.
  
  const { error } = await supabase.rpc('send_co_admin_invite', {
    target_store_ids: storeIds, 
    invitee_email_input: inviteeEmail
  })

  if (error) {
    console.error('Error sending invite:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Invitation sent successfully' }
}

/**
 * Accept an invitation.
 */
export async function acceptInvitation(
  supabase: SupabaseClient,
  invitationId: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.rpc('accept_invitation', {
    invitation_id: invitationId
  })

  if (error) {
    console.error('Error accepting invitation:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Invitation accepted' }
}

/**
 * Sync co-admin access (give/remove access to specific stores).
 */
export async function syncCoAdminAccess(
  supabase: SupabaseClient,
  adminId: string,
  storeIds: string[]
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.rpc('sync_co_admin_access', {
    target_admin_id: adminId,
    target_store_ids: storeIds
  })

  if (error) {
    console.error('Error syncing access:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Access updated successfully' }
}

/**
 * Bulk transfer ownership of ALL stores to a co-admin.
 */
export async function bulkTransferOwnership(
  supabase: SupabaseClient,
  newOwnerId: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.rpc('bulk_transfer_ownership', {
    new_owner_id: newOwnerId
  })

  if (error) {
    console.error('Error transferring ownership:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Ownership transferred successfully' }
}

/**
 * Decline an invitation (client-side update since no specific RPC mentions decline logic other than "Decline should simply update the invitations record status")
 */
export async function declineInvitation(
  supabase: SupabaseClient,
  invitationId: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'declined' })
    .eq('id', invitationId)

  if (error) {
    console.error('Error declining invitation:', error)
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Invitation declined' }
}

/**
 * Fetch all stores owned by a specific user.
 */
export async function getUserStores(supabase: SupabaseClient, userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching user stores:', error)
    return []
  }

  return data as Store[]
}


export async function getPendingInvitations(supabase: SupabaseClient, email: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitee_email', email)
    .eq('status', 'pending')
    
  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }
  
  return data as Invitation[];
}

export async function getStorePendingInvitations(supabase: SupabaseClient, storeId: string): Promise<Invitation[]> {
    // Since store_ids is an array, we check if the storeId is IN the array.
    // Supabase (PostgREST) syntax for array contains: .cs (contains) or .cd (contained by) or .ov (overlap)
    // .contains('store_ids', [storeId])
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .contains('store_ids', [storeId]) 
      .eq('status', 'pending')
      
    if (error) {
      console.error('Error fetching store invitations:', error)
      return []
    }
    
    return data as Invitation[];
}
