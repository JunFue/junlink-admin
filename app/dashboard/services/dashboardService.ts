import { SupabaseClient } from '@supabase/supabase-js'
import type { FinancialMetrics } from '../types'

interface DashboardMetricsRow {
  gross_sales: number;
  net_profit: number;
  transaction_count: number;
  average_order_value: number;
  available_cash: number;
  total_expenses: number;
  total_remittance: number;
}

export async function getFinancialMetrics(
  supabase: SupabaseClient,
  storeId: string | null | undefined,
  startDate: string,
  endDate: string,
  datePreset?: string
): Promise<FinancialMetrics | null> {
  const normalizedStoreId = (!storeId || storeId === '' || storeId === 'null') ? null : storeId;

  console.log('[dashboardService] Fetching metrics from RPC:', { normalizedStoreId, startDate, endDate, datePreset });

  // Fetch everything from the updated RPC
  const { data: metrics, error: metricsError } = await supabase
    .rpc('get_dashboard_metrics', { 
      p_store_id: normalizedStoreId, 
      p_start_date: startDate, 
      p_end_date: endDate 
    })
    .returns<DashboardMetricsRow[]>()
    .maybeSingle();

  if (metricsError) {
    console.error('[dashboardService] Error calling get_dashboard_metrics:', metricsError);
    return null;
  }

  if (!metrics) {
    console.log('[dashboardService] No metrics returned for:', { normalizedStoreId, startDate, endDate });
    return null;
  }

  console.log('[dashboardService] RPC Success:', metrics);

  return {
    gross_sales: Number(metrics.gross_sales || 0),
    net_profit: Number(metrics.net_profit || 0),
    transaction_count: Number(metrics.transaction_count || 0),
    average_order_value: Number(metrics.average_order_value || 0),
    available_cash: Number(metrics.available_cash || 0),
    total_expenses: Number(metrics.total_expenses || 0),
    total_remittance: Number(metrics.total_remittance || 0),
    period_cash_flow: 0, 
    debug_start: startDate,
    debug_end: endDate,
  };
}
