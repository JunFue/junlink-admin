'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { StaffDetailsPanel } from './components/StaffDetailsPanel'
import type { Staff, Store } from '@/lib/types/database'
import { StaffTable } from './components/StaffTable'

import { useStaff } from './hooks/useStaff'
import { useStaffStores } from './hooks/useStaffStores'
import type { StaffWithStore } from './services/staffService'

export default function StaffPage() {
  const { data: staff = [], isLoading: staffLoading } = useStaff()
  const { data: stores = [], isLoading: storesLoading } = useStaffStores()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState<string>('')


  const [selectedStaff, setSelectedStaff] = useState<StaffWithStore | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const loading = staffLoading || storesLoading



  const filteredData = useMemo(() => {
    return staff.filter((member) => {
      const matchesStore = !selectedStore || member.store_id === selectedStore
      return matchesStore
    })
  }, [staff, selectedStore])



  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Staff</h1>
        <p className="text-muted-foreground">
          Manage staff enrolled across all stores
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Stores</option>
          {stores.map((store) => (
            <option key={store.store_id} value={store.store_id}>
              {store.store_name}
            </option>
          ))}
          </select>
      </div>

      <StaffTable 
        data={filteredData} 
        searchQuery={searchQuery}
        isLoading={loading}
        onRowClick={(staff) => {
          setSelectedStaff(staff)
          setIsPanelOpen(true)
        }} 
      />

      <StaffDetailsPanel
        staff={selectedStaff}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  )
}
