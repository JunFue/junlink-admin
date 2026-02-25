import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { removeStaffMember } from '../services/staffService'

export function useRemoveStaff() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeStaffMember(supabase, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: ['staffPermissions'] })
    },
  })
}
