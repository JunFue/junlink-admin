"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import dayjs from "dayjs";
import { fetchFinancialReport } from "../lib/dashboard.api";
import { FinancialReportItem } from "../lib/types";

export const useFinancialReport = (
  storeId: string,
  defaultStartDate = dayjs().startOf('month').format('YYYY-MM-DD'),
  defaultEndDate = dayjs().endOf('month').format('YYYY-MM-DD')
) => {
  const [dateRange, setDateRange] = useState({
    start: defaultStartDate,
    end: defaultEndDate
  });

  // 1. Define the Query Key
  const queryKey = ['financial-report', storeId, dateRange.start, dateRange.end];

  // 2. Initialize React Query
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchFinancialReport(storeId, dateRange.start, dateRange.end),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    staleTime: 0, // Always check for updates
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: "always",
  });

  const updateDate = (key: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [key]: value }));
  };

  return {
    data: data || [], // Always return an array to prevent crashes
    isLoading,        // True if no data and currently fetching
    isValidating: isFetching, // Map isFetching to isValidating for compatibility
    isError: error,
    dateRange,
    updateDate,
    refetch   // Expose refetch function
  };
};