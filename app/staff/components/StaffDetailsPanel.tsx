import { X, Loader2, Shield } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import type { StaffWithStore } from '../services/staffService'
import { useStaffPermissions } from '../hooks/useStaffPermissions'
import { useUpdateStaffPermissions } from '../hooks/useUpdateStaffPermissions'
import type { StaffPermissions } from '@/lib/types/database'

interface StaffDetailsPanelProps {
  staff: StaffWithStore | null
  onClose: () => void
  isOpen: boolean
}

const PERMISSIONS_CONFIG = [
  { key: 'can_backdate', label: 'Backdate Transactions', description: 'Allow changing the date of transactions.' },
  { key: 'can_edit_price', label: 'Edit Prices', description: 'Allow overriding the default price at checkout.' },
  { key: 'can_edit_transaction', label: 'Edit Transactions', description: 'Allow editing existing transactions.' },
  { key: 'can_delete_transaction', label: 'Delete Transactions', description: 'Allow voiding or deleting transactions.' },
  { key: 'can_manage_items', label: 'Manage Items', description: 'Allow creating, editing, and deleting inventory items.' },
  { key: 'can_manage_categories', label: 'Manage Categories', description: 'Allow managing product categories.' },
  { key: 'can_manage_customers', label: 'Manage Customers', description: 'Allow creating and editing customer profiles.' },
  { key: 'can_manage_expenses', label: 'Manage Expenses', description: 'Allow adding and editing cash expenses.' },
] as const

export function StaffDetailsPanel({ staff, onClose, isOpen }: StaffDetailsPanelProps) {
  const { data: permissions, isLoading: isLoadingPermissions } = useStaffPermissions(staff?.user_id)
  const { mutate: updatePermissions, isPending: isUpdating } = useUpdateStaffPermissions()

  // Prevent page scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleToggle = (key: keyof Omit<StaffPermissions, 'id' | 'user_id' | 'created_at'>, currentValue: boolean) => {
    if (!staff) return
    updatePermissions({
      userId: staff.user_id,
      updates: { [key]: !currentValue },
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )} 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Staff Details</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {staff ? (
          <div className="flex-1 overflow-y-auto">
            {/* Profile Header */}
            <div className="p-6 flex flex-col items-center border-b border-border bg-muted/20">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-semibold mb-4">
                {staff.first_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {`${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown Staff'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{staff.email || 'No email'}</p>
              
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {staff.stores?.store_name || 'Unassigned Store'}
                </span>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-foreground border border-accent/20">
                  {staff.role || 'Staff'}
                </span>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Permissions</h3>
              </div>

              {isLoadingPermissions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {PERMISSIONS_CONFIG.map(({ key, label, description }) => {
                    // Default to false if permissions object is null (meaning no record exists yet)
                    const isGranted = permissions?.[key as keyof typeof permissions] === true
                    
                    return (
                      <div key={key} className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <label 
                            htmlFor={`perm-${key}`} 
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            {label}
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {description}
                          </p>
                        </div>
                        <button
                          id={`perm-${key}`}
                          role="switch"
                          aria-checked={isGranted}
                          disabled={isUpdating}
                          onClick={() => handleToggle(key as keyof typeof permissions, isGranted)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-colors",
                            isGranted ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                              isGranted ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-6">
            No staff member selected.
          </div>
        )}
      </div>
    </>
  )
}
