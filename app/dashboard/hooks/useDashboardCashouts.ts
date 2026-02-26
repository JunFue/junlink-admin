import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCashoutsBreakdown } from '@/app/transaction/services/cashoutsService'
import { useDashboardStore } from '@/app/stores/dashboardStore'

export function useDashboardCashouts() {
  const supabase = createClient()
  const { dateRange, selectedBranch } = useDashboardStore()

  const storeId = selectedBranch === 'all' ? undefined : selectedBranch

  return useQuery({
    queryKey: ['dashboard-cashouts-breakdown', dateRange.from, dateRange.to, storeId],
    queryFn: async () => {
      return getCashoutsBreakdown(supabase, dateRange.from, dateRange.to, storeId)
    },
  })
}
