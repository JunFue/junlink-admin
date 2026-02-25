import { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, Store, Payment } from '@/lib/types/database'

export interface TransactionWithStore extends Transaction {
  stores?: { store_name: string } | null
  payments?: Payment | null
}

export async function getTransactions(
  supabase: SupabaseClient,
  dateRange: string,
  storeId?: string,
  page: number = 0,
  limit: number = 20
): Promise<{ data: TransactionWithStore[]; nextCursor: number | null }> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      stores (store_name),
      payments (*)
    `)
    .order('transaction_time', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  if (dateRange !== 'all') {
    const now = new Date()
    const startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    query = query.gte('transaction_time', startDate.toISOString())
  }

  const { data, error } = await query
  if (error) throw error

  const hasMore = (data || []).length === limit
  const nextCursor = hasMore ? page + 1 : null

  return { data: data || [], nextCursor }
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
