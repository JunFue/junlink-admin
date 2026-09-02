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
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('classification').select('*').order('name', { ascending: true });
  
  if (user) {
    if (storeId) {
      query = query.or(`admin_id.eq.${user.id},store_id.eq.${storeId}`);
    } else {
      query = query.or(`admin_id.eq.${user.id},store_id.is.null`);
    }
  } else if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Deduplicate by lowercase trimmed name if any legacy records exist
  const seen = new Set<string>();
  const uniqueClassifications: Classification[] = [];
  (data || []).forEach((c) => {
    const key = (c.name || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueClassifications.push(c);
    }
  });

  return uniqueClassifications;
}

export async function getClassificationsWithUsage(
  supabase: SupabaseClient
): Promise<(Classification & { usage_count: number })[]> {
  const classifications = await getClassifications(supabase);
  
  // Fetch expense counts for these classifications
  const withCounts = await Promise.all(
    classifications.map(async (c) => {
      const { count, error } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('classification_id', c.id);
      
      return {
        ...c,
        usage_count: error ? 0 : (count || 0),
      };
    })
  );

  return withCounts;
}

export async function createClassification(
  supabase: SupabaseClient,
  name: string,
  icon: string = 'Store'
): Promise<Classification> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Category name cannot be empty');

  // Check if classification with same name (case-insensitive) already exists for this admin
  const existing = await getClassifications(supabase);
  const duplicate = existing.find(
    (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`A category named "${trimmedName}" already exists.`);
  }

  const { data, error } = await supabase
    .from('classification')
    .insert({
      name: trimmedName,
      icon,
      admin_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClassification(
  supabase: SupabaseClient,
  id: string,
  name: string,
  icon?: string
): Promise<Classification> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Category name cannot be empty');

  // Check if another classification has the same name
  const existing = await getClassifications(supabase);
  const duplicate = existing.find(
    (c) => c.id !== id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Another category named "${trimmedName}" already exists.`);
  }

  const updatePayload: any = { name: trimmedName };
  if (icon) updatePayload.icon = icon;

  const { data, error } = await supabase
    .from('classification')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClassification(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  // Safe cleanup: Nullify any leftover expenses referencing this classification
  const { error: cleanupError } = await supabase
    .from('expenses')
    .update({ classification_id: null })
    .eq('classification_id', id);

  if (cleanupError) {
    console.warn('Could not nullify expense references before delete:', cleanupError);
  }

  const { error } = await supabase
    .from('classification')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function checkClassificationUsage(
  supabase: SupabaseClient,
  id: string
): Promise<number> {
  const { count, error } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('classification_id', id);

  if (error) throw error;
  return count || 0;
}

export async function transferClassification(
  supabase: SupabaseClient,
  fromId: string,
  toId: string
): Promise<void> {
  // 1. Point all expenses to target category
  const { error: updateError } = await supabase
    .from('expenses')
    .update({ classification_id: toId })
    .eq('classification_id', fromId);

  if (updateError) throw updateError;

  // 2. Delete source category
  const { error: deleteError } = await supabase
    .from('classification')
    .delete()
    .eq('id', fromId);

  if (deleteError) throw deleteError;
}

export async function mergeClassifications(
  supabase: SupabaseClient,
  sourceId: string,
  targetId: string
): Promise<void> {
  if (sourceId === targetId) {
    throw new Error('Source and target categories cannot be the same.');
  }

  return transferClassification(supabase, sourceId, targetId);
}

export async function getRemittanceCategories(
  supabase: SupabaseClient
): Promise<RemittanceCategory[]> {
  const { data, error } = await supabase.from('remittance_categories').select('*').order('name');
  if (error) {
    console.error("Error fetching remittance_categories (was the SQL run?):", error);
    return [];
  }
  return data;
}
