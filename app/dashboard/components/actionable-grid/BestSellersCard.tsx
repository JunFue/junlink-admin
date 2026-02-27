import { useState, useMemo, useEffect, useRef } from 'react'
import { useBestSellers } from '../../hooks/useBestSellers'
import { useWorstSellers } from '../../hooks/useWorstSellers'
import { useDeadStocks } from '../../hooks/useDeadStocks'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { Trophy, TrendingDown, PackageOpen, ChevronDown, Loader2, Skull, CalendarClock } from 'lucide-react'
import { useDashboardStore } from '@/app/stores/dashboardStore'

const LIMIT_OPTIONS = [5, 10, 15, 20] as const

type DashboardViewMode = 'best' | 'least' | 'dead'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-7 w-7 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-3/5 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-4 w-16 rounded bg-muted animate-pulse shrink-0" />
    </div>
  )
}

export function BestSellersCard() {
  const [mode, setMode] = useState<DashboardViewMode>('best')
  const [limit, setLimit] = useState<number>(5)
  const [limitOpen, setLimitOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { selectedBranch, dateRange } = useDashboardStore()
  const startDate = dateRange.from
  const endDate = dateRange.to

  // Redundant but safe check for the UI message (sync with useDeadStocks)
  const daysDiff = startDate && endDate 
    ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isDeadStockEnabled = !!selectedBranch && !!startDate && !!endDate && (daysDiff >= 27)

  const best = useBestSellers(limit, mode === 'best')
  const least = useWorstSellers(mode === 'least')
  const dead = useDeadStocks(mode === 'dead')

  // Determine which data to show
  const currentQuery = mode === 'least' ? least : mode === 'dead' ? dead : best

  const displayData = useMemo(() => {
    if (mode === 'least') return least.data?.pages.flat() ?? []
    if (mode === 'dead') return dead.data?.pages.flat() ?? []
    return best.data ?? []
  }, [mode, best.data, least.data, dead.data])

  // Get infinite query props safely
  const isInfinite = mode === 'least' || mode === 'dead'
  const hasNextPage = isInfinite ? (currentQuery as any).hasNextPage : false
  const isFetchingNextPage = isInfinite ? (currentQuery as any).isFetchingNextPage : false
  const fetchNextPage = isInfinite ? (currentQuery as any).fetchNextPage : () => {}

  // Cycle through modes
  const cycleMode = () => {
    if (mode === 'best') setMode('least')
    else if (mode === 'least') setMode('dead')
    else setMode('best')
  }

  // Infinite scroll observer
  useEffect(() => {
    if (mode === 'best' || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [mode, hasNextPage, isFetchingNextPage, fetchNextPage])

  const modeConfig = {
    best: {
      title: `Top ${limit} Best Sellers`,
      Icon: Trophy,
      bg: 'bg-warning/10',
      text: 'text-warning',
      toggleLabel: 'Best',
    },
    least: {
      title: 'Least Sold Items',
      Icon: TrendingDown,
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      toggleLabel: 'Least',
    },
    dead: {
      title: 'Dead Stocks (0 Sales)',
      Icon: Skull,
      bg: 'bg-slate-500/10',
      text: 'text-slate-500',
      toggleLabel: 'Dead',
    }
  }[mode]

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', modeConfig.bg)}>
          <modeConfig.Icon className={cn('h-4.5 w-4.5', modeConfig.text)} />
        </div>
        <h3 className="text-sm font-semibold text-foreground truncate">
          {modeConfig.title}
        </h3>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Cycle Toggle */}
          <button
            type="button"
            onClick={cycleMode}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              mode === 'best' ? 'bg-muted text-muted-foreground hover:bg-warning/15 hover:text-warning' :
              mode === 'least' ? 'bg-destructive/10 text-destructive hover:bg-destructive/15' :
              'bg-slate-500/10 text-slate-500 hover:bg-slate-500/15'
            )}
            title={`Switch to ${mode === 'best' ? 'Least Sold' : mode === 'least' ? 'Dead Stock' : 'Best Sellers'}`}
          >
            {modeConfig.Icon === Trophy ? <TrendingDown className="h-3 w-3" /> : 
             modeConfig.Icon === TrendingDown ? <Skull className="h-3 w-3" /> : 
             <Trophy className="h-3 w-3" />}
            <span className="hidden sm:inline">{modeConfig.toggleLabel}</span>
          </button>

          {/* Limit selector - Only show for Best Sellers */}
          {mode === 'best' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLimitOpen(!limitOpen)}
                className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {limit}
                <ChevronDown className={cn('h-3 w-3 transition-transform', limitOpen && 'rotate-180')} />
              </button>
              {limitOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-20 rounded-lg border border-border bg-card shadow-xl animate-slide-in-up">
                  {LIMIT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setLimit(opt)
                        setLimitOpen(false)
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent',
                        opt === limit
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground'
                      )}
                    >
                      Top {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-0 relative">
        {/* Date Range Safeguard for Dead Stock */}
        {mode === 'dead' && !isDeadStockEnabled && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
            <CalendarClock className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Check Date Range
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dead stock analysis requires at least a full month (28+ days) of data to be accurate.
            </p>
          </div>
        )}

        {/* Loading State */}
        {currentQuery.isLoading && (mode !== 'dead' || isDeadStockEnabled) && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}


        {/* Error State */}
        {currentQuery.isError && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PackageOpen className="h-8 w-8 text-destructive/60 mb-2" />
            <p className="text-sm text-destructive/80">
              {currentQuery.error instanceof Error ? currentQuery.error.message : 'Failed to load data'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {currentQuery.isSuccess && displayData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PackageOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No items found for this criteria
            </p>
          </div>
        )}

        {/* Data State */}
        {currentQuery.isSuccess && displayData.length > 0 && (
          <div className="space-y-1 h-full overflow-y-auto pr-1">
            {displayData.map((item, index) => {
              const baseItem = item as any
              const isDead = mode === 'dead'
              
              return (
              <div
                key={`${baseItem.item_name}-${baseItem.item_id || index}`}
                className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                    mode === 'best' && index === 0 ? 'bg-warning/20 text-warning' :
                    mode === 'best' && index === 1 ? 'bg-muted text-muted-foreground' :
                    mode === 'least' && index < 3 ? 'bg-destructive/20 text-destructive' :
                    isDead ? 'bg-slate-500/20 text-slate-500' :
                    'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {baseItem.item_name}
                  </p>
                  {isDead && baseItem.store_name && (
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate leading-tight">
                      {baseItem.store_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {isDead 
                      ? `₱${formatNumber(baseItem.unit_cost)} unit cost` 
                      : `${formatNumber(baseItem.total_sold)} sold`}
                  </p>
                </div>
                <span className={cn(
                  "text-sm font-semibold shrink-0 self-center",
                  isDead ? "text-muted-foreground italic font-normal text-xs" : "text-success"
                )}>
                  {isDead ? 'Dead Stock' : formatCurrency(baseItem.revenue)}
                </span>
              </div>
            )})}


            {/* Load More Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">Scroll for more</span>
                )}
              </div>
            )}
            {!hasNextPage && mode !== 'best' && displayData.length > 0 && (
              <div className="py-4 text-center">
                <span className="text-[10px] text-muted-foreground">End of list</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

