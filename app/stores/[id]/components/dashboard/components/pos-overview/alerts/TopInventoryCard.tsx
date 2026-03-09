"use client";

import { useRef } from "react";
import { PackageCheck } from "lucide-react";

interface TopInventoryCardProps {
  query: any; // Result from useInfiniteQuery
}

export function TopInventoryCard({ query }: TopInventoryCardProps) {
  const { 
    data, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = query;

  const topInventory = data?.pages.flat() || [];
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 20 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col h-[300px]">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md">
          <PackageCheck size={16} />
        </div>
        <h3 className="font-semibold text-sm text-foreground">
          Top Inventory
        </h3>
      </div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="space-y-2 grow overflow-y-auto pr-2 custom-scrollbar"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : topInventory.length > 0 ? (
          <>
            {topInventory.map((item: any, idx: number) => (
              <div
                key={`${item.item_id}-${idx}`}
                className="flex justify-between items-center text-sm p-2 bg-emerald-500/5 rounded border border-emerald-500/10"
              >
                <div className="flex flex-col overflow-hidden pr-2">
                  <span className="text-foreground truncate text-sm">
                    {item.item_name}
                  </span>
                </div>
                <span className="font-bold text-emerald-500 shrink-0 text-sm">
                  {item.current_stock} units
                </span>
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="text-center py-2 text-xs text-muted-foreground animate-pulse mt-2">
                Loading more...
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
            No inventory data
          </div>
        )}
      </div>
    </div>
  );
}
