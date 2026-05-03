export type Granularity = 'day' | 'week' | 'month' | 'year'
export type ChartStyle = 'bar' | 'smooth-line' | 'line-dot' | 'bar-smooth' | 'bar-line-dot'

export interface TrendPoint {
  label: string
  grossSales: number
  year: number
  sortKey: string
  isFuture?: boolean
  chartGross?: number | null
}

// Multi-store data point: { label, sortKey, year, total, isFuture, [storeId]: grossSales, ... }
export interface MultiStoreTrendPoint {
  label: string
  sortKey: string
  year: number
  total: number | null
  isFuture?: boolean
  [key: string]: string | number | boolean | null | undefined
}
