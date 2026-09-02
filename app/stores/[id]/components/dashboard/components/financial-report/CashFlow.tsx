"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import { Filter, Loader2, Download, ChevronDown } from "lucide-react";
import { StandardSelect } from "@/app/stores/[id]/components/shared/components/reusables/StandardSelect";
import {
  fetchCashFlowLedger,
  fetchFlowCategories,
} from "@/app/stores/[id]/components/cashout-records/lib/cashflow.api";
import { CashFlowEntry } from "../../lib/types";

interface CashFlowProps {
  storeId: string;
  startDate: string;
  endDate: string;
}

export function CashFlow({ storeId, startDate, endDate }: CashFlowProps) {
  // --- State Management ---
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // --- 1. Fetch Categories ---
  const { data: categories = [] } = useQuery({
    queryKey: ["flow-categories", storeId],
    queryFn: () => fetchFlowCategories(storeId),
  });

  // --- Derived State ---
  // Default to "Overall" or the first available category if nothing is selected
  const activeCategory =
    selectedCategory || (categories.length > 0 ? categories[0] : "Overall");

  // Construct the range object expected by the API
  const dateRangeParam = useMemo(
    () => ({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  // --- 2. Fetch Ledger Data ---
  const { data: ledger = [], isLoading } = useQuery({
    queryKey: ["cash-flow-ledger", storeId, activeCategory, dateRangeParam],
    queryFn: () => fetchCashFlowLedger(storeId, activeCategory, dateRangeParam),
    enabled: !!activeCategory,
  });

  // --- 3. Table Column Definitions ---
  const columns = useMemo<ColumnDef<CashFlowEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date", // Simple header, filter is now handled globally
        cell: (info) => (
          <span>
            {new Date(info.getValue() as string).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "forwarded",
        header: "Forwarded",
        cell: (info) => (
          <div className="font-mono text-slate-400 text-right">
            ₱
            {(info.getValue() as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
      {
        accessorKey: "cash_in",
        header: "Cash In",
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <div className="font-mono text-green-400 text-right">
              {val > 0
                ? `+₱${val.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`
                : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "cash_out",
        header: "Cash Out",
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <div className="font-mono text-red-400 text-right">
              {val > 0
                ? `-₱${val.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`
                : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Balance",
        cell: (info) => (
          <div className="bg-slate-800/50 py-1 rounded font-mono font-bold text-white text-right">
            ₱
            {(info.getValue() as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
    ],
    [] // No dependencies needed here anymore
  );

  // --- 4. Table Instance ---
  const table = useReactTable({
    data: ledger,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* --- Controls Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-card/50 p-4 border border-border rounded-xl backdrop-blur-sm">
        {/* Left: Filters */}
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Category Dropdown */}
          <StandardSelect
            ref={null}
            label="Category"
            value={activeCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            containerClassName="w-full md:w-48"
          >
            {categories.length === 0 && <option className="bg-background">Loading...</option>}
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-background">
                {cat}
              </option>
            ))}
          </StandardSelect>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-4 py-2 border border-border rounded-lg font-medium text-foreground text-sm transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header */}
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-border border-b-2"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
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

            {/* Body */}
            <tbody className="bg-card/30 text-foreground">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <Loader2 className="mx-auto w-6 h-6 text-emerald-500 animate-spin" />
                  </td>
                </tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 border-border border-b transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
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
                  <td
                    colSpan={columns.length}
                    className="h-24 text-slate-500 text-center"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

