import { SupabaseClient } from '@supabase/supabase-js'
import type { Expense, Classification, RemittanceCategory } from '@/lib/types/database'

export interface CashoutWithDetails extends Expense {
  users?: { first_name: string | null; last_name: string | null } | null
  stores?: { store_name: string } | null
  classification?: { name: string } | null
  remittance_categories?: { name: string } | null
}

export interface CashoutBreakdownItem {
  cashout_type: 'COGS' | 'OPEX' | 'REMITTANCE';
  subcategory: string;
  total_amount: number;
}

export async function getCashouts(
  supabase: SupabaseClient,
  dateRange: string,
  storeId?: string,
  page: number = 0,
  limit: number = 20,
  subcategoryName?: string // Optional filter for Global view
): Promise<{ data: CashoutWithDetails[]; nextCursor: number | null }> {
  
  const { data, error } = await supabase.rpc('get_cashouts', {
    p_date_range: dateRange,
    p_store_id: storeId || null,
    p_page: page,
    p_limit: limit,
    p_subcategory: subcategoryName || null
  });

  if (error) {
    console.error("RPC get_cashouts error:", error);
    throw error;
  }

  const resultData = (data as unknown as CashoutWithDetails[]) || [];

  const hasMore = resultData.length === limit;
  const nextCursor = hasMore ? page + 1 : null;

  return { data: resultData, nextCursor };
}

export async function getCashoutsBreakdown(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  storeId?: string
): Promise<CashoutBreakdownItem[]> {
  const { data, error } = await supabase.rpc('get_cashouts_breakdown', {
    p_start_date: startDate,
    p_end_date: endDate,
    p_store_id: storeId || null
  });

  if (error) {
    console.error("RPC get_cashouts_breakdown error:", error);
    throw error;
  }

  return (data as CashoutBreakdownItem[]) || [];
}

export async function addCashout(
  supabase: SupabaseClient,
  data: Partial<Expense>
): Promise<Expense> {
  const { data: result, error } = await supabase
    .from('expenses')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function updateCashout(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Expense>
): Promise<Expense> {
  const { data: result, error } = await supabase
    .from('expenses')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function deleteCashout(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getClassifications(
  supabase: SupabaseClient,
  storeId?: string
): Promise<Classification[]> {
  let query = supabase.from('classification').select('*').order('name')
  
  if (storeId) {
    query = query.eq('store_id', storeId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getRemittanceCategories(
  supabase: SupabaseClient
): Promise<RemittanceCategory[]> {
  const { data, error } = await supabase.from('remittance_categories').select('*').order('name')
  if (error) {
    console.error("Error fetching remittance_categories (was the SQL run?):", error)
    return []
  }
  return data
}
