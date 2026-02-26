"use client";

import { useMemo, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Wallet, ArrowUpDown, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";

import { useCashouts, useDeleteCashout } from "@/app/transaction/hooks/useCashouts";
import type { CashoutWithDetails } from "@/app/transaction/services/cashoutsService";
import CashoutsChart from "./CashoutsChart";

const columnHelper = createColumnHelper<CashoutWithDetails>();

interface CashoutsViewProps {
  searchQuery: string;
  selectedStore: string;
  dateRange: string;
  subcategoryFilter: string;
}

export default function CashoutsView({
  searchQuery,
  selectedStore,
  dateRange,
  subcategoryFilter,
}: CashoutsViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // The hook internal handles the subcategory logic locally if provided
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCashouts(dateRange, selectedStore, subcategoryFilter);
  const deleteCashoutMutation = useDeleteCashout();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const cashouts = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this cashout record?")) {
      deleteCashoutMutation.mutate(id);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("transaction_date", {
        header: ({ column }) => (
          <div
            className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date <ArrowUpDown className="w-3 h-3" />
          </div>
        ),
        cell: (info) => (
          <span className="text-sm text-foreground font-medium">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("stores", {
        id: "store_name",
        header: "Store",
        cell: (info) => (
           <span className="text-sm text-muted-foreground whitespace-nowrap">
            {info.getValue()?.store_name || "Unknown Store"}
          </span>
        ),
      }),
      columnHelper.accessor("cashout_type", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue() || "UNKNOWN";
          return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              type === 'OPEX' ? 'bg-blue-500/10 text-blue-500' :
              type === 'COGS' ? 'bg-orange-500/10 text-orange-500' :
              'bg-purple-500/10 text-purple-500'
            }`}>
              {type}
            </span>
          );
        },
      }),
      columnHelper.accessor("classification", {
        id: "subcategory",
        header: "Subcategory",
        cell: (info) => {
          const cashout = info.row.original;
          const name = cashout.cashout_type === 'OPEX' 
            ? cashout.classification?.name 
            : cashout.cashout_type === 'REMITTANCE'
            ? cashout.remittance_categories?.name
            : "-";
          return (
            <span className="text-sm text-muted-foreground">
              {name || "-"}
            </span>
          );
        },
      }),
      columnHelper.accessor("receipt_no", {
        header: "Receipt / Ref",
        cell: (info) => (
          <span className="text-sm text-muted-foreground font-mono">
            {info.getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("amount", {
        header: ({ column }) => (
          <div
            className="flex items-center justify-end gap-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount <ArrowUpDown className="w-3 h-3" />
          </div>
        ),
        cell: (info) => (
          <div className="text-sm font-medium text-destructive text-right whitespace-nowrap">
             {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor("users", {
        id: "logged_by",
        header: "Logged By",
        cell: (info) => {
          const user = info.getValue();
          const name = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown';
          return (
            <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
              {name || 'Unknown'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <div className="flex justify-end gap-2">
             <button
                onClick={() => handleDelete(info.row.original.id)}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: cashouts,
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
      const tx = row.original;
      const search = filterValue.toLowerCase();
      const subCat = tx.classification?.name || tx.remittance_categories?.name || "";
      const user = `${tx.users?.first_name || ''} ${tx.users?.last_name || ''}`;
      
      return !!(
        tx.cashout_type?.toLowerCase().includes(search) ||
        tx.receipt_no?.toLowerCase().includes(search) ||
        tx.notes?.toLowerCase().includes(search) ||
        subCat.toLowerCase().includes(search) ||
        user.toLowerCase().includes(search) ||
        tx.stores?.store_name?.toLowerCase().includes(search)
      );
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CashoutsChart cashouts={cashouts} />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                   {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-4">
                         <div className={`h-4 rounded animate-shimmer ${colIdx === 5 ? 'w-16 ml-auto' : 'w-24'}`} />
                      </td>
                   ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-foreground">
                    No cashouts found
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters to see more results.
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="h-4 flex items-center justify-center py-6">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading more...
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
