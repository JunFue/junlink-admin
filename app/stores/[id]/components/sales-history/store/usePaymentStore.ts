import { create } from 'zustand';
import { TransactionFilters } from '../hooks/useTransactionQueries';

interface PaymentState {
  currentPage: number;
  rowsPerPage: number;
  filters: TransactionFilters;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (size: number) => void;
  setFilters: (filters: TransactionFilters) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  currentPage: 1,
  rowsPerPage: 10,
  filters: { startDate: "", endDate: "" },
  setCurrentPage: (page) => set({ currentPage: page }),
  setRowsPerPage: (size) => set({ rowsPerPage: size }),
  setFilters: (filters) => set({ filters }),
}));
