import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { TransactionItem, PaymentRecord as FormattedPaymentRecord } from "../types";
import { useAuthStore } from "@/app/stores/[id]/components/shared/store/useAuthStore";
import type { TransactionRecord, PaymentRecord } from "@/app/stores/[id]/components/shared/actions/transactions";

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

// --- 1. Hook for Line Items History ---
export const useTransactionHistory = (
  storeId: string,
  pageSize: number,
  filters: TransactionFilters = {}
) => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ["transaction-items", storeId, pageSize, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { getTransactionHistory } = await import("@/app/stores/[id]/components/shared/actions/transactions");
      const result = await getTransactionHistory(storeId, pageParam as number, pageSize, filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      const formattedData = (result.data as TransactionRecord[]).map(
        (item) => ({
          transactionNo: item.invoice_no || "N/A",
          transactionTime: item.transaction_time 
            ? new Date(item.transaction_time).toLocaleString() 
            : "N/A", 
          barcode: item.sku,
          ItemName: item.item_name,
          unitPrice: item.sales_price,
          discount: item.discount,
          quantity: item.quantity,
          totalPrice: item.total_price,
        })
      ) as TransactionItem[];

      return {
        data: formattedData,
        count: result.count || 0,
        nextPage: (result.data as any[]).length === pageSize ? (pageParam as number) + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isAuthenticated,
  });
};

// --- 2. Hook for Payment/Header History ---
export const usePaymentHistory = (
  storeId: string,
  pageSize: number = 50,
  filters: TransactionFilters = {}
) => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ["payments", storeId, pageSize, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { getPaymentHistory } = await import("@/app/stores/[id]/components/shared/actions/transactions");
      const result = await getPaymentHistory(storeId, pageParam as number, pageSize, filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      const formattedData = (result.data as any[]).map((p) => ({
        id: p.id,
        transactionNo: p.invoice_no || p.transaction_no || "N/A",
        transactionTime: p.transaction_time ? new Date(p.transaction_time).toLocaleString() : "N/A",
        customerName: p.customer_name,
        amountRendered: p.amount_rendered ?? 0,
        voucher: p.voucher ?? 0,
        grandTotal: p.grand_total || p.amount_paid || 0,
        change: p.change ?? 0,
      })) as FormattedPaymentRecord[];

      return {
        data: formattedData,
        count: result.count || 0,
        nextPage: (result.data as PaymentRecord[]).length === pageSize ? (pageParam as number) + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isAuthenticated,
  });
};
