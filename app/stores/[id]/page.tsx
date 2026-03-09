"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Package, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Settings, ClipboardList, DollarSign, History, LayoutDashboard, Trash2, RotateCcw } from "lucide-react";
import StoreDashboardSection from "./components/dashboard/StoreDashboardSection";
import SalesHistorySection from "./components/sales-history/SalesHistorySection";
import CashoutRecordsSection from "./components/cashout-records/CashoutRecordsSection";
import { useStore } from "../hooks/useStore";
import { useStoreStats } from "../hooks/useStoreStats";
import { archiveStore, restoreStore } from "../services/storeService";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ManageAdmins from "../components/ManageAdmins";
import OwnershipTransfer from "../components/OwnershipTransfer";

type Tab = "dashboard" | "sales-history" | "cashout-records" | "audit-logs" | "settings";

export default function StoreDashboardPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const { data: stats, isLoading: statsLoading } = useStoreStats(storeId);

  const queryClient = useQueryClient();
  const supabase = createClient();

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveStore(supabase, id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["store", storeId] });
        alert(res.message);
      } else {
        alert(res.message);
      }
    },
    onError: (error: any) => {
      alert(error.message || "Failed to archive store");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreStore(supabase, id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["store", storeId] });
        alert(res.message);
      } else {
        alert(res.message);
      }
    },
    onError: (error: any) => {
      alert(error.message || "Failed to restore store");
    },
  });

  const tabs = [
    {
      id: "dashboard",
      label: "Stores Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "sales-history",
      label: "Sales History",
      icon: History,
    },
    {
      id: "cashout-records",
      label: "Cashout Records",
      icon: DollarSign,
    },
    {
      id: "audit-logs",
      label: "Audit Logs",
      icon: ClipboardList,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ] as const;

  const loading = storeLoading || statsLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="border-primary border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  if (!store || !stats) {
    return <div className="p-8 text-center">Store not found</div>;
  }

  const isArchived = !!store.deleted_at;

  return (
    <div className="space-y-6 animate-in duration-500 fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/stores"
          className="hover:bg-muted p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-foreground text-2xl">
              {store.store_name}
            </h1>
            {isArchived && (
              <span className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full font-medium text-yellow-700 dark:text-yellow-500 text-xs">
                Archived
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Dashboard Overview</p>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="border-b">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 pb-3 text-sm font-medium transition-all relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "dashboard" && <StoreDashboardSection storeId={storeId} />}
        {activeTab === "sales-history" && <SalesHistorySection storeId={storeId} />}
        {activeTab === "cashout-records" && <CashoutRecordsSection storeId={storeId} />}
        {activeTab === "audit-logs" && (
          <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
            <h3 className="font-medium text-lg text-foreground mb-2">Audit Logs</h3>
            <p>End of day reports will be shown here.</p>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
            <h3 className="font-medium text-lg text-foreground mb-2">Settings</h3>
            <p>Settings contents have been temporarily removed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
