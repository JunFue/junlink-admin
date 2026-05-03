'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Calendar, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useGrossTrendData,
  useMultiStoreGrossTrendData,
  useHourlyGrossTrendData,
  useMultiStoreHourlyGrossTrendData,
} from '../../hooks/useGrossTrendData'
import { useStores } from '@/app/stores/hooks/useStores'
import { useDashboardStore } from '../../../stores/dashboardStore'
import { formatCompactNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { format, addDays, startOfWeek, endOfWeek, addWeeks, startOfYear, endOfYear } from 'date-fns'

// ── Imported Submodules ──────────────────────────
import { Granularity, ChartStyle, TrendPoint, MultiStoreTrendPoint } from './types'
import { GRAN_OPTIONS, STORE_COLORS } from './constants'
import { CHART_STYLE_OPTIONS } from './ChartIcons'
import { SingleStoreTooltip, MultiStoreTooltip } from './ChartTooltips'
import {
  aggregateHourly,
  aggregateMultiStoreHourly,
  aggregateWeekly,
  aggregateMultiStoreWeekly,
  aggregateMonthly,
  aggregateMultiStoreMonthly,
  aggregateYearly,
  aggregateMultiStoreYearly,
} from './utils'

// ── Main Component ─────────────────────────────────
export function MonthlyGrossTrend() {
  const { selectedBranch } = useDashboardStore()
  const isAllStores = selectedBranch === 'all'
  const { data: stores } = useStores()

  const [mounted, setMounted] = useState(false)
  const [granularity, setGranularity] = useState<Granularity>('month')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('smooth-line')
  const [offset, setOffset] = useState(0) // 0 = current period, -1 = previous, etc.

  useEffect(() => { setMounted(true) }, [])

  // Reset offset when granularity changes
  useEffect(() => { setOffset(0) }, [granularity])

  // Build store lookup
  const storeMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    if (!stores) return map
    const activeStores = (stores as any[]).filter((s: any) => !s.deleted_at)
    activeStores.forEach((s: any, i: number) => {
      map.set(s.store_id, {
        name: s.store_name || `Store ${i + 1}`,
        color: STORE_COLORS[i % STORE_COLORS.length],
      })
    })
    return map
  }, [stores])

  const storeIds = useMemo(() => Array.from(storeMap.keys()), [storeMap])

  // Compute date ranges based on granularity and offset
  const { targetDateStr, startDateStr, endDateStr, dateLabel, startObj } = useMemo(() => {
    const now = new Date()
    let tStr = '', sStr = '', eStr = '', lbl = '', sObj = now

    if (granularity === 'day') {
      const target = addDays(now, offset)
      tStr = format(target, 'yyyy-MM-dd')
      lbl = format(target, 'MMM d, yyyy')
    } else if (granularity === 'week') {
      const targetWeek = addWeeks(now, offset)
      const s = startOfWeek(targetWeek, { weekStartsOn: 0 }) // Sunday
      const e = endOfWeek(targetWeek, { weekStartsOn: 0 })   // Saturday
      sStr = format(s, 'yyyy-MM-dd')
      eStr = format(e, 'yyyy-MM-dd')
      sObj = s
      lbl = `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`
    } else if (granularity === 'month') {
      const targetYear = now.getFullYear() + offset
      const s = startOfYear(new Date(targetYear, 0, 1))
      const e = endOfYear(s)
      sStr = format(s, 'yyyy-MM-dd')
      eStr = format(e, 'yyyy-MM-dd')
      sObj = s
      lbl = String(targetYear)
    } else if (granularity === 'year') {
      const endYr = now.getFullYear() + offset
      const startYr = endYr - 6
      const s = startOfYear(new Date(startYr, 0, 1))
      const e = endOfYear(new Date(endYr, 0, 1))
      sStr = format(s, 'yyyy-MM-dd')
      eStr = format(e, 'yyyy-MM-dd')
      sObj = s
      lbl = `${startYr} – ${endYr}`
    }

    return { targetDateStr: tStr, startDateStr: sStr, endDateStr: eStr, dateLabel: lbl, startObj: sObj }
  }, [granularity, offset])

  // Data fetching
  const { data: dailyRaw, isLoading: dailyLoading } = useGrossTrendData(startDateStr, endDateStr)
  const { data: multiDailyRaw, isLoading: multiDailyLoading } = useMultiStoreGrossTrendData(startDateStr, endDateStr)
  const { data: hourlyRaw, isLoading: hourlyLoading } = useHourlyGrossTrendData(targetDateStr)
  const { data: multiHourlyRaw, isLoading: multiHourlyLoading } = useMultiStoreHourlyGrossTrendData(targetDateStr)

  // Determine current dataset and loading state based on selections
  let allData: any[] = []
  let isLoading = false

  if (granularity === 'day') {
    isLoading = isAllStores ? multiHourlyLoading : hourlyLoading
    allData = isAllStores && multiHourlyRaw
      ? aggregateMultiStoreHourly(multiHourlyRaw, storeIds)
      : hourlyRaw ? aggregateHourly(hourlyRaw) : []
  } else if (granularity === 'week') {
    isLoading = isAllStores ? multiDailyLoading : dailyLoading
    allData = isAllStores && multiDailyRaw
      ? aggregateMultiStoreWeekly(multiDailyRaw, startObj, storeIds)
      : dailyRaw ? aggregateWeekly(dailyRaw, startObj) : []
  } else if (granularity === 'month') {
    isLoading = isAllStores ? multiDailyLoading : dailyLoading
    const tgtYr = startObj.getFullYear()
    allData = isAllStores && multiDailyRaw
      ? aggregateMultiStoreMonthly(multiDailyRaw, tgtYr, storeIds)
      : dailyRaw ? aggregateMonthly(dailyRaw, tgtYr) : []
  } else if (granularity === 'year') {
    isLoading = isAllStores ? multiDailyLoading : dailyLoading
    const endYr = startObj.getFullYear() + 6
    allData = isAllStores && multiDailyRaw
      ? aggregateMultiStoreYearly(multiDailyRaw, endYr, storeIds)
      : dailyRaw ? aggregateYearly(dailyRaw, endYr) : []
  }

  // Summary
  const summary = useMemo(() => {
    if (allData.length === 0) return null

    const getGross = (d: any) => isAllStores ? (d as MultiStoreTrendPoint).total : (d as TrendPoint).grossSales
    const isFuture = (d: any) => d.isFuture === true

    const withSales = allData.filter(d => !isFuture(d) && (getGross(d) || 0) > 0)
    const validDataPoints = allData.filter(d => !isFuture(d))

    const totalGross = withSales.reduce((s, d) => s + (getGross(d) || 0), 0)
    const best = withSales.reduce((b, d) => (getGross(d) || 0) > (getGross(b) || 0) ? d : b, withSales[0] || { label: 'N/A' })
    const avg = validDataPoints.length > 0 ? totalGross / validDataPoints.length : 0

    return {
      ytdGross: totalGross,
      avg,
      bestLabel: (best as any)?.label || 'N/A',
      bestValue: getGross(best) || 0,
    }
  }, [allData, isAllStores])

  // ── Chart rendering ──────────────────────────────
  const chartMargin = { top: 10, right: 16, left: 0, bottom: 0 }
  const xAxisProps = {
    dataKey: 'label',
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
    dy: 8,
    interval: granularity === 'day' ? 3 : 0,
    angle: 0,
    textAnchor: 'middle' as 'middle',
    height: 30,
  }
  const yAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
    tickFormatter: (v: number) => formatCompactNumber(v),
    width: 55,
  }

  function renderSingleStoreChart() {
    const data = allData as TrendPoint[]
    
    const chartData = data.map(d => ({
      ...d,
      chartGross: d.isFuture ? null : d.grossSales
    }))

    switch (chartStyle) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<SingleStoreTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            <Bar dataKey="chartGross" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        )

      case 'smooth-line':
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<SingleStoreTooltip />} />
            <Line
              type="monotone"
              dataKey="chartGross"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'var(--card)' }}
            />
          </LineChart>
        )

      case 'line-dot':
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<SingleStoreTooltip />} />
            <Line
              type="linear"
              dataKey="chartGross"
              stroke="var(--primary)"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'var(--card)' }}
            />
          </LineChart>
        )

      case 'bar-smooth':
        return (
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<SingleStoreTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            <Bar dataKey="chartGross" fill="var(--primary)" fillOpacity={0.15} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line
              type="monotone"
              dataKey="chartGross"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'var(--card)' }}
            />
          </ComposedChart>
        )

      case 'bar-line-dot':
        return (
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<SingleStoreTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            <Bar dataKey="chartGross" fill="var(--primary)" fillOpacity={0.15} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line
              type="linear"
              dataKey="chartGross"
              stroke="var(--primary)"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'var(--card)' }}
            />
          </ComposedChart>
        )
    }
  }

  function renderMultiStoreChart() {
    const data = allData as MultiStoreTrendPoint[]
    const tooltipContent = <MultiStoreTooltip storeMap={storeMap} />

    const chartData = data.map(d => {
      if (d.isFuture) {
        const empty: any = { label: d.label, isFuture: true, total: null }
        storeIds.forEach(sid => empty[sid] = null)
        return empty
      }
      return d
    })

    const renderStoreLines = (withDots: boolean, lineType: 'monotone' | 'linear' = 'monotone') =>
      storeIds.map(sid => {
        const info = storeMap.get(sid)
        if (!info) return null
        return (
          <Line
            key={sid}
            type={lineType}
            dataKey={sid}
            stroke={info.color}
            strokeWidth={2}
            connectNulls={false}
            dot={withDots ? { r: 2.5, fill: info.color, strokeWidth: 0 } : false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: info.color, fill: 'var(--card)' }}
            name={info.name}
          />
        )
      })

    const renderTotalBar = () => (
      <Bar dataKey="total" fill="var(--muted-foreground)" fillOpacity={0.1} radius={[4, 4, 0, 0]} maxBarSize={40} name="Total" />
    )

    switch (chartStyle) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            {storeIds.map(sid => {
              const info = storeMap.get(sid)
              if (!info) return null
              return (
                <Bar key={sid} dataKey={sid} fill={info.color} radius={[2, 2, 0, 0]} maxBarSize={24} name={info.name} />
              )
            })}
          </BarChart>
        )

      case 'smooth-line':
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} />
            {renderStoreLines(false)}
          </LineChart>
        )

      case 'line-dot':
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} />
            {renderStoreLines(true, 'linear')}
          </LineChart>
        )

      case 'bar-smooth':
        return (
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            {renderTotalBar()}
            {renderStoreLines(false)}
          </ComposedChart>
        )

      case 'bar-line-dot':
        return (
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            {renderTotalBar()}
            {renderStoreLines(true, 'linear')}
          </ComposedChart>
        )
    }
  }

  // ── Loading / empty states ───────────────────────
  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="space-y-2"><div className="h-4 w-36 bg-muted rounded" /><div className="h-3 w-24 bg-muted rounded" /></div>
          </div>
          <div className="h-[280px] bg-muted/50 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20 flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Gross Sales Trend</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {dateLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Arrow Nav */}
            <div className="flex items-center rounded-lg border border-border/50 bg-muted/50 p-0.5">
              <button
                onClick={() => setOffset(o => o - 1)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-all hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-bold px-2 text-muted-foreground w-12 text-center uppercase tracking-wider">
                {offset === 0 ? 'Now' : offset}
              </span>
              <button
                onClick={() => setOffset(o => Math.min(0, o + 1))}
                disabled={offset >= 0}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-all disabled:opacity-30 disabled:hover:bg-transparent hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Chart Style Picker */}
            <div className="flex bg-muted rounded-lg p-0.5 border border-border/50">
              {CHART_STYLE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setChartStyle(o.value)}
                  title={o.label}
                  className={cn(
                    'flex items-center justify-center gap-0.5 px-2 py-1 rounded-md transition-all',
                    chartStyle === o.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <o.Icon active={chartStyle === o.value} />
                </button>
              ))}
            </div>

            {/* Granularity Tabs */}
            <div className="flex bg-muted rounded-lg p-0.5 border border-border/50">
              {GRAN_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setGranularity(o.value)}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-md font-bold transition-all',
                    granularity === o.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-2 sm:px-4 flex-1 min-h-[280px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-[1px] z-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : null}
        
        {allData.length === 0 && !isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No sales data available for this period.</p>
          </div>
        ) : (
          <div className="h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {isAllStores ? renderMultiStoreChart() : renderSingleStoreChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer: Legend + Summary */}
      <div className="p-6 pt-2">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 border-b border-border/50 pb-4">
          {isAllStores ? (
            storeIds.map(sid => {
              const info = storeMap.get(sid)
              if (!info) return null
              return (
                <div key={sid} className="flex items-center gap-1.5">
                  <div className="h-2 w-6 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="text-[11px] text-muted-foreground font-medium">{info.name}</span>
                </div>
              )
            })
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-6 rounded-full bg-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Gross Sales</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Sales</p>
              <p className="text-lg font-bold text-foreground tracking-tight">{formatCompactNumber(summary.ytdGross)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg / Period</p>
              <p className="text-lg font-bold text-foreground tracking-tight">{formatCompactNumber(summary.avg)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Best Period</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-foreground tracking-tight">{summary.bestLabel}</p>
                <span className="text-[10px] text-primary font-semibold">{formatCompactNumber(summary.bestValue)}</span>
              </div>
            </div>
            <div className="space-y-1 md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="text-xs text-muted-foreground mt-1">
                {offset === 0 ? 'Current window' : `${Math.abs(offset)} period${Math.abs(offset) > 1 ? 's' : ''} prior`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
