'use client'

import { useDashboardStore, type DatePreset } from '../../../stores/dashboardStore'
import { useStores } from '@/app/stores/hooks/useStores'
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics'
import { format, startOfDay, endOfDay } from 'date-fns'
import { CalendarDays, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: 'month', label: 'Month' },
]

export function FilterHeader() {
  const {
    selectedBranch,
    datePreset,
    dateRange,
    setBranch,
    setPreset,
    setCustomRange,
  } = useDashboardStore()

  const { data: stores } = useStores()

  const [branchOpen, setBranchOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState<'range' | 'single' | false>(false)
  const branchRef = useRef<HTMLDivElement>(null)
  const customRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(e.target as Node))
        setBranchOpen(false)
      if (customRef.current && !customRef.current.contains(e.target as Node))
        setCustomOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allBranches = [
    { id: 'all', name: 'All Stores' },
    ...(stores?.map((s: any) => ({ id: s.store_id, name: s.store_name })) || []),
  ]

  const branchLabel =
    allBranches.find((b) => b.id === selectedBranch)?.name ?? 'All Stores'

  const fromDate = new Date(dateRange.from)
  const toDate = new Date(dateRange.to)

  return (
    <div className="sticky top-0 z-30 -mx-6 -mt-6 mb-2 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Overview</h1>
            <p className="text-xs text-muted-foreground">
              {format(fromDate, 'MMM d, yyyy')}
              {dateRange.from !== dateRange.to &&
                ` — ${format(toDate, 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="relative" ref={branchRef}>
            <button
              type="button"
              onClick={() => setBranchOpen(!branchOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className="max-w-[140px] truncate">{branchLabel}</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', branchOpen && 'rotate-180')} />
            </button>

            {branchOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-card shadow-xl animate-slide-in-up">
                {allBranches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBranch(b.id)
                      setBranchOpen(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                      b.id === selectedBranch
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground'
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Presets */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPreset(p.key)
                  setCustomOpen(false)
                }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  datePreset === p.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Range Trigger */}
            <div className="relative" ref={customRef}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomOpen(customOpen === 'single' ? false : 'single')
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    datePreset === 'single'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomOpen(customOpen === 'range' ? false : 'range')
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    datePreset === 'custom'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Range
                </button>
              </div>

              {customOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-card p-4 shadow-xl animate-slide-in-up">
                  {customOpen === 'single' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={format(fromDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            if (e.target.value) {
                              const d = new Date(e.target.value)
                              setCustomRange({
                                from: startOfDay(d),
                                to: endOfDay(d),
                              }, 'single')
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          From
                        </label>
                        <input
                          type="date"
                          value={format(fromDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            if (e.target.value) {
                              const d = new Date(e.target.value)
                              setCustomRange({
                                from: d,
                                to: toDate,
                              })
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          To
                        </label>
                        <input
                          type="date"
                          value={format(toDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            if (e.target.value) {
                              const d = new Date(e.target.value)
                              setCustomRange({
                                from: fromDate,
                                to: d,
                              })
                            }
                          }}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
