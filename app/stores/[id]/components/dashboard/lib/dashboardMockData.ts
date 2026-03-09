// ─── Mock Data Constants for POS Dashboard ────────────────────────────────────
// These will eventually be replaced by real API calls / Supabase queries.

export interface DashboardStats {
  grossSales: number;
  salesDiscount: number;
  salesReturn: number;
  salesAllowance: number;
  netSales: number;
  cashInDrawer: number;
  cashout: {
    total: number;
    cogs: number;
    opex: number;
    remittance: number;
  };
  netProfit: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  qty: number;
  threshold: number;
}

export interface ExpiringItem {
  id: number;
  name: string;
  expires: string;
}

export interface InventoryStatsData {
  lowStock: LowStockItem[];
  mostStocked: { name: string; qty: number };
  expiringSoon: ExpiringItem[];
}

export interface ActivityItem {
  id: number;
  type: "SALE" | "OPEX" | "REMIT" | "COGS";
  amount: number;
  time: string;
  desc: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const CASH_LIMIT = 10000.0;
