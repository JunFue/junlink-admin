"use client";

import React from "react";
import type { ActivityItem } from "../../lib/dashboardMockData";
import { ShoppingCart, ArrowRight, ArrowDownLeft, TrendingUp, RotateCcw } from "lucide-react";

interface ActivityFeedProps {
  recentActivity: ActivityItem[];
}

export function ActivityFeed({ recentActivity }: ActivityFeedProps) {
  return (
    <div className="lg:col-span-2 bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col h-full">
      <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
        Recent Activity
      </h3>
      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {recentActivity.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`p-2 rounded-full shrink-0 ${
                  activity.type === "SALE"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : activity.type === "REMIT"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-orange-500/10 text-orange-500"
                }`}
              >
                {activity.type === "SALE" ? (
                  <ShoppingCart size={16} />
                ) : activity.type === "REMIT" ? (
                  <ArrowRight size={16} />
                ) : (
                  <ArrowDownLeft size={16} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.desc}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span className="capitalize">{activity.type}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p
                className={`font-bold text-sm ${
                  activity.amount < 0
                    ? "text-red-500"
                    : "text-foreground"
                }`}
              >
                {activity.amount > 0 ? "+" : ""}
                ₱{activity.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                #{activity.id}
              </p>
            </div>
          </div>
        ))}
        {recentActivity.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activity yet today.
          </div>
        )}
      </div>
    </div>
  );
}
