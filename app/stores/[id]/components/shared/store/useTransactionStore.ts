import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TransactionState {
  customTransactionDate: string | null; // Changed to string for easier JSON persistence
  setCustomTransactionDate: (date: string | null) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      customTransactionDate: null,
      setCustomTransactionDate: (date) => set({ customTransactionDate: date }),
    }),
    {
      name: "pos-transaction-settings", // key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
