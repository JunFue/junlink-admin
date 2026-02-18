'use client'

import { cn } from '@/lib/utils/cn'
import { Info, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'

interface PulseCardProps {
  title: string
  value: string
  trend?: number
  subtitle?: string
  tooltip?: string
  icon: React.ReactNode
  accentColor?: string
  isRealtime?: boolean
}

export function PulseCard({
  title,
  value,
  trend,
  subtitle,
  tooltip,
  icon,
  accentColor = 'text-primary',
  isRealtime,
}: PulseCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isPositive = trend !== undefined && trend >= 0

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-all card-hover overflow-hidden">
      {/* Subtle accent gradient at top */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl opacity-60"
        style={{
          background: `linear-gradient(90deg, var(--primary), var(--primary) 60%, transparent)`,
        }}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {tooltip && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-52 rounded-lg bg-foreground text-background text-xs px-3 py-2 shadow-lg pointer-events-none">
                    {tooltip}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>
          <p className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight truncate",
            isRealtime ? "text-amber-500" : "text-foreground"
          )}>
            {value}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {trend !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  isPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            accentColor.includes('bg-')
              ? accentColor
              : 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
