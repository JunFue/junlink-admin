"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Package, Receipt, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import InventoryMonitor from "../components/inventory/InventoryMonitor";
import StoreOverview from "../components/StoreOverview";
import StoreExpenses from "../components/StoreExpenses";
import StoreTransactions from "../components/StoreTransactions";
import { archiveStore, restoreStore } from "../services/storeService";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Trash2, RotateCcw, AlertTriangle } from "lucide-react";

import { useStore } from "../hooks/useStore";
import { useStoreStats } from "../hooks/useStoreStats";
import ManageAdmins from "../components/ManageAdmins";
import OwnershipTransfer from "../components/OwnershipTransfer";

type Tab = "overview" | "inventory" | "expenses" | "transactions" | "settings";

export default function StoreDashboardPage() {
  const params = useParams();
  const storeId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: History,
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: Receipt,
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
        {activeTab === "overview" && <StoreOverview stats={stats} />}
        {activeTab === "inventory" && <InventoryMonitor storeId={storeId} />}
        {activeTab === "transactions" && <StoreTransactions storeId={storeId} />}
        {activeTab === "expenses" && <StoreExpenses storeId={storeId} />}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="items-start gap-6 grid lg:grid-cols-2">
               {/* Left Column: Admin Management */}
               <div className="space-y-6">
                  {/* Co-Admins Management */}
                  <ManageAdmins 
                    storeId={storeId} 
                    currentCoAdmins={store.co_admins || []} 
                    ownerId={store.user_id} 
                  />
                  
                  {/* Ownership Transfer */}
                   <OwnershipTransfer currentCoAdmins={store.co_admins || []} />
               </div>

               {/* Right Column: Danger Zone */}
               <div className="border-border bg-card p-6 border rounded-xl h-fit">
                <h2 className="mb-4 font-semibold text-lg">Danger Zone</h2>
                <p className="mb-6 text-muted-foreground text-sm">
                  Actions here can affect store accessibility. Please proceed with caution.
                </p>

                {!isArchived ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Archive Store
                        </div>
                        <p className="text-muted-foreground text-xs">
                          This will soft-delete the store. Members will no longer be able to access the POS terminal.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to archive this store?")) {
                            archiveMutation.mutate(storeId);
                          }
                        }}
                        disabled={archiveMutation.isPending}
                        className="bg-destructive hover:bg-destructive/90 disabled:opacity-50 px-4 py-2 rounded-lg text-destructive-foreground text-sm font-medium transition-colors"
                      >
                        {archiveMutation.isPending ? "Archiving..." : "Archive Store"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-primary/20 rounded-lg bg-primary/5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-primary">
                          <RotateCcw className="w-4 h-4" />
                          Restore Store
                        </div>
                        <p className="text-muted-foreground text-xs">
                          This will restore the store and allow members to access the POS terminal again.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to restore this store?")) {
                            restoreMutation.mutate(storeId);
                          }
                        }}
                        disabled={restoreMutation.isPending}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 px-4 py-2 rounded-lg text-primary-foreground text-sm font-medium transition-colors"
                      >
                        {restoreMutation.isPending ? "Restoring..." : "Restore Store"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
