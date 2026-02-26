import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getCashouts,
  addCashout,
  updateCashout,
  deleteCashout,
  getClassifications,
  getRemittanceCategories
} from '../services/cashoutsService'
import type { Expense } from '@/lib/types/database'

export function useCashouts(dateRange: string, storeId?: string, subcategoryName?: string) {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['cashouts', dateRange, storeId, subcategoryName],
    queryFn: ({ pageParam = 0 }) => getCashouts(supabase, dateRange, storeId, pageParam, 20, subcategoryName),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useAddCashout() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Expense>) => addCashout(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashouts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] }) 
    },
  })
}

export function useUpdateCashout() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => updateCashout(supabase, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashouts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] }) 
    },
  })
}

export function useDeleteCashout() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCashout(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashouts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] }) 
    },
  })
}

export function useClassifications(storeId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['classifications', storeId],
    queryFn: () => getClassifications(supabase, storeId),
    enabled: !!storeId, // Generally Classifications are store-bound
  })
}

export function useGlobalSubcategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['global-subcategories'],
    queryFn: async () => {
       // get all classifications to map out global distinct upper names
       const classes = await getClassifications(supabase)
       // get all remittance categories
       const remittances = await getRemittanceCategories(supabase)
       
       const uniqueOpex = Array.from(new Set(classes.map(c => c.name.trim().toUpperCase()))).sort()
       const uniqueRemit = Array.from(new Set(remittances.map(r => r.name.trim().toUpperCase()))).sort()
       
       return {
         OPEX: uniqueOpex,
         REMITTANCE: uniqueRemit
       }
    }
  })
}

export function useRemittanceCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['remittance-categories'],
    queryFn: () => getRemittanceCategories(supabase),
  })
}
