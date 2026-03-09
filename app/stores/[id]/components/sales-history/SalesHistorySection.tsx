// app/transactions/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { PaymentHistoryTable } from "./components/tables/PaymentHistoryTable";
import { TransactionHistoryTable } from "./components/tables/TransactionHistoryTable";

function TransactionsContent({ storeId }: { storeId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get("view") as any;

  const [activeView, setActiveView] = useState("history");

  // Sync state with URL param
  useEffect(() => {
    if (viewParam && ["history", "payments"].includes(viewParam)) {
      setActiveView(viewParam);
    }
  }, [viewParam]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    router.push(`/transactions?view=${view}`);
  };

  const renderView = () => {
    switch (activeView) {
      case "history":
        return (
          <div className="space-y-4 p-6">
            <h2 className="font-semibold text-foreground text-xl">
              Item Sales Log
            </h2>
            <TransactionHistoryTable storeId={storeId} />
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4 p-6">
            <h2 className="font-semibold text-foreground text-xl">
              Payment Transactions
            </h2>
            <PaymentHistoryTable storeId={storeId} />
          </div>
        );
      default:
        return <TransactionHistoryTable storeId={storeId} />;
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* Main Content Area */}
      <div className="slide-in-from-bottom-2 animate-in duration-300 fade-in">
        {renderView()}
      </div>
    </div>
  );
}

export default function TransactionsPage({ storeId }: { storeId: string }) {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <TransactionsContent storeId={storeId} />
    </Suspense>
  );
}
