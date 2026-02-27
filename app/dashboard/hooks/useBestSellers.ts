import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { BestSeller } from '../types'

export function useBestSellers(limit: number = 5, enabled: boolean = true) {
  const { selectedBranch, dateRange } = useDashboardStore()
  const supabase = createClient()

  const startDate = dateRange.from
  const endDate = dateRange.to

  const storeId = (!selectedBranch || selectedBranch === 'all') ? null : selectedBranch
  const isEnabled = !!selectedBranch && enabled

  return useQuery<BestSeller[]>({
    queryKey: ['best-sellers', selectedBranch, startDate, endDate, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_best_sellers', {
        p_store_id: storeId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: limit,
      })

      if (error) {
        console.error('[useBestSellers] RPC error:', error)
        throw error
      }

      return (data as BestSeller[]) ?? []
    },
    enabled: isEnabled,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}
