import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { updateStaffPermissions } from '../services/permissionService'
import type { StaffPermissions } from '@/lib/types/database'

export function useUpdateStaffPermissions() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string, updates: Partial<Omit<StaffPermissions, 'id' | 'user_id' | 'created_at'>> }) =>
      updateStaffPermissions(supabase, userId, updates),
    onSuccess: (_, { userId }) => {
      // Invalidate the cache for this specific user's permissions
      queryClient.invalidateQueries({ queryKey: ['staffPermissions', userId] })
    },
  })
}
