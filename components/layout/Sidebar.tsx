'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Receipt, 
  Sparkles, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useUIStore } from '@/app/dashboard/stores/uiStore'
import { cn } from '@/lib/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Transactions', href: '/transaction', icon: Receipt },
  { name: 'Jun Fue AI', href: '/junfue-ai', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <>
      {/* Backdrop for handling clicks outside when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-12 lg:w-20' : 'w-64'
        )}
      >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3 lg:px-4">
        <Link href="/dashboard" className="flex items-center gap-2 lg:gap-3">
          <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-xl">
            <Logo className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold text-foreground animate-fade-in truncate">
              JunLink
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                sidebarCollapsed && 'justify-center lg:px-2'
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                'h-5 w-5 shrink-0 transition-transform duration-200',
                !isActive && 'group-hover:scale-110'
              )} />
              {!sidebarCollapsed && (
                <span className="animate-fade-in">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-accent z-50",
          sidebarCollapsed && "lg:-right-3"
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </aside>
    </>
  )
}
