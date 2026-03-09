"use server";

import { createClient } from "@/lib/supabase/server";

const getSupabase = async () => {
  return await createClient();
};

export interface CashFlowEntry {
  store_id: string;
  category: string;
  date: string;
  forwarded: number;
  cash_in: number;
  cash_out: number;
  balance: number;
}

export interface DateRange {
  start: string;
  end: string;
}

// 1. Fetch Categories for the Dropdown
export const fetchFlowCategories = async (storeId: string): Promise<string[]> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("product_category")
    .select("category")
    .eq("store_id", storeId)
    .order("category");

  if (error) {
    console.error("Error fetching categories:", error);
    return ["Overall"];
  }

  // Prepend "Overall" to the list of categories
  const categories = data?.map((d) => d.category) || [];
  return ["Overall", ...categories];
};

// 2. Fetch Ledger Data with Filters
export const fetchCashFlowLedger = async (
  storeId: string,
  category: string,
  range: DateRange
): Promise<CashFlowEntry[]> => {
  if (!category) return [];

  const supabase = await getSupabase();

  // Determine which view/table to query based on selection
  const tableName =
    category === "Overall" ? "overall_cash_flow" : "categorical_cash_flow";

  const query = supabase
    .from(tableName)
    .select("*")
    .eq("store_id", storeId)
    // If it's overall, the view already has 'Overall' as category, but we filter just to be safe/consistent
    .eq("category", category)
    .gte("date", range.start)
    .lte("date", range.end)
    .order("date", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching ledger from ${tableName}:`, error);
    throw new Error(error.message);
  }

  return data || [];
};

