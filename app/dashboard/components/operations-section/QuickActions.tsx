import Link from 'next/link'
import {
  ShoppingCart,
  FileText,
  PackagePlus,
  Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const actions = [
  {
    name: 'New Sale',
    description: 'Start a transaction',
    href: '/transaction',
    icon: ShoppingCart,
    primary: true,
    color: 'bg-primary text-primary-foreground hover:bg-primary/90',
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
  {
    name: 'Record Payout',
    description: 'Owner withdrawal',
    href: '/transaction?tab=payouts',
    icon: Banknote,
    primary: false,
    color: 'bg-card border border-border text-foreground hover:bg-accent',
  },
]

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all group',
              action.color,
              action.primary && 'col-span-2 sm:col-span-1 shadow-md'
            )}
          >
            <action.icon
              className={cn(
                'h-5 w-5 transition-transform group-hover:scale-110',
                action.primary ? 'text-primary-foreground' : 'text-muted-foreground'
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
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
