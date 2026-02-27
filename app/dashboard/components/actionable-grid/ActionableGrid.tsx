'use client'

import {
  LOW_STOCK_ITEMS,
  MOST_STOCKED_ITEMS,
} from '../../data'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import {
  AlertTriangle,
  Package,
} from 'lucide-react'
import { BestSellersCard } from './BestSellersCard'

export function ActionableGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Low Stock Alerts */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-[500px] overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Low Stock Alerts
          </h3>
          <span className="ml-auto rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            {LOW_STOCK_ITEMS.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border/50">
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                  Item
                </th>
                <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                  Stock
                </th>
                <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                  Reorder
                </th>
              </tr>
            </thead>
            <tbody>
              {LOW_STOCK_ITEMS.map((item) => {
                const critical = item.currentStock <= item.reorderPoint * 0.3
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-border/30 last:border-0',
                      critical && 'bg-destructive/5'
                    )}
                  >
                    <td className="py-2.5 pr-2">
                      <span
                        className={cn(
                          'text-sm',
                          critical
                            ? 'text-destructive font-semibold'
                            : 'text-foreground'
                        )}
                      >
                        {item.name}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold min-w-8',
                          critical
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-warning/15 text-warning'
                        )}
                      >
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground">
                      {item.reorderPoint}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 Best Sellers */}
      <BestSellersCard />

      {/* Most Stocked Items */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-[500px] overflow-hidden">
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4.5 w-4.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Most Stocked Items
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {MOST_STOCKED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(item.stockCount)} units
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground shrink-0">
                {formatCurrency(item.stockValue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
