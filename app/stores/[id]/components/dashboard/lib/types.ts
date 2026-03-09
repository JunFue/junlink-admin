export interface FinancialReportItem {
  category: string;
  cash_forwarded: number;
  gross_income: number;
  expenses: number;
  cash_on_hand: number;
}

export interface CashFlowEntry {
  store_id: string;
  category: string;
  date: string;
  forwarded: number;
  cash_in: number;
  cash_out: number;
  balance: number;
}
