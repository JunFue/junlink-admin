"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Search, Loader2 } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onClear?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  updateData: (id: string, values: any) => Promise<boolean>;
  isUpdating?: boolean;
}

export function CashOutTable<TData, TValue>({
  columns,
  data,
  onClear,
  onLoadMore,
  hasMore,
  isLoadingMore,
  updateData,
  isUpdating,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    meta: {
      editingRowId,
      setEditingRowId,
      updateData,
      isUpdating
    },
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoadingMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: element.parentElement, // Use the scrollable container as root
      rootMargin: "200px",
      threshold: 0.1,
    });

    observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  return (
    <div className="border border-border rounded-xl shadow-sm bg-card flex flex-col overflow-hidden">
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] relative scrollbar-thin scrollbar-thumb-muted-foreground/20">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/95 backdrop-blur-md text-muted-foreground font-medium border-b border-border sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 transition-colors group"
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
            ) : (
                <tr>
                    <td colSpan={columns.length} className="text-center py-16">
                        <div className="flex flex-col items-center text-muted-foreground">
                            <div className="bg-muted p-4 rounded-full mb-3">
                                <Search size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium">No cashout records found</p>
                            <p className="text-xs mt-1 text-muted-foreground/70">Transactions will appear here once recorded</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        
        {/* Sentinel for Infinite Scroll */}
        <div ref={observerTarget} className="h-4 w-full bg-transparent" />
        
        {/* Loading Indicator Overlay */}
        {isLoadingMore && (
           <div className="p-4 flex justify-center items-center gap-2 text-primary font-medium bg-card/80 backdrop-blur-sm sticky bottom-0 border-t border-border z-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Loading more records...</span>
           </div>
        )}
      </div>
    </div>
  );
}
