"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Loader2, AlertCircle, XCircle, Search } from "lucide-react";
import { useTransactionData } from "../../hooks/useTransactionData";
import { DateColumnFilter } from "@/app/stores/[id]/components/cashout-records/components/shared/DateColumnFilter";
import { useDebounce } from "@/app/stores/[id]/components/shared/hooks/useDebounce";

export const TransactionHistoryTable = ({ storeId }: { storeId: string }) => {
  const {
    transactions,
    totalRows,
    isLoading,
    isError,
    error,
    filters,
    setFilters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTransactionData(storeId);

  const [searchTerm, setSearchTerm] = useState(filters.transactionNo || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== (filters.transactionNo || "")) {
      handleApplyFilter("transactionNo", debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

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


  if (isError) {
    return (
      <div className="flex items-center gap-2 p-10 rounded-lg text-red-500 bg-card border border-border">
        <AlertCircle className="w-5 h-5" />
        <span>Error loading history: {error?.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg h-full overflow-hidden bg-card border border-border shadow-sm">
      {/* Filters Toolbar */}
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
              placeholder="Search Invoice..."
              className="w-full bg-background border border-border rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {hasActiveFilters && (
          <button onClick={handleClearAllFilters} className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 border border-red-500/30 rounded text-red-500 text-xs transition-all">
            <XCircle className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto flex-1 overflow-y-auto">
        <table className="w-full text-muted-foreground text-sm text-left">
          <thead className="sticky top-0 z-10 bg-muted text-muted-foreground text-xs uppercase shadow-sm">
            <tr>
              {/* Added Date Column Header */}
              <th className="px-6 py-3 whitespace-nowrap">
                Date (Sorted)
              </th>
              
              <th className="px-6 py-3 whitespace-nowrap">
                Invoice Ref
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                SKU
              </th>
              <th className="px-6 py-3 whitespace-nowrap">
                Item Name
              </th>
              <th className="px-6 py-3 text-right whitespace-nowrap">Price</th>
              <th className="px-6 py-3 text-right whitespace-nowrap">Qty</th>
              <th className="px-6 py-3 font-bold text-foreground text-right whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-muted-foreground text-xs">Loading transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
               <tr><td colSpan={7} className="px-6 py-8 text-muted-foreground text-center">No transactions found.</td></tr>
            ) : (
              transactions.map((item, index) => (
                <tr key={`${item.transactionNo}-${index}`} className="hover:bg-muted/50 border-border border-b transition-colors">
                  {/* Added Date Column Cell */}
                  <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                    {item.transactionTime}
                  </td>
                  
                  <td className="px-6 py-4 text-muted-foreground text-xs">{item.transactionNo}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{item.barcode}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{item.ItemName}</td>
                  <td className="px-6 py-4 text-right">₱{(item.unitPrice ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 font-bold text-primary text-right">₱{(item.totalPrice ?? 0).toFixed(2)}</td>
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
        Showing {transactions.length} of {totalRows} records
      </div>
    </div>
  );
};
