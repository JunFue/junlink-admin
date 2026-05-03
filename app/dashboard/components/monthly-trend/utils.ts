import { format, addDays } from 'date-fns'
import {
  type RawDailyStat,
  type RawDailyStoreStat,
  type RawHourlyStat,
  type RawHourlyStoreStat,
} from '../../hooks/useGrossTrendData'
import {
  type TrendPoint,
  type MultiStoreTrendPoint,
} from './types'
import { DAYS_OF_WEEK, SHORT_MONTHS } from './constants'

// ── Aggregation helpers (Fixed Windows) ────────────

// DAY (24 hours)
export function aggregateHourly(raw: RawHourlyStat[]): TrendPoint[] {
  const map = new Map(raw.map(r => [r.hour, r.grossSales]))
  const points: TrendPoint[] = []

  for (let h = 0; h < 24; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr12 = h % 12 === 0 ? 12 : h % 12
    points.push({
      label: `${hr12}${ampm}`,
      sortKey: String(h).padStart(2, '0'),
      year: 0, // not used for day
      grossSales: map.get(h) || 0,
    })
  }
  return points
}

export function aggregateMultiStoreHourly(raw: RawHourlyStoreStat[], storeIds: string[]): MultiStoreTrendPoint[] {
  const map = new Map<number, Map<string, number>>()
  for (const r of raw) {
    if (!map.has(r.hour)) map.set(r.hour, new Map())
    map.get(r.hour)!.set(r.storeId, r.grossSales)
  }

  const points: MultiStoreTrendPoint[] = []
  for (let h = 0; h < 24; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr12 = h % 12 === 0 ? 12 : h % 12
    const pt: MultiStoreTrendPoint = {
      label: `${hr12}${ampm}`,
      sortKey: String(h).padStart(2, '0'),
      year: 0,
      total: 0,
    }
    const hrMap = map.get(h)
    for (const sid of storeIds) {
      const val = hrMap?.get(sid) || 0
      pt[sid] = val
      pt.total = (pt.total as number) + val
    }
    points.push(pt)
  }
  return points
}

// WEEK (Sun-Sat)
export function aggregateWeekly(raw: RawDailyStat[], startD: Date): TrendPoint[] {
  const map = new Map(raw.map(r => [r.date, r.grossSales]))
  const points: TrendPoint[] = []
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  for (let i = 0; i < 7; i++) {
    const d = addDays(startD, i)
    const dStr = format(d, 'yyyy-MM-dd')
    points.push({
      label: DAYS_OF_WEEK[i],
      sortKey: dStr,
      year: d.getFullYear(),
      grossSales: map.get(dStr) || 0,
      isFuture: dStr > todayStr,
    })
  }
  return points
}

export function aggregateMultiStoreWeekly(raw: RawDailyStoreStat[], startD: Date, storeIds: string[]): MultiStoreTrendPoint[] {
  const map = new Map<string, Map<string, number>>()
  for (const r of raw) {
    if (!map.has(r.date)) map.set(r.date, new Map())
    map.get(r.date)!.set(r.storeId, r.grossSales)
  }
  
  const points: MultiStoreTrendPoint[] = []
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  for (let i = 0; i < 7; i++) {
    const d = addDays(startD, i)
    const dStr = format(d, 'yyyy-MM-dd')
    const pt: MultiStoreTrendPoint = {
      label: DAYS_OF_WEEK[i],
      sortKey: dStr,
      year: d.getFullYear(),
      total: 0,
      isFuture: dStr > todayStr,
    }
    const dayMap = map.get(dStr)
    for (const sid of storeIds) {
      const val = dayMap?.get(sid) || 0
      pt[sid] = val
      pt.total = (pt.total as number) + val
    }
    points.push(pt)
  }
  return points
}

// MONTH (Jan-Dec)
export function aggregateMonthly(raw: RawDailyStat[], targetYear: number): TrendPoint[] {
  const map = new Map<number, number>()
  for (const r of raw) {
    const monthIdx = new Date(r.date + 'T00:00:00').getMonth()
    map.set(monthIdx, (map.get(monthIdx) || 0) + r.grossSales)
  }

  const points: TrendPoint[] = []
  const now = new Date()
  const isCurrentYear = targetYear === now.getFullYear()
  const currentMonthIdx = now.getMonth()

  for (let i = 0; i < 12; i++) {
    points.push({
      label: SHORT_MONTHS[i],
      sortKey: String(i).padStart(2, '0'),
      year: targetYear,
      grossSales: map.get(i) || 0,
      isFuture: isCurrentYear && i > currentMonthIdx,
    })
  }
  return points
}

export function aggregateMultiStoreMonthly(raw: RawDailyStoreStat[], targetYear: number, storeIds: string[]): MultiStoreTrendPoint[] {
  const map = new Map<number, Map<string, number>>()
  for (const r of raw) {
    const monthIdx = new Date(r.date + 'T00:00:00').getMonth()
    if (!map.has(monthIdx)) map.set(monthIdx, new Map())
    const mMap = map.get(monthIdx)!
    mMap.set(r.storeId, (mMap.get(r.storeId) || 0) + r.grossSales)
  }

  const points: MultiStoreTrendPoint[] = []
  const now = new Date()
  const isCurrentYear = targetYear === now.getFullYear()
  const currentMonthIdx = now.getMonth()

  for (let i = 0; i < 12; i++) {
    const pt: MultiStoreTrendPoint = {
      label: SHORT_MONTHS[i],
      sortKey: String(i).padStart(2, '0'),
      year: targetYear,
      total: 0,
      isFuture: isCurrentYear && i > currentMonthIdx,
    }
    const mMap = map.get(i)
    for (const sid of storeIds) {
      const val = mMap?.get(sid) || 0
      pt[sid] = val
      pt.total = (pt.total as number) + val
    }
    points.push(pt)
  }
  return points
}

// YEAR (7 years ending at targetYear)
export function aggregateYearly(raw: RawDailyStat[], targetYear: number): TrendPoint[] {
  const map = new Map<number, number>()
  for (const r of raw) {
    const yr = new Date(r.date + 'T00:00:00').getFullYear()
    map.set(yr, (map.get(yr) || 0) + r.grossSales)
  }

  const points: TrendPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const yr = targetYear - i
    points.push({
      label: String(yr),
      sortKey: String(yr),
      year: yr,
      grossSales: map.get(yr) || 0,
    })
  }
  return points
}

export function aggregateMultiStoreYearly(raw: RawDailyStoreStat[], targetYear: number, storeIds: string[]): MultiStoreTrendPoint[] {
  const map = new Map<number, Map<string, number>>()
  for (const r of raw) {
    const yr = new Date(r.date + 'T00:00:00').getFullYear()
    if (!map.has(yr)) map.set(yr, new Map())
    const yMap = map.get(yr)!
    yMap.set(r.storeId, (yMap.get(r.storeId) || 0) + r.grossSales)
  }

  const points: MultiStoreTrendPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const yr = targetYear - i
    const pt: MultiStoreTrendPoint = {
      label: String(yr),
      sortKey: String(yr),
      year: yr,
      total: 0,
    }
    const yMap = map.get(yr)
    for (const sid of storeIds) {
      const val = yMap?.get(sid) || 0
      pt[sid] = val
      pt.total = (pt.total as number) + val
    }
    points.push(pt)
  }
  return points
}
