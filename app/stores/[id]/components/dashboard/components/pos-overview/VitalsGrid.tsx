"use client";

import React from "react";
import {
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  AlertTriangle,
} from "lucide-react";
import { VitalCard } from "./VitalCard";
import type { DashboardStats } from "../../lib/dashboardMockData";
import type { FlipCardKey } from "../../hooks/useDashboard";

interface VitalsGridProps {
  stats: DashboardStats;
  flipped: Record<FlipCardKey, boolean>;
  toggleFlip: (card: FlipCardKey) => void;
  isHighRisk: boolean;
  isHistorical: boolean;
  isMultiDrawer: boolean;
  categorySales: { category: string; cash_in: number; balance: number }[];
  isFetching?: boolean;
  lastUpdatedAt?: number;
}

export function VitalsGrid({
  stats,
  flipped,
  toggleFlip,
  isHighRisk,
  isHistorical,
  isMultiDrawer,
  categorySales,
  isFetching,
  lastUpdatedAt,
}: VitalsGridProps) {
  return (
    <div className="space-y-3 mb-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-primary animate-pulse' : 'bg-emerald-500'}`}></div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
             Vitals & Cash Position
           </p>
        </div>
        {lastUpdatedAt && lastUpdatedAt > 0 && (
          <p className="text-[10px] text-muted-foreground italic">
            Last updated: {new Date(lastUpdatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* Card 1: Daily Total Net Sales */}
      <VitalCard
        flipped={flipped.sales}
        onFlip={() => toggleFlip("sales")}
        frontContent={
          <div className="w-full h-full backface-hidden bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {isHistorical ? "Net Sales" : "Daily Net Sales"}
              </p>
              <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-500">
                <TrendingUp size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              ₱{stats.netSales.toLocaleString()}
            </h3>
            <div className="mt-auto space-y-1 bg-muted/50 p-2 rounded-lg border border-border">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Gross Sales:</span>
                <span className="font-medium text-foreground">
                  ₱{stats.grossSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-red-500/90">
                <span>- Discounts:</span>
                <span>₱{stats.salesDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-red-500/90">
                <span>- Returns:</span>
                <span>₱{stats.salesReturn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-red-500/90">
                <span>- Allowances:</span>
                <span>₱{stats.salesAllowance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        }
        backContent={
          isMultiDrawer && categorySales.length > 0 ? (
            <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-500">
                  <TrendingUp size={14} />
                </div>
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Sales by Category
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                {categorySales.map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center justify-between text-[11px] bg-muted/40 px-2.5 py-1.5 rounded-lg"
                  >
                    <span className="text-muted-foreground font-medium truncate mr-2">
                      {entry.category}
                    </span>
                    <span className="font-mono font-semibold text-foreground whitespace-nowrap">
                      ₱{entry.cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-2 font-medium tracking-wide uppercase text-center shrink-0">
                Click to flip back
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col justify-center items-center text-center">
              <div className="p-2 bg-muted rounded-full mb-2 text-emerald-500">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-bold text-foreground text-sm mb-2">
                What is Net Sales?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                The true money you earned from selling items today, calculated
                after taking away any discounts given, item returns, or allowances.
              </p>
              <p className="text-[9px] text-muted-foreground/60 mt-auto font-medium tracking-wide uppercase">
                Click to flip back
              </p>
            </div>
          )
        }
      />

      {/* Card 2: Net Profit */}
      <VitalCard
        flipped={flipped.profit}
        onFlip={() => toggleFlip("profit")}
        frontContent={
          <div className="w-full h-full backface-hidden bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {isHistorical ? "Net Profit" : "Today's Net Profit"}
              </p>
              <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-500">
                <TrendingUp size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              ₱{stats.netProfit.toLocaleString()}
            </h3>
            <div className="mt-auto space-y-1 bg-muted/50 p-2 rounded-lg border border-border">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Net Sales:</span>
                <span className="font-medium text-foreground">
                  ₱{stats.netSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-red-500/90">
                <span>- COGS:</span>
                <span>₱{stats.cashout.cogs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] text-red-500/90">
                <span>- OPEX:</span>
                <span>₱{stats.cashout.opex.toLocaleString()}</span>
              </div>
            </div>
          </div>
        }
        backContent={
          <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col justify-center items-center text-center">
            <div className="p-2 bg-muted rounded-full mb-2 text-blue-500">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold text-foreground text-sm mb-2">
              What is Net Profit?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed px-1">
              The money the business gets to keep. It is your Net Sales minus
              the cost of the goods you sold (COGS) and daily operations (OPEX).
            </p>
            <p className="text-[9px] text-muted-foreground/60 mt-auto font-medium tracking-wide uppercase">
              Click to flip back
            </p>
          </div>
        }
      />

      {/* Card 3: Cash in Drawer */}
      <VitalCard
        flipped={flipped.cash}
        onFlip={() => toggleFlip("cash")}
        frontContent={
          <div
            className={`w-full h-full backface-hidden p-4 rounded-xl border shadow-sm transition-all duration-300 flex flex-col justify-between hover:shadow-md ${
              isHighRisk
                ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20"
                : "bg-card border-border hover:border-blue-500/50"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <p
                  className={`${
                    isHighRisk ? "text-amber-500" : "text-muted-foreground"
                  } text-xs font-semibold uppercase tracking-wider`}
                >
                  Cash in Drawer
                </p>
                {isHighRisk && (
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                    REMIT NOW
                  </span>
                )}
              </div>
              <div
                className={`p-1.5 rounded-md ${
                  isHighRisk
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isHighRisk ? (
                  <AlertTriangle size={16} />
                ) : (
                  <Wallet size={16} />
                )}
              </div>
            </div>
            <h3
              className={`text-2xl font-bold ${
                isHighRisk ? "text-amber-500 text-shadow-sm" : "text-foreground"
              }`}
            >
              ₱{stats.cashInDrawer.toLocaleString()}
            </h3>
            <p
              className={`text-[10px] mt-auto ${
                isHighRisk ? "text-amber-500/80" : "text-muted-foreground"
              }`}
            >
              Physical cash currently at the register.
            </p>
          </div>
        }
        backContent={
          isMultiDrawer && categorySales.length > 0 ? (
            <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-md ${isHighRisk ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                  <Wallet size={14} />
                </div>
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Cash per Category
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
                {categorySales.map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center justify-between text-[11px] bg-muted/40 px-2.5 py-1.5 rounded-lg"
                  >
                    <div className="flex flex-col mr-2 truncate">
                      <span className="text-muted-foreground font-medium truncate">
                        {entry.category}
                      </span>
                      <span className="text-[9px] text-muted-foreground/70">
                        Sales: ₱{entry.cash_in.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-foreground whitespace-nowrap">
                      ₱{entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-2 font-medium tracking-wide uppercase text-center shrink-0">
                Click to flip back
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col justify-center items-center text-center">
              <div
                className={`p-2 bg-muted rounded-full mb-2 ${
                  isHighRisk ? "text-amber-500" : "text-muted-foreground"
                }`}
              >
                {isHighRisk ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Wallet size={20} />
                )}
              </div>
              <h4 className="font-bold text-foreground text-sm mb-2">
                What is Cash in Drawer?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                The exact physical cash sitting in your register right now. If
                it&apos;s too high, it&apos;s safer to remit some to the manager or safe.
              </p>
              <p className="text-[9px] text-muted-foreground/60 mt-auto font-medium tracking-wide uppercase">
                Click to flip back
              </p>
            </div>
          )
        }
      />

      {/* Card 4: Cashout (Breakdown) */}
      <VitalCard
        flipped={flipped.cashout}
        onFlip={() => toggleFlip("cashout")}
        frontContent={
          <div className="w-full h-full backface-hidden bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Total Cashout
              </p>
              <div className="p-1.5 bg-red-500/10 rounded-md text-red-500">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-500 mb-2">
              -₱{stats.cashout.total.toLocaleString()}
            </h3>
            <div className="mt-auto space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  COGS (Suppliers):
                </span>
                <span className="font-medium text-foreground">
                  ₱{stats.cashout.cogs.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  OPEX (Operations):
                </span>
                <span className="font-medium text-foreground">
                  ₱{stats.cashout.opex.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Remittance/Owner:
                </span>
                <span className="font-medium text-foreground">
                  ₱{stats.cashout.remittance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        }
        backContent={
          <div className="absolute inset-0 w-full h-full backface-hidden transform-[rotateY(180deg)] bg-card border border-border p-4 rounded-xl shadow-inner flex flex-col justify-center items-center text-center">
            <div className="p-2 bg-muted rounded-full mb-2 text-red-500">
              <ArrowDownLeft size={20} />
            </div>
            <h4 className="font-bold text-foreground text-sm mb-2">
              What is Cashout?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed px-1">
              Money that left the cash drawer today. This includes paying
              suppliers, daily expenses (like ice), and money safely remitted.
            </p>
            <p className="text-[9px] text-muted-foreground/60 mt-auto font-medium tracking-wide uppercase">
              Click to flip back
            </p>
          </div>
        }
      />
      </div>
    </div>
  );
}
