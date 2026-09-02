"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import dayjs from "dayjs";
import { CashFlowEntry, FinancialReportItem } from "./types";

const getSupabase = async () => {
  return createAdminClient();
};


export const fetchDailyCashFlow = async (
  storeId: string,
  date: string = dayjs().format("YYYY-MM-DD"),
  signal?: AbortSignal 
): Promise<CashFlowEntry[]> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("categorical_cash_flow")
    .select("*")
    .eq("date", date)
    .eq("store_id", storeId)
    .abortSignal(signal as AbortSignal);

  if (error) {
    console.error("Error fetching daily cash flow:", error);
    throw new Error(error.message);
  }

  return data || [];
};

// OPTIMIZED: Uses Database RPC to return a single number
export const fetchCashFlowByRange = async (
  storeId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .rpc('get_range_gross', { 
      start_date: startDate, 
      end_date: endDate,
      p_store_id: storeId
    });

  if (error) {
    console.error("Error fetching cash flow range:", error);
    throw new Error(error.message);
  }

  return data || 0;
};



export const fetchFinancialReport = async (
  storeId: string,
  startDate: string,
  endDate: string
): Promise<FinancialReportItem[]> => {
  const supabase = await getSupabase();
  
  // Reads from daily_store_stats (pre-computed, kept in sync by DB trigger)
  const { data, error } = await supabase
    .from("daily_store_stats")
    .select("total_gross_sales, total_cashout, cash_remaining")
    .eq("store_id", storeId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching financial report:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) return [];

  const totals = data.reduce(
    (acc, curr) => ({
      gross: acc.gross + (Number(curr.total_gross_sales) || 0),
      expenses: acc.expenses + (Number(curr.total_cashout) || 0),
    }),
    { gross: 0, expenses: 0 }
  );

  // cash_forwarded = balance before the startDate
  const { data: previousData } = await supabase
    .from("overall_cash_flow")
    .select("balance")
    .eq("store_id", storeId)
    .lt("date", startDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cashForwarded = previousData?.balance || 0;

  // Get the latest balance within the range for cash_on_hand
  const { data: latestData } = await supabase
    .from("overall_cash_flow")
    .select("balance")
    .eq("store_id", storeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cashOnHand = latestData?.balance || cashForwarded;

  return [
    {
      category: "Overall Store Performance",
      cash_forwarded: Number(cashForwarded),
      gross_income: totals.gross,
      expenses: totals.expenses,
      cash_on_hand: Number(cashOnHand),
    },
  ];
};

export const fetchDashboardStats = async (
  storeId: string,
  date: string
): Promise<any> => {
  const supabase = await getSupabase();
  
  // 1. Fetch pre-calculated stats from daily_store_stats (kept in sync by DB trigger)
  const { data: statsData, error: statsError } = await supabase
    .from("daily_store_stats")
    .select("*")
    .eq("date", date)
    .eq("store_id", storeId)
    .maybeSingle();

  if (statsError) {
    console.error("Error fetching dashboard stats:", statsError);
    throw new Error(statsError.message);
  }

  // 2. Fetch live cash in drawer balance from overall_cash_flow
  const { data: cashData, error: cashError } = await supabase
    .from("overall_cash_flow")
    .select("balance")
    .eq("store_id", storeId)
    .lte("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cashError) {
    console.error("Error fetching live cash in drawer:", cashError);
  }

  if (!statsData && !cashData) {
    return null;
  }

  const cashInDrawer = cashData ? Number(cashData.balance) : (statsData ? Number(statsData.cash_remaining) : 0);

  return {
    grossSales: Number(statsData?.total_gross_sales || 0),
    salesDiscount: 0, 
    salesReturn: 0,
    salesAllowance: 0,
    netSales: Number(statsData?.total_net_sales || 0),
    cashInDrawer: cashInDrawer,
    cashout: {
      total: Number(statsData?.total_cashout || 0),
      cogs: Number(statsData?.total_cogs || 0),
      opex: Number(statsData?.total_opex || 0),
      remittance: Number(statsData?.total_remittance || 0),
    },
    netProfit: Number(statsData?.net_profit || 0),
  };
};

export const fetchQuantitySoldByCategory = async (
  storeId: string,
  date: string = dayjs().format("YYYY-MM-DD")
): Promise<{ category: string; quantity: number }[]> => {
  const supabase = await getSupabase();
  
  // We need to join transactions with product_category to get the category name
  // and sum the quantity for the given date.
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      quantity,
      product_category!inner (
        category
      )
    `)
    .eq("store_id", storeId)
    .gte("transaction_time", `${date} 00:00:00`)
    .lte("transaction_time", `${date} 23:59:59`);

  if (error) {
    console.error("Error fetching quantity sold by category:", error);
    throw new Error(error.message);
  }

  // Process the data to group by category and sum quantity
  const groupedData: Record<string, number> = {};

  data.forEach((item: any) => {
    const categoryName = item.product_category?.category || "Uncategorized";
    const qty = Number(item.quantity) || 0;
    if (groupedData[categoryName]) {
      groupedData[categoryName] += qty;
    } else {
      groupedData[categoryName] = qty;
    }
  });

  return Object.entries(groupedData).map(([category, quantity]) => ({
    category,
    quantity,
  }));
};

export type DrawerMode = "unified" | "multiple";

export const fetchDrawerMode = async (storeId: string): Promise<DrawerMode> => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("stores")
    .select("drawer_mode")
    .eq("store_id", storeId)
    .single();

  if (error) {
    console.error("Error fetching drawer mode:", error);
    return "unified";
  }

  return (data?.drawer_mode as DrawerMode) || "unified";
};

export const fetchLatestCategorySales = async (
  storeId: string,
  date: string = dayjs().format("YYYY-MM-DD")
): Promise<{ category: string; cash_in: number; balance: number }[]> => {
  const supabase = await getSupabase();

  // Get the latest row per category up to the given date
  const { data, error } = await supabase
    .from("categorical_cash_flow")
    .select("category, cash_in, balance, date")
    .eq("store_id", storeId)
    .lte("date", date)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching category sales:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Deduplicate by category — keep the latest (first) row per category
  const seen = new Set<string>();
  const result: { category: string; cash_in: number; balance: number }[] = [];
  for (const row of data) {
    if (!seen.has(row.category)) {
      seen.add(row.category);
      
      // If the latest row is from a previous date, today's cash_in shouldn't include that old 
      // row's cash_in. Instead, the balance is forwarded, but cash_in for "today" is 0.
      const isToday = row.date === date;

      result.push({ 
        category: row.category, 
        cash_in: isToday ? (Number(row.cash_in) || 0) : 0,
        balance: Number(row.balance) || 0 
      });
    }
  }

  return result;
};

export interface InventoryMonitorItem {
  item_id: string;
  store_id: string;
  item_name: string;
  sku: string | null;
  category: string | null;
  sales_price: number;
  unit_cost: number | null;
  image_url: string | null;
  description: string | null;
  low_stock_threshold: number;
  quantity_in: number;
  quantity_manual_out: number;
  quantity_sold: number;
  current_stock: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
}

export const fetchLowStockAlerts = async (
  storeId: string,
  pageParam: number = 0,
  pageSize: number = 20
): Promise<InventoryMonitorItem[]> => {
  const supabase = await getSupabase();

  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("inventory_monitor_view")
    .select("*")
    .eq("store_id", storeId)
    .in("stock_status", ["low_stock", "out_of_stock"])
    .order("current_stock", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error fetching low stock alerts:", error);
    throw new Error(error.message);
  }

  return data as InventoryMonitorItem[];
};

export const fetchTopInventory = async (
  storeId: string,
  pageParam: number = 0,
  pageSize: number = 20
): Promise<InventoryMonitorItem[]> => {
  const supabase = await getSupabase();

  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("inventory_monitor_view")
    .select("*")
    .eq("store_id", storeId)
    .order("current_stock", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching top inventory:", error);
    throw new Error(error.message);
  }

  return data as InventoryMonitorItem[];
};

export interface ExpiringSoonItem {
  id: string;
  item_name: string;
  expiry_date: string;
  batch_remaining: number;
}

export const fetchExpiringSoon = async (storeId: string): Promise<ExpiringSoonItem[]> => {
  const supabase = await getSupabase();

  const today = dayjs().format("YYYY-MM-DD");
  const thirtyDaysFromNow = dayjs().add(30, "day").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from("stock_flow")
    .select("id, item_name, expiry_date, batch_remaining")
    .eq("store_id", storeId)
    .eq("flow", "stock-in")
    .gt("batch_remaining", 0)
    .not("expiry_date", "is", null)
    .gte("expiry_date", today)
    .lte("expiry_date", thirtyDaysFromNow)
    .order("expiry_date", { ascending: true });

  if (error) {
    console.error("Error fetching expiring soon items:", error);
    throw new Error(error.message);
  }

  return data as ExpiringSoonItem[];
};

export interface PerformanceItem {
  item_id?: string;
  item_name: string;
  total_sold: number;
  revenue: number;
}

export const fetchBestSellers = async (
  storeId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<PerformanceItem[]> => {
  const supabase = await getSupabase();

  const { data, error } = await supabase.rpc("get_terminal_best_sellers", {
    p_store_id: storeId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching best sellers:", error);
    throw new Error(error.message);
  }

  return data as PerformanceItem[];
};

export const fetchWorstSellers = async (
  storeId: string,
  startDate: string,
  endDate: string,
  limit: number = 10,
  offset: number = 0
): Promise<PerformanceItem[]> => {
  const supabase = await getSupabase();

  const { data, error } = await supabase.rpc("get_terminal_worst_sellers", {
    p_store_id: storeId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching worst sellers:", error);
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    total_sold: Number(item.total_sold),
    revenue: Number(item.revenue),
  }));
};

