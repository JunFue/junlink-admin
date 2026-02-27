import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { BestSeller } from '../types'

const PAGE_SIZE = 10

export function useWorstSellers(enabled: boolean = true) {
  const { selectedBranch, dateRange } = useDashboardStore()
  const supabase = createClient()

  const startDate = dateRange.from
  const endDate = dateRange.to

  const storeId = (!selectedBranch || selectedBranch === 'all') ? null : selectedBranch
  const isEnabled = !!selectedBranch && enabled

  return useInfiniteQuery<BestSeller[]>({
    queryKey: ['worst-sellers', selectedBranch, startDate, endDate],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('get_worst_sellers', {
        p_store_id: storeId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: PAGE_SIZE,
        p_offset: (pageParam as number) * PAGE_SIZE,
      })

      if (error) {
        console.error('[useWorstSellers] RPC error:', error)
        throw error
      }

      return (data as BestSeller[]) ?? []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than PAGE_SIZE, we've reached the end
      return lastPage.length < PAGE_SIZE ? undefined : allPages.length
    },
    enabled: isEnabled,
    staleTime: 10_000,
  })
}

