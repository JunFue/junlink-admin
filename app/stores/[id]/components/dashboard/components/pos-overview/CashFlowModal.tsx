"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { X, Filter, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import { StandardSelect } from "@/app/stores/[id]/components/shared/components/reusables/StandardSelect";
import dayjs from "dayjs";
import {
  fetchCashFlowLedger,
  fetchFlowCategories,
} from "@/app/stores/[id]/components/cashout-records/lib/cashflow.api";
import { CashFlowEntry } from "../../lib/types";
import { DateColumnFilter } from "@/app/stores/[id]/components/cashout-records/components/shared/DateColumnFilter";

interface CashFlowModalProps {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
  isMultiDrawer?: boolean;
}

export function CashFlowModal({ storeId, isOpen, onClose, isMultiDrawer = false }: CashFlowModalProps) {
  // --- Filter State ---
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [startDate, setStartDate] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // --- 1. Fetch Categories (only in multi-drawer mode) ---
  const { data: categories = [] } = useQuery({
    queryKey: ["flow-categories", storeId],
    queryFn: () => fetchFlowCategories(storeId),
    enabled: isOpen && isMultiDrawer,
  });

  // --- Derived State ---
  const activeCategory = isMultiDrawer
    ? (selectedCategory || (categories.length > 0 ? categories[0] : "Overall"))
    : "Overall";

  const dateRangeParam = useMemo(
    () => ({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  // --- 2. Fetch Ledger Data ---
  const { data: ledger = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["cash-flow-modal-ledger", storeId, activeCategory, dateRangeParam],
    queryFn: async () => {
      const data = await fetchCashFlowLedger(storeId, activeCategory, dateRangeParam);
      setLastUpdated(new Date());
      return data;
    },
    enabled: isOpen && !!activeCategory,
    staleTime: 0, // Ensure fresh data on every fetch
    refetchOnWindowFocus: true,
  });

  // --- 3. Table Column Definitions ---
  const columns = useMemo<ColumnDef<CashFlowEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => (
          <span className="whitespace-nowrap">
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
        header: "Forwarded Balance",
        cell: (info) => (
          <div className="font-mono text-muted-foreground text-right">
            â‚±
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
            <div className="font-mono text-emerald-500 text-right">
              {val > 0
                ? `+â‚±${val.toLocaleString(undefined, {
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
                ? `-â‚±${val.toLocaleString(undefined, {
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
          <div className="bg-muted/50 py-1 px-2 rounded font-mono font-bold text-foreground text-right">
            â‚±
            {(info.getValue() as number).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        ),
      },
    ],
    []
  );

  // --- 4. Table Instance ---
  const table = useReactTable({
    data: ledger,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // --- Summary Row ---
  const totals = useMemo(() => {
    if (ledger.length === 0) return null;
    return {
      cashIn: ledger.reduce((sum, row) => sum + (row.cash_in || 0), 0),
      cashOut: ledger.reduce((sum, row) => sum + (row.cash_out || 0), 0),
      endingBalance: ledger[ledger.length - 1]?.balance || 0,
      openingBalance: ledger[0]?.forwarded || 0,
    };
  }, [ledger]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="flex justify-between items-center p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Cash Flow Ledger
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">
                {startDate && endDate
                  ? `${dayjs(startDate).format("MMM D")} â€“ ${dayjs(endDate).format("MMM D, YYYY")}`
                  : "All time"}
                {" Â· "}
                <span className="font-medium text-foreground/80">
                  {activeCategory}
                </span>
              </p>
              {lastUpdated && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Live: {dayjs(lastUpdated).format("HH:mm:ss")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- Filter Bar --- */}
        <div className="flex flex-wrap items-end gap-4 px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          {/* Category Dropdown â€” only in multi-drawer mode */}
          {isMultiDrawer && (
              <StandardSelect
                value={activeCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
                containerClassName="w-full md:w-48"
                className="py-2 h-10"
              >
                {categories.length === 0 && <option className="bg-background">Loading...</option>}
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-background">
                    {cat}
                  </option>
                ))}
              </StandardSelect>
          )}

          {/* Date Range */}
          <DateColumnFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            align="end"
          />
        </div>

        {/* --- Summary Cards --- */}
        {totals && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-3 border-b border-border shrink-0">
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Opening</p>
              <p className="font-mono font-semibold text-foreground text-sm">
                â‚±{totals.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-0.5">Total In</p>
              <p className="font-mono font-semibold text-emerald-500 text-sm">
                +â‚±{totals.cashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-red-400 mb-0.5">Total Out</p>
              <p className="font-mono font-semibold text-red-400 text-sm">
                -â‚±{totals.cashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Balance</p>
              <p className="font-mono font-bold text-foreground text-sm">
                â‚±{totals.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* --- Data Table --- */}
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-sm">
            {/* Header */}
            <thead className="bg-muted/50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b-2 border-border"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
            <tbody className="text-foreground">
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
                    className="hover:bg-muted/40 border-b border-border transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
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
                    className="h-24 text-muted-foreground text-center"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Footer --- */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 text-center shrink-0">
          <span className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{ledger.length}</span> entries
            {" Â· "}
            Forwarded = previous day&apos;s ending balance
          </span>
        </div>
      </div>
    </div>
  );
}

