import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import { format, subMonths } from 'date-fns'

export interface RawDailyStat {
  date: string
  grossSales: number
  netProfit: number
}

async function fetchDailyStats(storeId: string | null): Promise<RawDailyStat[]> {
  const supabase = createClient()

  // Fetch up to 2 years of daily data
  const startDate = format(subMonths(new Date(), 24), 'yyyy-MM-dd')

  let query = supabase
    .from('daily_store_stats')
    .select('date, total_gross_sales, net_profit')
    .gte('date', startDate)
    .order('date', { ascending: true })

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[useGrossTrendData] Error:', error)
    return []
  }

  // Aggregate by date (handles "all stores" by summing across stores)
  const dateMap = new Map<string, { grossSales: number; netProfit: number }>()

  for (const row of (data || []) as any[]) {
    const date = row.date as string
    const gs = Number(row.total_gross_sales || 0)
    const np = Number(row.net_profit || 0)
    const existing = dateMap.get(date)

    if (existing) {
      existing.grossSales += gs
      existing.netProfit += np
    } else {
      dateMap.set(date, { grossSales: gs, netProfit: np })
    }
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      grossSales: vals.grossSales,
      netProfit: vals.netProfit,
    }))
}

export function useGrossTrendData() {
  const { selectedBranch } = useDashboardStore()
  const storeId = selectedBranch === 'all' ? null : selectedBranch

  return useQuery({
    queryKey: ['gross-trend-daily', storeId],
    queryFn: () => fetchDailyStats(storeId),
    enabled: !!selectedBranch,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
