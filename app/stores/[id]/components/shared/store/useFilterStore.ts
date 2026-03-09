import { create } from 'zustand';

export interface DateRange {
  start: string;
  end: string;
}

interface FilterState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetDateRange: () => void;
}

const getToday = () => new Date().toISOString().split('T')[0];

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: {
    start: getToday(),
    end: getToday(),
  },
  setDateRange: (range) => set({ dateRange: range }),
  resetDateRange: () => {
    const today = getToday();
    set({ dateRange: { start: today, end: today } });
  },
}));
