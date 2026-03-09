"use client";

import { useInventoryMonitor } from "../../hooks/useInventoryMonitor";
import type { InventoryStatsData } from "../../lib/dashboardMockData";
import { LowStockAlertCard } from "./alerts/LowStockAlertCard";
import { TopInventoryCard } from "./alerts/TopInventoryCard";
import { ExpiringSoonCard } from "./alerts/ExpiringSoonCard";
import { PerformanceCard } from "./alerts/PerformanceCard";

interface InventoryAlertsProps {
  storeId: string;
  inventoryStats: InventoryStatsData;
}

export function InventoryAlerts({ storeId, inventoryStats }: InventoryAlertsProps) {
  const { lowStockQuery, topInventoryQuery, expiringSoonQuery, bestSellersQuery, worstSellersQuery } = useInventoryMonitor(storeId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <LowStockAlertCard query={lowStockQuery} />
      <TopInventoryCard query={topInventoryQuery} />
      <ExpiringSoonCard query={expiringSoonQuery} />
      <PerformanceCard bestSellersQuery={bestSellersQuery} worstSellersQuery={worstSellersQuery} />
    </div>
  );
}
