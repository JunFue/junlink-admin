import { useQuery } from "@tanstack/react-query";
import { fetchExpensesBreakdown } from "../lib/cashout.api";

export type BreakdownRow = {
  classification: string;
  amount: number;
};

export type SourceData = {
  sourceName: string;
  total: number;
  breakdown: BreakdownRow[];
};

export const useExpensesBreakdown = (storeId: string, startDate: string, endDate: string) => {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ["expenses", "breakdown", storeId, startDate, endDate],
    queryFn: async () => {
      const result = await fetchExpensesBreakdown(storeId, startDate, endDate);

      // Transform aggregated object into an array for the UI
      const formattedData: SourceData[] = Object.entries(result).map(
        ([sourceName, classifications]) => {
          const breakdown = Object.entries(classifications)
            .map(([cls, amt]) => ({
              classification: cls,
              amount: amt,
            }))
            .sort((a, b) => b.amount - a.amount); // Sort by highest expense

          const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

          return {
            sourceName,
            total,
            breakdown,
          };
        }
      );

      return formattedData;
    },
    enabled: !!startDate && !!endDate,
  });

  return { data, loading };
};
