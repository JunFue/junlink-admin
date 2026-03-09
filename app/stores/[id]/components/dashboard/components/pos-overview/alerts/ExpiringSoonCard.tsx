"use client";

import { Clock } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ExpiringSoonCardProps {
  query: any; // Result from useQuery
}

export function ExpiringSoonCard({ query }: ExpiringSoonCardProps) {
  const { data: liveExpiringSoon = [], isLoading } = query;

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col h-[300px]">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-md">
          <Clock size={16} />
        </div>
        <h3 className="font-semibold text-sm text-foreground">
          Expiring Soon
        </h3>
      </div>
      <div className="space-y-2 grow overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : liveExpiringSoon.length > 0 ? (
          liveExpiringSoon.map((item: any) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-sm p-2 bg-amber-500/5 rounded border border-amber-500/10"
            >
              <div className="flex flex-col overflow-hidden pr-2">
                <span className="text-foreground truncate text-sm">
                  {item.item_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Rem: {item.batch_remaining} units
                </span>
              </div>
              <span className="font-bold text-amber-500 shrink-0 text-sm">
                {dayjs(item.expiry_date).fromNow(true)}
              </span>
            </div>
          ))
        ) : (
          <div className="h-full min-h-[150px] flex items-center justify-center text-xs text-muted-foreground italic">
            No expiring items
          </div>
        )}
      </div>
    </div>
  );
}
