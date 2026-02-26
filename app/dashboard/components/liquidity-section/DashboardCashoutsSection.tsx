"use client";

import { useMemo } from "react";
import { useDashboardCashouts } from "../../hooks/useDashboardCashouts";
import CashoutsChart from "@/app/transaction/components/CashoutsChart";
import { Wallet, PieChart as ChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

export function DashboardCashoutsSection() {
  const { data: cashouts, isLoading } = useDashboardCashouts();

  const { totals, grandTotal } = useMemo(() => {
    if (!cashouts) return { totals: { cogs: 0, opex: 0, remittance: 0 }, grandTotal: 0 };
    const t = cashouts.reduce(
      (acc, item) => {
        const val = Number(item.total_amount) || 0;
        if (item.cashout_type === "COGS") acc.cogs += val;
        if (item.cashout_type === "OPEX") acc.opex += val;
        if (item.cashout_type === "REMITTANCE") acc.remittance += val;
        return acc;
      },
      { cogs: 0, opex: 0, remittance: 0 }
    );
    return { totals: t, grandTotal: t.cogs + t.opex + t.remittance };
  }, [cashouts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Cashouts Breakdown
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden relative group transition-all hover:border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ChartIcon size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                Total Cashout
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-foreground tracking-tight">
                  {formatCurrency(grandTotal)}
                </h3>
                <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                  all categories
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12 border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-12">
              {[
                { label: "COGS", value: totals.cogs, color: "text-orange-500", bg: "bg-orange-500" },
                { label: "OPEX", value: totals.opex, color: "text-blue-500", bg: "bg-blue-500" },
                { label: "Remittance", value: totals.remittance, color: "text-purple-500", bg: "bg-purple-500" },
              ].map((stat) => (
                <div key={stat.label} className="relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${stat.bg}`} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      {stat.label}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${stat.color} tracking-tight`}>
                    {formatCurrency(stat.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[300px] bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-[300px] bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-[300px] bg-card border border-border rounded-xl animate-pulse" />
        </div>
      ) : (
        <CashoutsChart breakdown={cashouts || []} />
      )}
    </div>
  );
}
