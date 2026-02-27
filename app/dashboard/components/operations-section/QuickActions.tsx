import Link from 'next/link'
import {
  ShoppingCart,
  FileText,
  PackagePlus,
  Banknote,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '../../../stores/dashboardStore'
import { useStores } from '@/app/stores/hooks/useStores'
import { generatePDFReport } from '../../services/reportService'

type ActionItem = {
  name: string
  description: string
  href?: string
  action?: () => void
  icon: any
  primary: boolean
  color: string
}

export function QuickActions() {
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()
  const { dateRange, selectedBranch } = useDashboardStore()
  const { data: stores } = useStores()

  const allBranches = [
    { id: 'all', name: 'All Stores' },
    ...(stores?.map((s: any) => ({ id: s.store_id, name: s.store_name })) || []),
  ]
  const branchLabel = allBranches.find((b) => b.id === selectedBranch)?.name ?? 'All Stores'

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await generatePDFReport(
        supabase,
        selectedBranch,
        branchLabel,
        dateRange.from,
        dateRange.to
      )
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const actions: ActionItem[] = [
    {
      name: 'New Sale',
      description: 'Start a transaction',
      href: '/transaction',
      icon: ShoppingCart,
      primary: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    {
      name: 'Export PDF',
      description: 'Download report',
      action: handleExport,
      icon: Download,
      primary: false,
      color: 'bg-card border border-border text-foreground hover:bg-accent',
    },
    {
      name: 'Log Expense',
      description: 'Record an expense',
      href: '/transaction?tab=expenses',
      icon: FileText,
      primary: false,
      color: 'bg-card border border-border text-foreground hover:bg-accent',
    },
    {
      name: 'Add Inventory',
      description: 'Restock items',
      href: '/stores?tab=inventory',
      icon: PackagePlus,
      primary: false,
      color: 'bg-card border border-border text-foreground hover:bg-accent',
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const content = (
            <>
              <action.icon
                className={cn(
                  'h-5 w-5 transition-transform group-hover:scale-110',
                  action.primary ? 'text-primary-foreground' : 'text-muted-foreground',
                  isExporting && action.name === 'Export PDF' && 'animate-bounce text-primary'
                )}
              />
              <div>
                <p className="text-sm font-semibold">{action.name}</p>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    action.primary
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {isExporting && action.name === 'Export PDF' ? 'Generating...' : action.description}
                </p>
              </div>
            </>
          )

          const className = cn(
            'flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed',
            action.color,
            action.primary && 'col-span-2 sm:col-span-1 shadow-md'
          )

          if (action.action) {
            return (
              <button
                key={action.name}
                type="button"
                onClick={action.action}
                disabled={isExporting && action.name === 'Export PDF'}
                className={className}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={action.name}
              href={action.href!}
              className={className}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
