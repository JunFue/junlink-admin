import React from 'react'
import { TrendPoint, MultiStoreTrendPoint } from './types'
import { formatCurrency } from '@/lib/utils/formatters'

export function SingleStoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TrendPoint | undefined
  if (!d) return null
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm min-w-[180px]">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      {d.isFuture ? (
        <p className="text-sm font-medium text-muted-foreground italic">No data yet</p>
      ) : (
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-sm text-foreground">Gross Sales</span>
          </div>
          <span className="text-sm font-bold text-foreground">{formatCurrency(d.grossSales)}</span>
        </div>
      )}
    </div>
  )
}

export function MultiStoreTooltip({
  active, payload, label, storeMap,
}: any & { storeMap: Map<string, { name: string; color: string }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as MultiStoreTrendPoint | undefined
  if (!point) return null

  if (point.isFuture) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm min-w-[180px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
        <p className="text-sm font-medium text-muted-foreground italic">No data yet</p>
      </div>
    )
  }

  const entries = payload
    .filter((p: any) => p.dataKey !== 'total')
    .map((p: any) => ({
      storeId: p.dataKey,
      value: p.value || 0,
      color: p.color || p.stroke || 'var(--muted-foreground)',
      name: storeMap?.get(p.dataKey)?.name || p.dataKey,
    }))
    .sort((a: any, b: any) => b.value - a.value)

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm min-w-[220px] max-w-[320px]">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {entries.map((e: any) => (
          <div key={e.storeId} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-sm text-foreground truncate">{e.name}</span>
            </div>
            <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatCurrency(e.value)}</span>
          </div>
        ))}
      </div>
      {entries.length > 1 && (
        <div className="border-t border-border/50 mt-2 pt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Total</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency((point.total as number) || 0)}</span>
        </div>
      )}
    </div>
  )
}
