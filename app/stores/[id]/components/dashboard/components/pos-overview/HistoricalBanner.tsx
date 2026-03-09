"use client";

import React from "react";
import { History } from "lucide-react";

interface HistoricalBannerProps {
  selectedDate: string;
  onReturnToToday: () => void;
}

export function HistoricalBanner({
  selectedDate,
  onReturnToToday,
}: HistoricalBannerProps) {
  return (
    <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
          <History size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-600">
            Viewing Historical Data
          </p>
          <p className="text-xs text-amber-600/90">
            You are viewing records for{" "}
            <span className="font-mono font-bold">{selectedDate}</span>.
          </p>
        </div>
      </div>
      <button
        onClick={onReturnToToday}
        className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-amber-600 transition-colors"
      >
        Return to Today
      </button>
    </div>
  );
}
