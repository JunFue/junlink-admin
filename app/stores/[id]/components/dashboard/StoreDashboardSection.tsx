"use client";

import React, { Suspense, useState } from "react";
import { useDashboard } from "./hooks/useDashboard";
import { HistoricalBanner } from "./components/pos-overview/HistoricalBanner";
import { DashboardHeader } from "./components/pos-overview/DashboardHeader";
import { VitalsGrid } from "./components/pos-overview/VitalsGrid";
import { InventoryAlerts } from "./components/pos-overview/InventoryAlerts";
import { CashoutModal } from "./components/pos-overview/CashoutModal";
import { CashFlowModal } from "./components/pos-overview/CashFlowModal";

const STORE_NAME = "Punch POS"; // Or specific store name

function DashboardContent({ storeId }: { storeId: string }) {
  const {
    todayStr,
    time,
    selectedDate,
    setSelectedDate,
    isHistorical,
    stats,
    inventoryStats,
    recentActivity,
    flipped,
    toggleFlip,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    expenseAmount,
    setExpenseAmount,
    expenseReason,
    setExpenseReason,
    expenseCategory,
    setExpenseCategory,
    handleAddExpense,
    isHighRisk,
    isLoading,
    isFetching,
    lastUpdatedAt,
    isMultiDrawer,
    categorySales,
    handleManualRefresh,
  } = useDashboard(storeId);

  const [isCashFlowOpen, setIsCashFlowOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-6 pb-24 font-sans text-foreground">
      <div className="max-w-7xl mx-auto">
        {/* HISTORICAL MODE BANNER */}
        {isHistorical && (
          <HistoricalBanner
            selectedDate={selectedDate}
            onReturnToToday={() => setSelectedDate(todayStr)}
          />
        )}

        {/* HEADER */}
        <DashboardHeader
          storeName={STORE_NAME} // Ideally this comes from store.store_name in the future
          today={todayStr}
          time={time}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isHistoricalView={isHistorical}
          onRefresh={handleManualRefresh}
          isRefreshing={isFetching}
          onOpenCashFlow={() => setIsCashFlowOpen(true)}
        />

        {/* SECTION 1: THE VITALS */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-card/50 rounded-xl border border-border" />
            ))}
          </div>
        ) : (
          <VitalsGrid
            stats={stats}
            flipped={flipped}
            toggleFlip={toggleFlip}
            isHighRisk={isHighRisk}
            isHistorical={isHistorical}
            isMultiDrawer={isMultiDrawer}
            categorySales={categorySales}
            isFetching={isFetching}
            lastUpdatedAt={lastUpdatedAt}
          />
        )}


        {/* SECTION 3: INVENTORY ALERTS */}
        <InventoryAlerts storeId={storeId} inventoryStats={inventoryStats} />

        {/* CASHOUT / EXPENSE MODAL */}
        <CashoutModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          expenseAmount={expenseAmount}
          setExpenseAmount={setExpenseAmount}
          expenseReason={expenseReason}
          setExpenseReason={setExpenseReason}
          expenseCategory={expenseCategory}
          setExpenseCategory={setExpenseCategory}
          onSubmit={handleAddExpense}
          isMultiDrawer={isMultiDrawer}
        />

        {/* CASH FLOW LEDGER MODAL */}
        <CashFlowModal
          storeId={storeId}
          isOpen={isCashFlowOpen}
          onClose={() => setIsCashFlowOpen(false)}
          isMultiDrawer={isMultiDrawer}
        />
      </div>
    </div>
  );
}

export default function DashboardPage({ storeId }: { storeId: string }) {
  return (
    <Suspense
      fallback={<div className="p-6 text-foreground">Loading...</div>}
    >
      <DashboardContent storeId={storeId} />
    </Suspense>
  );
}
