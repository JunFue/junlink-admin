
import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInventory, fetchLowStockItems, fetchMostStockedItems, InventoryParams } from "@/app/stores/[id]/components/shared/lib/inventory.api";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime changes on `stock_flow` and `transactions` tables.
 * On any change, invalidates all inventory-related React Query caches so components refetch fresh data.
 */
const useRealtimeInventory = (storeId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stock_flow" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inventory-infinite", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-all-pos", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-most-stocked", storeId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inventory-infinite", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-all-pos", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", storeId] });
          queryClient.invalidateQueries({ queryKey: ["inventory-most-stocked", storeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, storeId]);
};

export const useInventoryInfinite = (storeId: string, params?: Partial<InventoryParams>) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useRealtimeInventory(storeId);
  
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["inventory-infinite", storeId, params],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchInventory({ ...params, storeId, page: pageParam, limit: 50 });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length < 50) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 0, // Always refetch on invalidation for fresh stock data
  });

  const allRows = data?.pages.flatMap((p) => p.data) || [];
  const totalCount = data?.pages[0]?.count || 0;

  return {
    inventory: allRows,
    totalCount,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};

export const useLowStockInfinite = (storeId: string) => {
  return useInfiniteQuery({
    queryKey: ["inventory-low-stock", storeId],
    queryFn: async ({ pageParam = 1 }) => fetchLowStockItems(storeId, pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length < 20) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });
};

export const useMostStockedInfinite = (storeId: string) => {
  return useInfiniteQuery({
    queryKey: ["inventory-most-stocked", storeId],
    queryFn: async ({ pageParam = 1 }) => fetchMostStockedItems(storeId, pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.data || lastPage.data.length < 20) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });
};

/* Legacy hook restored for POS compatibility - Fetches a large chunk of inventory */
export const useInventory = (storeId: string) => {
  // Subscribe to realtime updates
  useRealtimeInventory(storeId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["inventory-all-pos", storeId],
    queryFn: async () => fetchInventory({ storeId, limit: 1000, page: 1 }), // Fetch large chunk for POS
    staleTime: 0, // Always refetch on invalidation for fresh stock data
  });

  return { 
    inventory: data?.data || [], 
    totalCount: data?.count || 0,
    isLoading, 
    error: isError, 
    refetch 
  };
};


