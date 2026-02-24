import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { startOfDay, endOfDay, subDays, startOfMonth, format } from 'date-fns'
import type { DatePreset } from '../dashboard/types'
export type { DatePreset }

interface DateRange {
  from: string // YYYY-MM-DD for consistency and avoiding UTC shifts
  to: string   // YYYY-MM-DD
}

interface DashboardState {
  selectedBranch: string
  datePreset: DatePreset
  dateRange: DateRange
  setBranch: (branch: string) => void
  setPreset: (preset: DatePreset) => void
  setCustomRange: (range: { from: Date; to: Date }, preset?: DatePreset) => void
}

function getDateRangeForPreset(preset: DatePreset): DateRange {
  const now = new Date()
  let range: { from: Date; to: Date }
  switch (preset) {
    case 'today':
      range = { from: startOfDay(now), to: endOfDay(now) }
      break
    case '7d':
      range = { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
      break
    case 'month':
      range = { from: startOfMonth(now), to: endOfDay(now) }
      break
    case 'single':
      range = { from: startOfDay(now), to: endOfDay(now) }
      break
    default:
      range = { from: startOfDay(now), to: endOfDay(now) }
  }
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedBranch: 'all',
      datePreset: 'today',
      dateRange: getDateRangeForPreset('today'),

      setBranch: (branch) => set({ selectedBranch: branch }),

      setPreset: (preset) =>
        set({
          datePreset: preset,
          dateRange: getDateRangeForPreset(preset),
        }),

      setCustomRange: (range, preset = 'custom') =>
        set({
          datePreset: preset,
          dateRange: {
            from: format(range.from, 'yyyy-MM-dd'),
            to: format(range.to, 'yyyy-MM-dd'),
          },
        }),
    }),
    {
      name: 'dashboard-storage-v4', // Hard reset to clear any stale data
      version: 4,
      migrate: (persistedState: any, version: number) => {
        return persistedState
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always recalculate 'today', '7d', 'month', 'single' relative to current 'now'
          // only 'custom' and potentially 'single' (if used for history) should be preserved strictly
          // but even 'single' as described is 'History' in the UI, which uses setCustomRange.
          // The PRESETS are Today, 7D, Month.
          if (['today', '7d', 'month'].includes(state.datePreset)) {
            state.dateRange = getDateRangeForPreset(state.datePreset)
          }

          // Legacy ISO fix
          const isIso = (s: string) => s.includes('T')
          if (isIso(state.dateRange.from) || isIso(state.dateRange.to)) {
            state.dateRange = getDateRangeForPreset('today')
            state.datePreset = 'today'
          }
        }
      },
    }
  )
)
