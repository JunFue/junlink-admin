"use server";

import { createClient } from "@/lib/supabase/server";

const getSupabase = async () => {
  return await createClient();
};

export interface InventoryItem {
  item_id: string;
  item_name: string;
  sku: string;
  category: string | null;
  unit_cost: number;
  sales_price: number | null;
  image_url: string | null;
  quantity_in: number;
  quantity_manual_out: number;
  quantity_sold: number;
  current_stock: number;
  low_stock_threshold: number | null;
  description: string | null;
}

// Pagination Params
export interface InventoryParams {
  page?: number;
  limit?: number;
  storeId: string; // Made required
  filters?: Record<string, string[]>;
  sort?: { col: keyof InventoryItem; dir: "ASC" | "DESC" };
  search?: string;
}

export const fetchInventory = async (
  params: InventoryParams
): Promise<{ data: InventoryItem[]; count: number }> => {
  const { page = 1, limit = 50, filters, sort, storeId } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await getSupabase();
  let query = supabase
    .from("inventory_monitor_view")
    .select("*", { count: "exact" })
    .eq("store_id", storeId);

  // 1. Apple Filters
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const values = filters[key];
      if (values && values.length > 0) {
        // Handle "category" separately? usually exact match works
        query = query.in(key, values);
      }
    });
  }

  // 2. Apply Search
  if (params.search) {
    const term = params.search;
    query = query.or(`item_name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  // 3. Apply Sort
  if (sort) {
    query = query
      .order(sort.col, { ascending: sort.dir === "ASC" })
      .order("item_id", { ascending: true });
  } else {
    // Default alphabetical with stable secondary ID sort
    query = query
      .order("item_name", { ascending: true })
      .order("item_id", { ascending: true });
  }

  // 4. Pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Inventory Fetch Error:", error);
    throw new Error(error.message);
  }

  // 5. Map data to handle potential field name discrepancies in the view
  const mappedData = (data as any[] || []).map((item) => ({
    ...item,
    // Fallback to cost_price if sales_price is missing (old view definition habit)
    sales_price: item.sales_price ?? item.cost_price ?? 0,
    unit_cost: item.unit_cost ?? 0,
  }));

  return { data: mappedData, count: count || 0 };
};

// Pagination helper
const getRange = (page: number, limit: number) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
};

export const fetchLowStockItems = async (storeId: string, page = 1, limit = 20) => {
  const supabase = await getSupabase();
  const { from, to } = getRange(page, limit);

  const { data, error, count } = await supabase
    .from("inventory_monitor_view")
    .select("*", { count: "exact" })
    .eq("store_id", storeId)
    .lte("current_stock", 5)
    .order("item_name", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  const mappedData = (data as any[] || []).map((item) => ({
    ...item,
    sales_price: item.sales_price ?? item.cost_price ?? 0,
    unit_cost: item.unit_cost ?? 0,
  }));

  return { data: mappedData, count: count || 0 };
};

export const fetchMostStockedItems = async (storeId: string, page = 1, limit = 20) => {
  const supabase = await getSupabase();
  const { from, to } = getRange(page, limit);

  const { data, error, count } = await supabase
    .from("inventory_monitor_view")
    .select("*", { count: "exact" })
    .eq("store_id", storeId)
    .order("current_stock", { ascending: false })
    .order("item_name", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  const mappedData = (data as any[] || []).map((item) => ({
    ...item,
    sales_price: item.sales_price ?? item.cost_price ?? 0,
    unit_cost: item.unit_cost ?? 0,
  }));

  return { data: mappedData, count: count || 0 };
};

// Deprecated: kept to avoid breaking immediate imports before refactor completion
export const fetchInventoryStats = async (storeId: string, limit = 5) => {
   const [low, most] = await Promise.all([
      fetchLowStockItems(storeId, 1, limit),
      fetchMostStockedItems(storeId, 1, limit)
   ]);
   return {
      lowStockItems: low.data,
      mostStockedItems: most.data
   };
};

