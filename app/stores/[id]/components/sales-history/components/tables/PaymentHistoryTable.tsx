"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, XCircle, Trash2, Search } from "lucide-react";
import { usePaymentData } from "../../hooks/usePaymentData";
import { DateColumnFilter } from "@/app/stores/[id]/components/cashout-records/components/shared/DateColumnFilter";
import { deletePayment } from "@/app/stores/[id]/components/shared/actions/transactions";
import { usePermissions } from "@/app/stores/[id]/components/shared/hooks/usePermissions";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionDetailModal } from "../modals/TransactionDetailModal";
import { useDebounce } from "@/app/stores/[id]/components/shared/hooks/useDebounce";

export const PaymentHistoryTable = ({ storeId }: { storeId: string }) => {
  const queryClient = useQueryClient();
  // 1. Consume Context
  const {
    payments,
    totalRows,
    isLoading,
    isError,
    error,
    filters,
    setFilters,
    refresh,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePaymentData(storeId);

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== (filters.search || "")) {
      handleApplyFilter("search", debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const { can_delete_transaction } = usePermissions();

  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const handleDateChange = (start: string, end: string) => {
    setFilters({ ...filters, startDate: start, endDate: end });
  };

  const handleApplyFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClearAllFilters = () => {
    setFilters({ startDate: "", endDate: "" });
    setSearchTerm("");
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => key !== "startDate" && key !== "endDate" && filters[key]
  );

  const handleDelete = async (id: string) => {
    const paymentToDelete = payments.find(p => p.id === id);
    if (!paymentToDelete) return;

    const { transactionNo } = paymentToDelete;

    if (!window.confirm("Are you sure you want to delete this payment record? This will also delete all associated items and is irreversible.")) {
      return;
    }

    setDeletingId(id);
    
    // --- Optimistic Update Logic ---
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["payments"] });
    await queryClient.cancelQueries({ queryKey: ["transaction-items"] });

    // 2. Snapshot current data (for cleanup if needed, but invalidation is simpler for rollback)
    
    // 3. Update Payments cache
    queryClient.setQueriesData({ queryKey: ["payments"] }, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((p: any) => p.id !== id),
          count: Math.max(0, (page.count || 0) - 1)
        })),
      };
    });

    // 4. Update Transaction Items cache
    queryClient.setQueriesData({ queryKey: ["transaction-items"] }, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.filter((item: any) => item.transactionNo !== transactionNo),
        })),
      };
    });

    try {
      const result = await deletePayment(id);
      if (result.success) {
        // On success, we don't strictly NEED to invalidade if our optimistic math is perfect,
        // but it's safer to ensure consistency.
        refresh();
        queryClient.invalidateQueries({ queryKey: ["transaction-items"] });
      } else {
        alert(`Failed to delete payment: ${result.error}`);
        // Rollback by invalidating
        refresh();
        queryClient.invalidateQueries({ queryKey: ["transaction-items"] });
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An unexpected error occurred while deleting.");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["transaction-items"] });
    } finally {
      setDeletingId(null);
    }
  };

  // 3. UI States

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-10 rounded-lg text-red-500 bg-card border border-border">
        <AlertCircle className="w-5 h-5" />
        <span>Error loading payments: {error?.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg h-full overflow-hidden bg-card border border-border shadow-sm">
      {/* --- Filters Toolbar --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-muted/30 p-4 border-border border-b">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <DateColumnFilter
            startDate={filters.startDate || ""}
            endDate={filters.endDate || ""}
            onDateChange={handleDateChange}
            align="start"
          />
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Invoice or Customer..."
              className="w-full bg-background border border-border rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 border border-red-500/30 rounded text-red-500 text-xs transition-all"
          >
            <XCircle className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto flex-1 overflow-y-auto">
        <table className="w-full text-muted-foreground text-sm text-left">
          <thead className="sticky top-0 z-10 bg-muted text-muted-foreground text-xs uppercase shadow-sm">
            <tr>
              <th className="px-6 py-3 rounded-tl-lg">
                Invoice No
              </th>
              <th className="px-6 py-3">Date & Time</th>
              <th className="px-6 py-3">
                Customer
              </th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Payment</th>
              <th className="px-6 py-3 text-primary text-right">Voucher</th>
              <th className="px-6 py-3 font-bold text-green-500 text-right">
                Change
              </th>
              {can_delete_transaction && (
                <th className="px-6 py-3 rounded-tr-lg text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={can_delete_transaction ? 8 : 7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-muted-foreground text-xs">Loading payments...</span>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={can_delete_transaction ? 8 : 7}
                  className="px-6 py-8 text-muted-foreground text-center"
                >
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((pay, index) => (
                <tr
                  key={index}
                  className="hover:bg-muted/50 border-border border-b transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    <button
                      onClick={() => setSelectedInvoiceNo(pay.transactionNo)}
                      className="hover:text-primary hover:underline font-bold transition-all text-left"
                    >
                      {pay.transactionNo}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {pay.transactionTime}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {pay.customerName || (
                      <span className="opacity-50 italic">Walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-right">
                    ₱{(pay.grandTotal ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    ₱{(pay.amountRendered ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-primary text-right">
                    {pay.voucher > 0 ? `₱${(pay.voucher ?? 0).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-500 text-right">
                    ₱{(pay.change ?? 0).toFixed(2)}
                  </td>
                  {can_delete_transaction && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(pay.id)}
                        disabled={deletingId === pay.id}
                        className={`p-2 rounded-md transition-all ${
                          deletingId === pay.id
                            ? "bg-muted text-muted-foreground"
                            : "hover:bg-red-500/20 text-red-500 hover:text-red-600"
                        }`}
                        title="Delete Payment"
                      >
                        {deletingId === pay.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Sentinel for Infinite Scroll */}
        <div ref={observerTarget} className="h-4 w-full" />
        
        {isFetchingNextPage && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
      </div>

      <div className="p-2 text-xs text-muted-foreground text-center border-t border-border">
        Showing {payments.length} of {totalRows} records
      </div>

      {selectedInvoiceNo && (
        <TransactionDetailModal
          invoiceNo={selectedInvoiceNo}
          onClose={() => setSelectedInvoiceNo(null)}
        />
      )}
    </div>
  );
};
