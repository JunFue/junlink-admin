import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { regenerateEnrollmentCode } from '../services/storeService'

export function useRegenerateCode() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: string) => regenerateEnrollmentCode(supabase, storeId),
    onSuccess: (data, storeId) => {
      // Refresh the store details specifically
      queryClient.invalidateQueries({ queryKey: ['store', storeId] })
      // Or you can invalidate the list of stores if needed
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    }
  })
}
