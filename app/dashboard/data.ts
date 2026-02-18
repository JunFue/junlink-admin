import type {
  Branch,
  PulseStats,
  LiquidityData,
  PaymentMethodSlice,
  LowStockItem,
  BestSeller,
  MostStockedItem,
  ActivityEvent,
} from './types'

// ── Branches ──────────────────────────────────────
export const BRANCHES: Branch[] = [
  { id: 'all', name: 'All Stores' },
  { id: 'branch-a', name: 'Branch A — Makati' },
  { id: 'branch-b', name: 'Branch B — BGC' },
]

// ── Pulse Stats (by branch × preset) ─────────────
const PULSE: Record<string, Record<string, PulseStats>> = {
  all: {
    today: {
      grossSales: 24_850,
      grossSalesTrend: 12.4,
      netProfit: 8_320,
      netProfitTrend: 9.1,
      transactionCount: 142,
      transactionTrend: 5.3,
      peakHour: '2 PM',
      aov: 175,
      aovTrend: 3.7,
    },
    '7d': {
      grossSales: 168_400,
      grossSalesTrend: 8.2,
      netProfit: 56_200,
      netProfitTrend: 6.5,
      transactionCount: 987,
      transactionTrend: 4.1,
      peakHour: '12 PM',
      aov: 170.6,
      aovTrend: 2.1,
    },
    month: {
      grossSales: 712_500,
      grossSalesTrend: 14.8,
      netProfit: 241_300,
      netProfitTrend: 11.2,
      transactionCount: 4_120,
      transactionTrend: 7.9,
      peakHour: '1 PM',
      aov: 172.9,
      aovTrend: 4.5,
    },
  },
  'branch-a': {
    today: {
      grossSales: 14_200,
      grossSalesTrend: 15.1,
      netProfit: 5_100,
      netProfitTrend: 11.3,
      transactionCount: 82,
      transactionTrend: 7.6,
      peakHour: '2 PM',
      aov: 173.2,
      aovTrend: 4.2,
    },
    '7d': {
      grossSales: 98_700,
      grossSalesTrend: 9.8,
      netProfit: 33_400,
      netProfitTrend: 7.2,
      transactionCount: 572,
      transactionTrend: 5.4,
      peakHour: '11 AM',
      aov: 172.6,
      aovTrend: 2.8,
    },
    month: {
      grossSales: 415_000,
      grossSalesTrend: 16.2,
      netProfit: 142_800,
      netProfitTrend: 12.8,
      transactionCount: 2_380,
      transactionTrend: 9.1,
      peakHour: '1 PM',
      aov: 174.4,
      aovTrend: 5.1,
    },
  },
  'branch-b': {
    today: {
      grossSales: 10_650,
      grossSalesTrend: 8.9,
      netProfit: 3_220,
      netProfitTrend: 6.4,
      transactionCount: 60,
      transactionTrend: 2.8,
      peakHour: '3 PM',
      aov: 177.5,
      aovTrend: 3.1,
    },
    '7d': {
      grossSales: 69_700,
      grossSalesTrend: 6.1,
      netProfit: 22_800,
      netProfitTrend: 5.3,
      transactionCount: 415,
      transactionTrend: 2.6,
      peakHour: '2 PM',
      aov: 167.9,
      aovTrend: 1.4,
    },
    month: {
      grossSales: 297_500,
      grossSalesTrend: 12.5,
      netProfit: 98_500,
      netProfitTrend: 9.2,
      transactionCount: 1_740,
      transactionTrend: 6.4,
      peakHour: '2 PM',
      aov: 171,
      aovTrend: 3.8,
    },
  },
}

// ── Liquidity ─────────────────────────────────────
const LIQUIDITY: Record<string, Record<string, LiquidityData>> = {
  all: {
    today: {
      availableCash: 142_680,
      businessBalance: 185_000,
      netProfit: 8_320,
      cogs: 9_800,
      operatingExpenses: 3_340,
      ownerDrawings: 37_500,
    },
    '7d': {
      availableCash: 138_200,
      businessBalance: 185_000,
      netProfit: 56_200,
      cogs: 64_500,
      operatingExpenses: 21_000,
      ownerDrawings: 37_500,
    },
    month: {
      availableCash: 121_300,
      businessBalance: 185_000,
      netProfit: 241_300,
      cogs: 254_000,
      operatingExpenses: 90_000,
      ownerDrawings: 37_500,
    },
  },
  'branch-a': {
    today: {
      availableCash: 82_400,
      businessBalance: 100_000,
      netProfit: 5_100,
      cogs: 5_400,
      operatingExpenses: 1_800,
      ownerDrawings: 15_500,
    },
    '7d': {
      availableCash: 79_100,
      businessBalance: 100_000,
      netProfit: 33_400,
      cogs: 37_800,
      operatingExpenses: 12_000,
      ownerDrawings: 15_500,
    },
    month: {
      availableCash: 69_200,
      businessBalance: 100_000,
      netProfit: 142_800,
      cogs: 148_000,
      operatingExpenses: 52_000,
      ownerDrawings: 15_500,
    },
  },
  'branch-b': {
    today: {
      availableCash: 60_280,
      businessBalance: 85_000,
      netProfit: 3_220,
      cogs: 4_400,
      operatingExpenses: 1_540,
      ownerDrawings: 22_000,
    },
    '7d': {
      availableCash: 57_100,
      businessBalance: 85_000,
      netProfit: 22_800,
      cogs: 26_700,
      operatingExpenses: 9_000,
      ownerDrawings: 22_000,
    },
    month: {
      availableCash: 52_100,
      businessBalance: 85_000,
      netProfit: 98_500,
      cogs: 106_000,
      operatingExpenses: 38_000,
      ownerDrawings: 22_000,
    },
  },
}

// ── Payment Method Mix ────────────────────────────
export const PAYMENT_MIX: PaymentMethodSlice[] = [
  { name: 'Cash', value: 42, color: '#22c55e' },
  { name: 'GCash', value: 28, color: '#3b82f6' },
  { name: 'Maya', value: 18, color: '#a855f7' },
  { name: 'Card', value: 12, color: '#f59e0b' },
]

// ── Low Stock Alerts ──────────────────────────────
export const LOW_STOCK_ITEMS: LowStockItem[] = [
  { id: '1', name: 'Brewed Coffee (12oz)', currentStock: 8, reorderPoint: 50 },
  { id: '2', name: 'Vanilla Syrup', currentStock: 3, reorderPoint: 20 },
  { id: '3', name: 'Milk (1L)', currentStock: 12, reorderPoint: 30 },
  { id: '4', name: 'Paper Cups (M)', currentStock: 45, reorderPoint: 200 },
  { id: '5', name: 'Brown Sugar', currentStock: 5, reorderPoint: 25 },
]

// ── Top 5 Best Sellers ────────────────────────────
export const BEST_SELLERS: BestSeller[] = [
  { id: '1', name: 'Iced Spanish Latte', unitsSold: 312, grossProfit: 18_720 },
  { id: '2', name: 'Classic Milk Tea', unitsSold: 287, grossProfit: 14_350 },
  { id: '3', name: 'Matcha Latte', unitsSold: 198, grossProfit: 13_860 },
  { id: '4', name: 'Caramel Macchiato', unitsSold: 176, grossProfit: 12_320 },
  { id: '5', name: 'Brown Sugar Boba', unitsSold: 164, grossProfit: 9_840 },
]

// ── Most Stocked Items ────────────────────────────
export const MOST_STOCKED_ITEMS: MostStockedItem[] = [
  { id: '1', name: 'Paper Cups (L)', stockCount: 2_400, stockValue: 12_000 },
  { id: '2', name: 'Plastic Lids', stockCount: 1_850, stockValue: 5_550 },
  { id: '3', name: 'Coffee Beans (1kg)', stockCount: 120, stockValue: 48_000 },
  { id: '4', name: 'Straws', stockCount: 3_200, stockValue: 3_200 },
  { id: '5', name: 'Napkins (pack)', stockCount: 450, stockValue: 4_500 },
]

// ── Recent Activity Events ───────────────────────
export const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: '1', type: 'sale', description: 'Sale #1042 completed', amount: 450, timestamp: '2026-02-11T09:32:00+08:00' },
  { id: '2', type: 'restock', description: 'Restocked: Brewed Coffee +50 units', amount: 2_500, timestamp: '2026-02-11T09:15:00+08:00' },
  { id: '3', type: 'expense', description: 'Paid: Electricity Bill', amount: 2_400, timestamp: '2026-02-11T08:45:00+08:00' },
  { id: '4', type: 'sale', description: 'Sale #1041 completed', amount: 320, timestamp: '2026-02-11T08:30:00+08:00' },
  { id: '5', type: 'sale', description: 'Sale #1040 completed', amount: 185, timestamp: '2026-02-11T08:12:00+08:00' },
  { id: '6', type: 'restock', description: 'Restocked: Vanilla Syrup +20 units', amount: 1_800, timestamp: '2026-02-11T07:50:00+08:00' },
  { id: '7', type: 'expense', description: 'Paid: Water Bill', amount: 850, timestamp: '2026-02-11T07:30:00+08:00' },
  { id: '8', type: 'sale', description: 'Sale #1039 completed', amount: 275, timestamp: '2026-02-11T07:15:00+08:00' },
]

// ── Helpers ───────────────────────────────────────
export function getPulseStats(branch: string, preset: string): PulseStats {
  const key = preset === 'custom' ? 'today' : preset
  return PULSE[branch]?.[key] ?? PULSE['all']['today']
}

export function getLiquidityData(branch: string, preset: string): LiquidityData {
  const key = preset === 'custom' ? 'today' : preset
  return LIQUIDITY[branch]?.[key] ?? LIQUIDITY['all']['today']
}
