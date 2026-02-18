'use client'

import {
  LOW_STOCK_ITEMS,
  BEST_SELLERS,
  MOST_STOCKED_ITEMS,
} from '../../data'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import {
  AlertTriangle,
  Trophy,
  Package,
} from 'lucide-react'

export function ActionableGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Low Stock Alerts */}
      <div className="rounded-xl border border-border bg-card p-6">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
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
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
            <Trophy className="h-4.5 w-4.5 text-warning" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Top 5 Best Sellers
          </h3>
        </div>

        <div className="space-y-3">
          {BEST_SELLERS.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                  index === 0
                    ? 'bg-warning/20 text-warning'
                    : index === 1
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                )}
              >
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(item.unitsSold)} sold
                </p>
              </div>
              <span className="text-sm font-semibold text-success shrink-0">
                {formatCurrency(item.grossProfit)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Most Stocked Items */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4.5 w-4.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Most Stocked Items
          </h3>
        </div>

        <div className="space-y-3">
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
