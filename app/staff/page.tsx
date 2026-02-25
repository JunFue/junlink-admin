'use client'

import { useState, useMemo } from 'react'
import { Search, Users, MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import { StaffDetailsPanel } from './components/StaffDetailsPanel'
import type { Staff, Store } from '@/lib/types/database'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'


const columnHelper = createColumnHelper<StaffWithStore>()

import { useStaff } from './hooks/useStaff'
import { useStaffStores } from './hooks/useStaffStores'
import type { StaffWithStore } from './services/staffService'

export default function StaffPage() {
  const { data: staff = [], isLoading: staffLoading } = useStaff()
  const { data: stores = [], isLoading: storesLoading } = useStaffStores()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [sorting, setSorting] = useState<SortingState>([])

  const [selectedStaff, setSelectedStaff] = useState<StaffWithStore | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const loading = staffLoading || storesLoading

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
        id: 'name',
        header: ({ column }) => (
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Staff <ArrowUpDown className="w-3 h-3" />
          </div>
        ),
        cell: (info) => {
          const member = info.row.original
          return (
            <button 
              onClick={() => {
                setSelectedStaff(member)
                setIsPanelOpen(true)
              }} 
              className="flex items-center gap-3 group text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shrink-0">
                {member.first_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown'}
              </span>
            </button>
          )
        },
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.stores?.store_name, {
        id: 'store_name',
        header: 'Store',
        cell: (info) => (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {info.getValue() || 'Unassigned'}
          </span>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue() || 'Staff'}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: () => (
          <div className="text-right">
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        ),
      }),
    ],
    []
  )

  const filteredData = useMemo(() => {
    return staff.filter((member) => {
      const matchesStore = !selectedStore || member.store_id === selectedStore
      return matchesStore
    })
  }, [staff, selectedStore])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const member = row.original
      const search = filterValue.toLowerCase()
      return !!(
        member.first_name?.toLowerCase().includes(search) ||
        member.last_name?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search)
      )
    },
  })

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

      {/* Staff Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full animate-shimmer" />
                        <div className="h-4 w-32 rounded animate-shimmer" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-40 rounded animate-shimmer" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded animate-shimmer" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded animate-shimmer" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-8 rounded animate-shimmer ml-auto" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground">No staff found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StaffDetailsPanel
        staff={selectedStaff}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  )
}
