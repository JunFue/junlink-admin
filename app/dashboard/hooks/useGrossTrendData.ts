import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../stores/dashboardStore'
import { format, subMonths, addDays } from 'date-fns'

export interface RawDailyStat {
  date: string
  grossSales: number
}

export interface RawDailyStoreStat {
  date: string
  storeId: string
  grossSales: number
}

export interface RawHourlyStat {
  hour: number
  grossSales: number
}

export interface RawHourlyStoreStat {
  hour: number
  storeId: string
  grossSales: number
}

// ── Daily stats (Single-store or aggregated "all") ───────────
async function fetchDailyStats(
  storeId: string | null,
  startDateStr: string,
  endDateStr: string
): Promise<RawDailyStat[]> {
  const supabase = createClient()

  let query = supabase
    .from('daily_store_stats')
    .select('date, total_gross_sales')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true })

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[useGrossTrendData] Error:', error)
    return []
  }

  const dateMap = new Map<string, number>()

  for (const row of (data || []) as any[]) {
    const date = row.date as string
    const gs = Number(row.total_gross_sales || 0)
    const existing = dateMap.get(date) || 0
    dateMap.set(date, existing + gs)
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, grossSales]) => ({ date, grossSales }))
}

// ── Daily stats (Per-store breakdown) ─────────────────────────
async function fetchPerStoreDailyStats(
  startDateStr: string,
  endDateStr: string
): Promise<RawDailyStoreStat[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('daily_store_stats')
    .select('date, store_id, total_gross_sales')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true })

  if (error) {
    console.error('[useGrossTrendData] Per-store error:', error)
    return []
  }

  return ((data || []) as any[]).map((row) => ({
    date: row.date as string,
    storeId: row.store_id as string,
    grossSales: Number(row.total_gross_sales || 0),
  }))
}

// ── Hourly stats (Single-store or aggregated "all") ──────────
async function fetchHourlyStats(
  storeId: string | null,
  targetDateStr: string
): Promise<RawHourlyStat[]> {
  const supabase = createClient()

  const nextDay = format(addDays(new Date(targetDateStr), 1), 'yyyy-MM-dd')

  let query = supabase
    .from('transactions')
    .select('transaction_time, total_price')
    .gte('transaction_time', `${targetDateStr} 00:00:00`)
    .lt('transaction_time', `${nextDay} 00:00:00`)

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[useHourlyGrossTrendData] Error:', error)
    return []
  }

  const hourMap = new Map<number, number>()

  for (const row of (data || []) as any[]) {
    if (!row.transaction_time) continue
    const d = new Date(row.transaction_time)
    const hour = d.getHours()
    const val = Number(row.total_price || 0)
    const existing = hourMap.get(hour) || 0
    hourMap.set(hour, existing + val)
  }

  return Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, grossSales]) => ({ hour, grossSales }))
}

// ── Hourly stats (Per-store breakdown) ───────────────────────
async function fetchPerStoreHourlyStats(
  targetDateStr: string
): Promise<RawHourlyStoreStat[]> {
  const supabase = createClient()

  const nextDay = format(addDays(new Date(targetDateStr), 1), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_time, store_id, total_price')
    .gte('transaction_time', `${targetDateStr} 00:00:00`)
    .lt('transaction_time', `${nextDay} 00:00:00`)

  if (error) {
    console.error('[useMultiStoreHourlyGrossTrendData] Error:', error)
    return []
  }

  const map = new Map<string, number>()

  for (const row of (data || []) as any[]) {
    if (!row.transaction_time || !row.store_id) continue
    const d = new Date(row.transaction_time)
    const hour = d.getHours()
    const sid = row.store_id
    const val = Number(row.total_price || 0)
    const key = `${hour}-${sid}`
    const existing = map.get(key) || 0
    map.set(key, existing + val)
  }

  return Array.from(map.entries())
    .map(([key, grossSales]) => {
      const [hrStr, storeId] = key.split('-')
      return { hour: Number(hrStr), storeId, grossSales }
    })
    .sort((a, b) => a.hour - b.hour)
}

// ── Hooks ───────────────────────────────────────────────────
export function useGrossTrendData(startDateStr: string, endDateStr: string) {
  const { selectedBranch } = useDashboardStore()
  const storeId = selectedBranch === 'all' ? null : selectedBranch

  return useQuery({
    queryKey: ['gross-trend-daily', storeId, startDateStr, endDateStr],
    queryFn: () => fetchDailyStats(storeId, startDateStr, endDateStr),
    enabled: !!selectedBranch && !!startDateStr && !!endDateStr,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMultiStoreGrossTrendData(startDateStr: string, endDateStr: string) {
  return useQuery({
    queryKey: ['gross-trend-daily-per-store', startDateStr, endDateStr],
    queryFn: () => fetchPerStoreDailyStats(startDateStr, endDateStr),
    enabled: !!startDateStr && !!endDateStr,
    staleTime: 5 * 60 * 1000,
  })
}

export function useHourlyGrossTrendData(targetDateStr: string) {
  const { selectedBranch } = useDashboardStore()
  const storeId = selectedBranch === 'all' ? null : selectedBranch

  return useQuery({
    queryKey: ['gross-trend-hourly', storeId, targetDateStr],
    queryFn: () => fetchHourlyStats(storeId, targetDateStr),
    enabled: !!selectedBranch && !!targetDateStr,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMultiStoreHourlyGrossTrendData(targetDateStr: string) {
  return useQuery({
    queryKey: ['gross-trend-hourly-per-store', targetDateStr],
    queryFn: () => fetchPerStoreHourlyStats(targetDateStr),
    enabled: !!targetDateStr,
    staleTime: 5 * 60 * 1000,
  })
}
