import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getStaffPermissions } from '../services/permissionService'

export function useStaffPermissions(userId: string | undefined | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['staffPermissions', userId],
    queryFn: () => {
      if (!userId) return null
      return getStaffPermissions(supabase, userId)
    },
    enabled: !!userId,
  })
}
