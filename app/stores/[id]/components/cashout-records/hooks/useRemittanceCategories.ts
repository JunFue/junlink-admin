import { useQuery } from "@tanstack/react-query";
import { fetchRemittanceCategories, RemittanceCategory } from "../lib/cashout.api";

export function useRemittanceCategories() {
  const { data, isLoading, error } = useQuery<RemittanceCategory[]>({
    queryKey: ["remittance-categories"],
    queryFn: fetchRemittanceCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes — these rarely change
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}
