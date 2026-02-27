import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DeadStockItem } from '../types'

const PAGE_SIZE = 10



export function useDeadStocks(enabled: boolean = true) {
  const { selectedBranch, dateRange } = useDashboardStore()
  const supabase = createClient()

  const startDate = dateRange.from
  const endDate = dateRange.to

  const storeId = (!selectedBranch || selectedBranch === 'all') ? null : selectedBranch
  
  // Requirement: range must be at least 28 days (diff >= 27)
  const daysDiff = startDate && endDate 
    ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  const isEnabled = !!selectedBranch && !!startDate && !!endDate && (daysDiff >= 27) && enabled

  return useInfiniteQuery<DeadStockItem[]>({
    queryKey: ['dead-stocks', selectedBranch, startDate, endDate],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('get_dead_stocks', {
        p_store_id: storeId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: PAGE_SIZE,
        p_offset: (pageParam as number) * PAGE_SIZE,
      })

      if (error) {
        console.error('[useDeadStocks] RPC error:', error)
        throw error
      }

      return (data as DeadStockItem[]) ?? []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < PAGE_SIZE ? undefined : allPages.length
    },
    enabled: isEnabled,
    staleTime: 10_000,
  })
}
