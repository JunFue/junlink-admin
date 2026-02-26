'use client'

import { useFinancialMetrics } from '../../hooks/useFinancialMetrics'
import { useDashboardStore } from '../../../stores/dashboardStore'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import { PulseCard } from './PulseCard'
import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function StatsGrid() {
  const { dateRange } = useDashboardStore()
  const { data: realData } = useFinancialMetrics()
  const [showNetSales, setShowNetSales] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-card border border-border" />
        ))}
      </div>
    )
  }
  // Debug log to catch any weird date shifts
  if (realData) {
    console.log('📊 Dashboard Data Debug:', {
      requested: dateRange,
      received_start: realData.debug_start,
      received_end: realData.debug_end,
    })
  }

  const grossSales = realData?.gross_sales ?? 0
  const netSales = realData?.net_sales ?? 0
  const discounts = grossSales - netSales

  const stats = {
    grossSales,
    netSales,
    discounts,
    netProfit: realData?.net_profit ?? 0,
    transactionCount: realData?.transaction_count ?? 0,
    aov: realData?.average_order_value ?? 0,
    grossSalesTrend: 0,
    netProfitTrend: 0,
    transactionTrend: 0,
    aovTrend: 0,
    peakHour: 'N/A',
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative group overflow-hidden rounded-xl border border-border bg-card p-6 transition-all card-hover">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-primary/60" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {showNetSales ? 'Net Sales' : 'Gross Sales'}
              </p>
              <div className="flex bg-muted rounded-lg p-0.5 border border-border/50 -translate-y-px">
                <button
                  onClick={() => setShowNetSales(false)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-bold transition-all",
                    !showNetSales ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  GROSS
                </button>
                <button
                  onClick={() => setShowNetSales(true)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-bold transition-all",
                    showNetSales ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  NET
                </button>
              </div>
            </div>
            <h3 className={cn(
              "text-3xl font-bold tracking-tight",
              !!realData ? "text-amber-500" : "text-foreground"
            )}>
              {formatCurrency(showNetSales ? stats.netSales : stats.grossSales)}
            </h3>
          </div>
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Breakdown</span>
            <div className="flex items-center gap-1.5 text-success font-bold">
              <span>{formatCurrency(stats.discounts)}</span>
              <span className="text-[9px] bg-success/10 px-1 rounded">DISCOUNTS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-hidden rounded-full bg-muted h-1.5">
            <div 
              className="h-full bg-primary/80 transition-all duration-500" 
              style={{ width: `${(stats.netSales / (stats.grossSales || 1)) * 100}%` }}
            />
            <div 
              className="h-full bg-success/60 transition-all duration-500" 
              style={{ width: `${(stats.discounts / (stats.grossSales || 1)) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            {showNetSales ? 'Excluding discounts' : 'Including all discounts'}
          </p>
        </div>
      </div>

      <PulseCard
        title="Net Profit"
        value={formatCurrency(stats.netProfit)}
        trend={stats.netProfitTrend}
        subtitle="vs prev. period"
        tooltip="Revenue minus Costs & Expenses"
        icon={<TrendingUp className="h-5 w-5" />}
        accentColor="bg-success/10 text-success"
        isRealtime={!!realData}
      />

      <PulseCard
        title="Transactions"
        value={formatNumber(stats.transactionCount)}
        trend={stats.transactionTrend}
        subtitle={`Busiest at ${stats.peakHour}`}
        icon={<Receipt className="h-5 w-5" />}
        accentColor="bg-warning/10 text-warning"
        isRealtime={!!realData}
      />

      <PulseCard
        title="Avg. Order Value"
        value={formatCurrency(stats.aov)}
        trend={stats.aovTrend}
        subtitle="per transaction"
        icon={<ShoppingCart className="h-5 w-5" />}
        accentColor="bg-accent text-accent-foreground"
        isRealtime={!!realData}
      />
    </div>
  )
}
