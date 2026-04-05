import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import { format, startOfMonth, endOfMonth, startOfYear, isFuture } from 'date-fns'

export interface MonthlyGrossData {
  month: string       // "Jan", "Feb", etc.
  monthIndex: number  // 0-11
  grossSales: number
  netProfit: number
  isCurrent: boolean
  isFuture: boolean
}

async function fetchMonthlyGrossTrend(
  storeId: string | null,
  year: number
): Promise<MonthlyGrossData[]> {
  const supabase = createClient()
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthIndex = now.getMonth()

  // Build promises for each month up to the current month
  const promises = monthNames.map(async (name, index) => {
    const monthDate = new Date(year, index, 1)
    const isCurrentMonth = index === currentMonthIndex && year === now.getFullYear()
    const isFutureMonth = isFuture(monthDate) && !isCurrentMonth

    if (isFutureMonth) {
      return {
        month: name,
        monthIndex: index,
        grossSales: 0,
        netProfit: 0,
        isCurrent: false,
        isFuture: true,
      }
    }

    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const endDate = format(
      isCurrentMonth ? now : endOfMonth(monthDate),
      'yyyy-MM-dd'
    )

    const normalizedStoreId = (!storeId || storeId === '' || storeId === 'all') ? null : storeId

    const { data, error } = await supabase
      .rpc('get_dashboard_metrics', {
        p_store_id: normalizedStoreId,
        p_start_date: startDate,
        p_end_date: endDate,
      })
      .maybeSingle()

    if (error) {
      console.error(`[useMonthlyGrossTrend] Error for ${name}:`, error)
      return {
        month: name,
        monthIndex: index,
        grossSales: 0,
        netProfit: 0,
        isCurrent: isCurrentMonth,
        isFuture: false,
      }
    }

    const row = data as { gross_sales?: number; net_profit?: number } | null

    return {
      month: name,
      monthIndex: index,
      grossSales: Number(row?.gross_sales || 0),
      netProfit: Number(row?.net_profit || 0),
      isCurrent: isCurrentMonth,
      isFuture: false,
    }
  })

  return Promise.all(promises)
}

export function useMonthlyGrossTrend() {
  const { selectedBranch } = useDashboardStore()
  const currentYear = new Date().getFullYear()

  const storeId = selectedBranch === 'all' ? null : selectedBranch

  return useQuery({
    queryKey: ['monthly-gross-trend', storeId, currentYear],
    queryFn: () => fetchMonthlyGrossTrend(storeId, currentYear),
    enabled: !!selectedBranch,
    staleTime: 5 * 60 * 1000, // 5 minutes - this is yearly data, doesn't change fast
    refetchInterval: 5 * 60 * 1000,
  })
}
