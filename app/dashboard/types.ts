export interface Branch {
  id: string
  name: string
}

export type DatePreset = 'today' | '7d' | 'month' | 'custom' | 'single'

export interface PulseStats {
  grossSales: number
  grossSalesTrend: number
  netProfit: number
  netProfitTrend: number
  transactionCount: number
  transactionTrend: number
  peakHour: string
  aov: number
  aovTrend: number
}

export interface LiquidityData {
  availableCash: number
  businessBalance: number
  netProfit: number
  cogs: number
  operatingExpenses: number
  ownerDrawings: number
}

export interface PaymentMethodSlice {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export interface LowStockItem {
  id: string
  name: string
  currentStock: number
  reorderPoint: number
}

export interface BestSeller {
  id: string
  name: string
  unitsSold: number
  grossProfit: number
}

export interface MostStockedItem {
  id: string
  name: string
  stockCount: number
  stockValue: number
}

export interface ActivityEvent {
  id: string
  type: 'sale' | 'restock' | 'expense'
  description: string
  amount: number
  timestamp: string
}

export interface OverallCashFlow {
  id: number
  store_id: string
  date: string
  cash_in: number
  cash_out: number
  balance: number
  description: string | null
  created_at: string
}

export interface FinancialMetrics {
  gross_sales: number
  net_sales: number
  net_profit: number
  transaction_count: number
  average_order_value: number
  available_cash: number
  total_expenses: number
  total_remittance: number
  period_cash_flow: number
  debug_start: string
  debug_end: string
}
