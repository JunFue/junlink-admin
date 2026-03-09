import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import dayjs from "dayjs";

interface DashboardDateState {
  startDate: string;
  endDate: string;
  hasHydrated: boolean; // Tracks if localStorage has been read
  setDateRange: (start: string, end: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useDashboardDateStore = create<DashboardDateState>()(
  persist(
    (set) => ({
      // Default to current month
      startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
      hasHydrated: false,

      setDateRange: (start, end) => set({ startDate: start, endDate: end }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "dashboard-date-storage", // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      // This function runs when the store is rehydrated from local storage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
