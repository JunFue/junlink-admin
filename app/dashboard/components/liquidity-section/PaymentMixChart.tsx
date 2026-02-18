'use client'

import { PAYMENT_MIX } from '../../data'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CreditCard } from 'lucide-react'
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics'
import { useEffect, useState } from 'react'

export function PaymentMixChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-40 w-40 rounded-full border-8 border-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Payment Method Mix
          </h3>
          <p className="text-lg font-semibold text-foreground">Distribution</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Donut Chart */}
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PAYMENT_MIX}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {PAYMENT_MIX.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                }}
                formatter={(value: number | string | undefined) =>
                  value !== undefined ? [`${value}%`, ''] : ['', '']
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {PAYMENT_MIX.map((method) => (
            <div key={method.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: method.color }}
              />
              <span className="text-sm text-foreground">{method.name}</span>
              <span className="text-sm font-semibold text-foreground ml-auto">
                {method.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
