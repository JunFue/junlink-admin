'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings as SettingsIcon, Shield, FileText, UserCog, Tag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const settingsNav = [
  { name: 'General', href: '/settings', icon: SettingsIcon },
  { name: 'Account Settings', href: '/settings/account', icon: UserCog },
  { name: 'Expense Categories', href: '/settings/classifications', icon: Tag },
  { name: 'System Config', href: '/settings/system', icon: Shield },
  { name: 'Audit Logs', href: '/settings/audit', icon: FileText },
]

export default function SettingsPage() {
  const pathname = usePathname()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and system preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <nav className="space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">General Settings</h2>
            
            {/* Profile Section */}
            <div className="space-y-6">
              <div className="flex items-start gap-6 pb-6 border-b border-border">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  A
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a new avatar or remove the current one
                  </p>
                  <div className="flex gap-3">
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                      Upload New
                    </button>
                    <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    defaultValue="JunLink POS"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@junlink.com"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Timezone
                </label>
                <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Asia/Manila (GMT+8)</option>
                  <option>Asia/Singapore (GMT+8)</option>
                  <option>America/New_York (GMT-5)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Default Currency
                </label>
                <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>PHP - Philippine Peso</option>
                  <option>USD - US Dollar</option>
                  <option>SGD - Singapore Dollar</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
