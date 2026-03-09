"use client";

import React from "react";
import { DollarSign, CreditCard } from "lucide-react";

export function PaymentMethods() {
  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
          Payment Methods
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <DollarSign size={14} className="text-emerald-500" /> Cash
              </span>
              <span className="font-bold text-foreground">₱10,000 (65%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: "65%" }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <CreditCard size={14} className="text-blue-500" /> Digital
                (GCash/Card)
              </span>
              <span className="font-bold text-foreground">₱5,450 (35%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: "35%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
