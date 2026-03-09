import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Drawer {
  id: string;
  category: string; // The drawer name is stored in 'category' column
  store_id: string;
}

const fetchDrawers = async (storeId: string): Promise<Drawer[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_category")
    .select("id, category, store_id")
    .eq("store_id", storeId)
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching drawers:", error);
    throw new Error(error.message);
  }

  return data || [];
};

export function useDrawers(storeId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["drawers", storeId],
    queryFn: () => fetchDrawers(storeId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!storeId,
  });

  return {
    drawers: data || [],
    isLoading,
    error,
  };
}

