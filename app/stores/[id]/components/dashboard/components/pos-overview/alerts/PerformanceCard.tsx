"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, RefreshCcw, ChevronDown } from "lucide-react";
import { StandardSelect } from "@/app/stores/[id]/components/shared/components/reusables/StandardSelect";

interface PerformanceCardProps {
  bestSellersQuery: any;
  worstSellersQuery: any;
}

export function PerformanceCard({ bestSellersQuery, worstSellersQuery }: PerformanceCardProps) {
  const [view, setView] = useState<"best" | "worst">("best");
  
  const currentQuery = view === "best" ? bestSellersQuery : worstSellersQuery;
  const { data: items = [], isLoading, refetch, isFetching } = currentQuery;

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${view === "best" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            {view === "best" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            {view === "best" ? "Best Sellers" : "Worst Sellers"}
          </h3>
          <span className="text-[10px] text-muted-foreground ml-1">(Last 30d)</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCcw size={12} className={isFetching ? "animate-spin" : ""} />
          </button>
          <StandardSelect
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="text-[10px] py-1 px-2 h-8 min-w-[70px]"
            containerClassName="mb-0"
          >
            <option value="best" className="bg-background">Best</option>
            <option value="worst" className="bg-background">Worst</option>
          </StandardSelect>
        </div>
      </div>

      <div className="space-y-2 grow overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : items.length > 0 ? (
          items.map((item: any, idx: number) => (
            <div
              key={`${item.item_id || item.item_name}-${idx}`}
              className={`flex justify-between items-center text-sm p-2 rounded border ${
                view === "best" 
                  ? "bg-emerald-500/5 border-emerald-500/10" 
                  : "bg-rose-500/5 border-rose-500/10"
              }`}
            >
              <div className="flex flex-col overflow-hidden pr-2">
                <span className="text-foreground truncate text-sm font-medium">
                  {item.item_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Rev: â‚±{item.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={`font-bold text-sm ${view === "best" ? "text-emerald-500" : "text-rose-500"}`}>
                  {item.total_sold} sold
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
            No sales data for this period
          </div>
        )}
      </div>
    </div>
  );
}

