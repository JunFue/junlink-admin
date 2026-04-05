'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useGrossTrendData, type RawDailyStat } from '../../hooks/useGrossTrendData'
import { formatCurrency, formatCompactNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { getISOWeek, getISOWeekYear } from 'date-fns'

// ── Types ──────────────────────────────────────────
type Granularity = 'day' | 'week' | 'month' | 'year'

interface TrendPoint {
  label: string
  grossSales: number
  netProfit: number
  year: number
  sortKey: string
}

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const GRAN_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const DEFAULT_COUNT: Record<Granularity, number> = { day: 30, week: 12, month: 12, year: 100 }
const MIN_COUNT: Record<Granularity, number> = { day: 7, week: 4, month: 3, year: 2 }
const ZOOM_STEP: Record<Granularity, number> = { day: 3, week: 2, month: 1, year: 1 }

// ── Aggregation helpers ────────────────────────────
function aggregateByDay(raw: RawDailyStat[]): TrendPoint[] {
  return raw.map(r => {
    const d = new Date(r.date + 'T00:00:00')
    return {
      label: `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()} '${String(d.getFullYear()).slice(2)}`,
      grossSales: r.grossSales,
      netProfit: r.netProfit,
      year: d.getFullYear(),
      sortKey: r.date,
    }
  })
}

function aggregateByWeek(raw: RawDailyStat[]): TrendPoint[] {
  const map = new Map<string, { gs: number; np: number; year: number }>()
  for (const r of raw) {
    const d = new Date(r.date + 'T00:00:00')
    const w = getISOWeek(d)
    const wy = getISOWeekYear(d)
    const key = `${wy}-W${String(w).padStart(2, '0')}`
    const ex = map.get(key)
    if (ex) { ex.gs += r.grossSales; ex.np += r.netProfit }
    else map.set(key, { gs: r.grossSales, np: r.netProfit, year: wy })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      label: `W${key.split('-W')[1]} '${String(v.year).slice(2)}`,
      grossSales: v.gs, netProfit: v.np, year: v.year, sortKey: key,
    }))
}

function aggregateByMonth(raw: RawDailyStat[]): TrendPoint[] {
  const map = new Map<string, { gs: number; np: number }>()
  for (const r of raw) {
    const d = new Date(r.date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const ex = map.get(key)
    if (ex) { ex.gs += r.grossSales; ex.np += r.netProfit }
    else map.set(key, { gs: r.grossSales, np: r.netProfit })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [yr, mo] = key.split('-').map(Number)
      return {
        label: `${SHORT_MONTHS[mo - 1]} '${String(yr).slice(2)}`,
        grossSales: v.gs, netProfit: v.np, year: yr, sortKey: key,
      }
    })
}

function aggregateByYear(raw: RawDailyStat[]): TrendPoint[] {
  const map = new Map<number, { gs: number; np: number }>()
  for (const r of raw) {
    const yr = new Date(r.date + 'T00:00:00').getFullYear()
    const ex = map.get(yr)
    if (ex) { ex.gs += r.grossSales; ex.np += r.netProfit }
    else map.set(yr, { gs: r.grossSales, np: r.netProfit })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([yr, v]) => ({
      label: String(yr), grossSales: v.gs, netProfit: v.np, year: yr, sortKey: String(yr),
    }))
}

function aggregate(raw: RawDailyStat[], g: Granularity): TrendPoint[] {
  switch (g) {
    case 'day': return aggregateByDay(raw)
    case 'week': return aggregateByWeek(raw)
    case 'month': return aggregateByMonth(raw)
    case 'year': return aggregateByYear(raw)
  }
}

// ── Year boundary detection ────────────────────────
function getYearBoundaryLabels(points: TrendPoint[]): string[] {
  const labels: string[] = []
  for (let i = 1; i < points.length; i++) {
    if (points[i].year !== points[i - 1].year) {
      labels.push(points[i].label)
    }
  }
  return labels
}

// ── Custom Tooltip ─────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TrendPoint | undefined
  if (!d) return null
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm min-w-[200px]">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-sm text-foreground">Gross Sales</span>
          </div>
          <span className="text-sm font-bold text-foreground">{formatCurrency(d.grossSales)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-sm text-foreground">Net Profit</span>
          </div>
          <span className="text-sm font-bold text-foreground">{formatCurrency(d.netProfit)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────
export function MonthlyGrossTrend() {
  const { data: rawData, isLoading } = useGrossTrendData()
  const [mounted, setMounted] = useState(false)
  const [granularity, setGranularity] = useState<Granularity>('month')
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // View range state (indices into the aggregated data array)
  const [viewStart, setViewStart] = useState(0)
  const [viewEnd, setViewEnd] = useState(11)
  // Ref mirror for event handlers (avoids stale closures)
  const viewRef = useRef({ start: 0, end: 11 })

  useEffect(() => { setMounted(true) }, [])

  // Aggregate data based on granularity
  const allData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    return aggregate(rawData, granularity)
  }, [rawData, granularity])

  // Reset view range when granularity or data changes
  useEffect(() => {
    if (allData.length === 0) return
    const count = Math.min(DEFAULT_COUNT[granularity], allData.length)
    const s = Math.max(0, allData.length - count)
    const e = allData.length - 1
    setViewStart(s)
    setViewEnd(e)
    viewRef.current = { start: s, end: e }
  }, [granularity, allData.length])

  // Sync ref on state change
  useEffect(() => {
    viewRef.current = { start: viewStart, end: viewEnd }
  }, [viewStart, viewEnd])

  // Apply a new view range with clamping
  const applyRange = useCallback((s: number, e: number) => {
    const max = allData.length - 1
    if (max < 0) return
    let ns = Math.round(s)
    let ne = Math.round(e)
    if (ns < 0) { ne -= ns; ns = 0 }
    if (ne > max) { ns -= (ne - max); ne = max }
    ns = Math.max(0, ns)
    ne = Math.min(max, ne)
    if (ne - ns + 1 < MIN_COUNT[granularity]) return
    setViewStart(ns)
    setViewEnd(ne)
    viewRef.current = { start: ns, end: ne }
  }, [allData.length, granularity])

  // ── Wheel zoom ───────────────────────────────────
  useEffect(() => {
    const el = chartContainerRef.current
    if (!el || allData.length === 0) return

    const handler = (e: WheelEvent) => {
      if (granularity === 'year') return
      e.preventDefault()
      const { start, end } = viewRef.current
      const count = end - start + 1
      const step = ZOOM_STEP[granularity]
      const delta = e.deltaY > 0 ? step : -step
      const newCount = count + delta
      if (newCount < MIN_COUNT[granularity] || newCount > allData.length) return

      const rect = el.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const leftDelta = Math.round(delta * ratio)
      const rightDelta = delta - leftDelta
      applyRange(start - leftDelta, end + rightDelta)
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [allData.length, granularity, applyRange])

  // ── Mouse drag to pan ────────────────────────────
  const dragRef = useRef<{ startX: number; startRange: { start: number; end: number } } | null>(null)

  useEffect(() => {
    const el = chartContainerRef.current
    if (!el || allData.length === 0) return

    const onDown = (e: MouseEvent) => {
      dragRef.current = { startX: e.clientX, startRange: { ...viewRef.current } }
      el.style.cursor = 'grabbing'
      e.preventDefault()
    }
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const rect = el.getBoundingClientRect()
      const { startX, startRange } = dragRef.current
      const count = startRange.end - startRange.start + 1
      const pointWidth = rect.width / count
      const shift = Math.round((startX - e.clientX) / pointWidth)
      applyRange(startRange.start + shift, startRange.end + shift)
    }
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null
        if (el) el.style.cursor = 'grab'
      }
    }

    el.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [allData.length, applyRange])

  // ── Touch: pinch zoom + drag pan ─────────────────
  const touchRef = useRef<{
    mode: 'pan' | 'pinch'
    startX: number
    startRange: { start: number; end: number }
    initialDist?: number
  } | null>(null)

  useEffect(() => {
    const el = chartContainerRef.current
    if (!el || allData.length === 0) return

    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        touchRef.current = {
          mode: 'pinch', startX: 0, initialDist: dist(e.touches),
          startRange: { ...viewRef.current },
        }
      } else if (e.touches.length === 1) {
        touchRef.current = {
          mode: 'pan', startX: e.touches[0].clientX,
          startRange: { ...viewRef.current },
        }
      }
    }

    const onMove = (e: TouchEvent) => {
      if (!touchRef.current) return
      const { mode, startRange } = touchRef.current

      if (mode === 'pinch' && e.touches.length === 2 && touchRef.current.initialDist) {
        e.preventDefault()
        const scale = touchRef.current.initialDist / dist(e.touches)
        const origCount = startRange.end - startRange.start + 1
        const newCount = Math.max(MIN_COUNT[granularity], Math.min(allData.length, Math.round(origCount * scale)))
        const center = (startRange.start + startRange.end) / 2
        applyRange(Math.round(center - newCount / 2), Math.round(center + newCount / 2 - 1))
      } else if (mode === 'pan' && e.touches.length === 1) {
        const rect = el.getBoundingClientRect()
        const count = startRange.end - startRange.start + 1
        const pointWidth = rect.width / count
        const shift = Math.round((touchRef.current.startX - e.touches[0].clientX) / pointWidth)
        applyRange(startRange.start + shift, startRange.end + shift)
      }
    }

    const onEnd = () => { touchRef.current = null }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [allData.length, granularity, applyRange])

  // ── Computed values ──────────────────────────────
  const visibleData = useMemo(() => {
    if (allData.length === 0) return []
    return allData.slice(viewStart, viewEnd + 1)
  }, [allData, viewStart, viewEnd])

  const yearBoundaries = useMemo(() => getYearBoundaryLabels(visibleData), [visibleData])

  const summary = useMemo(() => {
    if (allData.length === 0) return null
    const withSales = allData.filter(d => d.grossSales > 0)
    const totalGross = withSales.reduce((s, d) => s + d.grossSales, 0)
    const best = withSales.reduce((b, d) => d.grossSales > b.grossSales ? d : b, withSales[0] || { label: 'N/A', grossSales: 0 })
    const avg = withSales.length > 0 ? totalGross / withSales.length : 0

    // MoM for the latest 2 visible points
    const vWithSales = visibleData.filter(d => d.grossSales > 0)
    let mom = 0
    if (vWithSales.length >= 2) {
      const cur = vWithSales[vWithSales.length - 1].grossSales
      const prev = vWithSales[vWithSales.length - 2].grossSales
      if (prev > 0) mom = Math.round(((cur - prev) / prev) * 1000) / 10
    }

    return { ytdGross: totalGross, avg, bestLabel: best?.label || 'N/A', bestValue: best?.grossSales || 0, mom, hasMom: vWithSales.length >= 2 }
  }, [allData, visibleData])

  // Scroll indicator percentages
  const scrollPct = allData.length > 0
    ? { left: (viewStart / allData.length) * 100, width: ((viewEnd - viewStart + 1) / allData.length) * 100 }
    : { left: 0, width: 100 }

  // ── Loading / empty states ───────────────────────
  if (!mounted || isLoading) {
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

  if (allData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Gross Trend</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-12">No sales data available yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Gross Sales Trend</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {visibleData.length > 0
                    ? `${visibleData[0].label} — ${visibleData[visibleData.length - 1].label}`
                    : 'No data'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* MoM Badge */}
            {summary?.hasMom && (
              <div className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                summary.mom > 0 ? 'bg-success/10 text-success'
                  : summary.mom < 0 ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
              )}>
                {summary.mom > 0 ? <ArrowUpRight className="h-3.5 w-3.5" />
                  : summary.mom < 0 ? <ArrowDownRight className="h-3.5 w-3.5" />
                    : <Minus className="h-3.5 w-3.5" />}
                {summary.mom > 0 ? '+' : ''}{summary.mom}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Container — zoom & pan target */}
      <div
        ref={chartContainerRef}
        className="px-2 sm:px-4 select-none"
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                dy={8}
                interval={granularity === 'day' ? Math.max(0, Math.floor(visibleData.length / 10) - 1) : 0}
                angle={visibleData.length > 14 ? -35 : 0}
                textAnchor={visibleData.length > 14 ? 'end' : 'middle'}
                height={visibleData.length > 14 ? 50 : 30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={v => formatCompactNumber(v)}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Year boundary reference lines */}
              {yearBoundaries.map(label => (
                <ReferenceLine
                  key={`yr-${label}`}
                  x={label}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                />
              ))}

              <Area
                type="monotone"
                dataKey="grossSales"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#grossGrad)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'var(--card)' }}
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#profitGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--success)', fill: 'var(--card)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scroll position indicator + Legend + Summary */}
      <div className="p-6 pt-3">
        {/* Scroll indicator bar */}
        {allData.length > (viewEnd - viewStart + 1) && (
          <div className="relative h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
            <div
              className="absolute h-full bg-primary/30 rounded-full transition-all duration-150"
              style={{ left: `${scrollPct.left}%`, width: `${scrollPct.width}%` }}
            />
          </div>
        )}

        {/* Zoom hint */}
        {granularity !== 'year' && (
          <p className="text-[10px] text-muted-foreground text-center mb-3 select-none">
            Scroll to zoom · Drag to pan
          </p>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full bg-primary" />
            <span className="text-[11px] text-muted-foreground font-medium">Gross Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full bg-success" />
            <span className="text-[11px] text-muted-foreground font-medium">Net Profit</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Gross</p>
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
          </div>
        )}
      </div>
    </div>
  )
}
