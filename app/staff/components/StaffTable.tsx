import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { Users, MoreHorizontal, ArrowUpDown, UserMinus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { StaffWithStore } from '../services/staffService'
import { useRemoveStaff } from '../hooks/useRemoveStaff'

interface StaffTableProps {
  data: StaffWithStore[]
  isLoading: boolean
  searchQuery: string
  onRowClick: (staff: StaffWithStore) => void
}

export function StaffTable({ data, isLoading, searchQuery, onRowClick }: StaffTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { mutate: removeStaff, isPending: isRemoving } = useRemoveStaff()
  const [removingId, setRemovingId] = useState<string | null>(null)
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const handleRemoveStaff = (e: React.MouseEvent, staff: StaffWithStore) => {
    e.stopPropagation()
    setOpenDropdownId(null)
    
    if (confirm(`Are you sure you want to remove ${staff.first_name || 'this staff member'} from the store?`)) {
      setRemovingId(staff.user_id)
      removeStaff(staff.user_id, {
        onSettled: () => setRemovingId(null)
      })
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorFn: (row: StaffWithStore) => `${row.first_name} ${row.last_name}`,
        id: 'name',
        header: ({ column }: any) => (
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Staff <ArrowUpDown className="w-3 h-3" />
          </div>
        ),
        cell: (info: any) => {
          const member = info.row.original
          return (
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shrink-0">
                {member.first_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {`${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown'}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info: any) => <span className="text-sm text-muted-foreground">{info.getValue() || '-'}</span>,
      },
      {
        accessorFn: (row: StaffWithStore) => row.stores?.store_name,
        id: 'store_name',
        header: 'Store',
        cell: (info: any) => (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {info.getValue() || 'Unassigned'}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info: any) => <span className="text-sm text-muted-foreground">{info.getValue() || 'Staff'}</span>,
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: (info: any) => {
          const member = info.row.original
          const isOpen = openDropdownId === member.user_id
          const isRemovingThis = removingId === member.user_id
          
          return (
            <div className="text-right flex justify-end relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenDropdownId(isOpen ? null : member.user_id)
                }}
                disabled={isRemovingThis}
                className={cn(
                  "rounded-lg p-2 text-muted-foreground transition-colors",
                  isOpen ? "bg-accent text-foreground" : "hover:bg-accent hover:text-foreground",
                  isRemovingThis && "opacity-50 cursor-not-allowed"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              
              {isOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdownId(null)
                    }} 
                  />
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenDropdownId(null)
                          onRowClick(member)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        View Profile
                      </button>
                      
                      {member.store_id && member.role !== 'owner' && (
                        <button
                          onClick={(e) => handleRemoveStaff(e, member)}
                          className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          Kick Out
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [openDropdownId, removingId]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
    },
    onSortingChange: setSorting,
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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto min-h-[400px]">
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
          <tbody className="divide-y divide-border relative">
            {isLoading ? (
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
                <tr 
                  key={row.id} 
                  className={cn(
                    "hover:bg-muted/50 transition-colors cursor-pointer group",
                    openDropdownId === row.original.user_id && "bg-muted/50"
                  )}
                  onClick={() => onRowClick(row.original)}
                >
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
  )
}
