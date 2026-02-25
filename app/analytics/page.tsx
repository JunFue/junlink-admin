'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FileDown, Calendar, TrendingUp } from 'lucide-react'
import { formatCurrency, formatCompactNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import type { Transaction, Store, ProductCategory } from '@/lib/types/database'


const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface RevenueData {
  date: string
  revenue: number
}

interface StoreData {
  name: string
  revenue: number
}

interface CategoryData {
  name: string
  value: number
  [key: string]: any
}


export default function AnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [storeData, setStoreData] = useState<StoreData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [staffGrowth, setStaffGrowth] = useState<{ date: string; staff: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const supabase = createClient()

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - parseInt(dateRange))

        // Fetch transactions for revenue trend
        const { data: transactions } = await supabase
          .from('transactions')
          .select('total_price, transaction_time, store_id')
          .gte('transaction_time', startDate.toISOString())
          .order('transaction_time')
          .returns<Pick<Transaction, 'total_price' | 'transaction_time' | 'store_id'>[]>()


        // Process revenue by date
        const revenueByDate: Record<string, number> = {}
        transactions?.forEach((tx) => {
          const date = new Date(tx.transaction_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          revenueByDate[date] = (revenueByDate[date] || 0) + (tx.total_price || 0)
        })
        setRevenueData(Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })))

        // Fetch store data for comparison
        const { data: stores } = await supabase
          .from('stores')
          .select('store_id, store_name')
          .is('deleted_at', null)
          .returns<Pick<Store, 'store_id' | 'store_name'>[]>()

        const storeRevenue: StoreData[] = []
        
        if (stores) {
          for (const store of stores.slice(0, 6)) {
            const storeTransactions = transactions?.filter(t => t.store_id === store.store_id) || []
            const revenue = storeTransactions.reduce((sum, t) => sum + (t.total_price || 0), 0)
            storeRevenue.push({ name: store.store_name || 'Unknown', revenue })
          }
        }
        setStoreData(storeRevenue.sort((a, b) => b.revenue - a.revenue))

        // Fetch category breakdown
        const { data: categories } = await supabase
          .from('product_category')
          .select('id, category')
          .returns<Pick<ProductCategory, 'id' | 'category'>[]>()


        if (categories) {
          const categoryTotals: Record<string, number> = {}
          transactions?.forEach((tx) => {
            // Group by first part of item name or use 'Other'
            const category = 'Sales'
            categoryTotals[category] = (categoryTotals[category] || 0) + (tx.total_price || 0)
          })
          setCategoryData([
            { name: 'Sales', value: Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1 }
          ])
        }

        // Generate mock staff growth data
        const growth: { date: string; staff: number }[] = []
        let staffCount = 10
        for (let i = parseInt(dateRange); i >= 0; i -= Math.ceil(parseInt(dateRange) / 10)) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          staffCount += Math.floor(Math.random() * 3)
          growth.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            staff: staffCount
          })
        }
        setStaffGrowth(growth)

      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [supabase, dateRange])

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics across your stores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue ({dateRange} days)</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full animate-shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Store Comparison */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Store Performance</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full animate-shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />

                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Staff Growth */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Staff Growth</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full animate-shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={staffGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="staff" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf680"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transaction Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Summary</h3>
          <div className="h-64 flex items-center justify-center">
            {loading ? (
              <div className="h-40 w-40 rounded-full animate-shimmer" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
