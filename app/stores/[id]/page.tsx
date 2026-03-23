"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Package, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Settings, ClipboardList, DollarSign, History, LayoutDashboard, Trash2, RotateCcw, Hash, RefreshCw } from "lucide-react";
import StoreDashboardSection from "./components/dashboard/StoreDashboardSection";
import SalesHistorySection from "./components/sales-history/SalesHistorySection";
import CashoutRecordsSection from "./components/cashout-records/CashoutRecordsSection";
import { useStore } from "../hooks/useStore";
import { useStoreStats } from "../hooks/useStoreStats";
import { useRegenerateCode } from "../hooks/useRegenerateCode";
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
  const { mutate: regenerateCode, isPending: isRegenerating } = useRegenerateCode();

  // Evaluate expiration
  const hasExpiry = store ? !!store.enrollment_code_expires_at : false;
  const isExpired = store ? (!store.enrollment_code_expires_at || new Date(store.enrollment_code_expires_at) < new Date()) : true;

  const handleRegenerate = () => {
    if (store) regenerateCode(store.store_id);
  };

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
          <div className="space-y-6">
            {/* Enrollment Code Section */}
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg text-foreground mb-1">Store Enrollment Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This code is used by staff members to enroll in this store via the POS app.
                  </p>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                  {isRegenerating ? "Generating..." : "Regenerate Code"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-md border text-lg font-mono tracking-wider">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                  {isExpired ? (
                    <span className="text-muted-foreground">Expired</span>
                  ) : (
                    <span className="font-bold">{store.enrollment_id}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm w-fit",
                    isExpired ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  )}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                  {store.enrollment_code_expires_at && !isExpired && (
                    <span className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(store.enrollment_code_expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Archive / Restore Section */}
            <div className={cn(
              "p-6 border rounded-lg",
              isArchived ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30" : "bg-card"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg text-foreground mb-1">
                    {isArchived ? "Restore Store" : "Archive Store"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isArchived
                      ? "This store is currently archived. Staff members cannot use it. Restore it to make it active again."
                      : "Archiving hides the store and prevents staff from using it. You can restore it anytime."}
                  </p>
                </div>
                {isArchived ? (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to restore this store?")) {
                        restoreMutation.mutate(storeId);
                      }
                    }}
                    disabled={restoreMutation.isPending}
                    className="flex items-center gap-2 bg-success text-success-foreground px-4 py-2 rounded-md hover:bg-success/90 transition-colors disabled:opacity-50 text-sm font-medium shrink-0"
                  >
                    <RotateCcw className={cn("w-4 h-4", restoreMutation.isPending && "animate-spin")} />
                    {restoreMutation.isPending ? "Restoring..." : "Restore Store"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to archive this store? Staff will lose access.")) {
                        archiveMutation.mutate(storeId);
                      }
                    }}
                    disabled={archiveMutation.isPending}
                    className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors disabled:opacity-50 text-sm font-medium shrink-0"
                  >
                    <Trash2 className={cn("w-4 h-4", archiveMutation.isPending && "animate-spin")} />
                    {archiveMutation.isPending ? "Archiving..." : "Archive Store"}
                  </button>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 border border-destructive/30 rounded-lg bg-destructive/5">
              <h3 className="font-medium text-lg text-destructive mb-1">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently deleting a store will remove all associated data including transactions, inventory, and staff records. This action <strong>cannot be undone</strong>.
              </p>
              <button
                onClick={() => {
                  const confirmation = prompt(
                    `To permanently delete "${store.store_name}", type the store name below:`
                  );
                  if (confirmation === store.store_name) {
                    archiveMutation.mutate(storeId, {
                      onSuccess: () => {
                        window.location.href = "/stores";
                      },
                    });
                  } else if (confirmation !== null) {
                    alert("Store name did not match. Deletion cancelled.");
                  }
                }}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete Store Permanently
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
