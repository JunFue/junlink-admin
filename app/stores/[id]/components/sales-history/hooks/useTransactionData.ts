import { useTransactionStore } from '../store/useTransactionStore';
import { useTransactionHistory } from './useTransactionQueries';

export function useTransactionData(storeId: string) {
  const { rowsPerPage, filters, setRowsPerPage, setFilters } = useTransactionStore();
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTransactionHistory(storeId, rowsPerPage, filters);

  const transactions = data?.pages.flatMap((page) => page.data) || [];
  const totalRows = data?.pages[0]?.count || 0;

  return {
    transactions,
    totalRows,
    isLoading,
    isError: !!error,
    error,
    rowsPerPage,
    filters,
    setRowsPerPage,
    setFilters,
    refresh: refetch,
    isValidating: isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Keep currentPage for compatibility if needed, but it's not driven by store anymore in the same way
    currentPage: 1, 
    setCurrentPage: () => {}, // No-op
  };
}
