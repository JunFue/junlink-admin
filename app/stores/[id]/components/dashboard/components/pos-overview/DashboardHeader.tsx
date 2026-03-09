"use client";

import { Calendar, Clock, RefreshCcw, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardHeaderProps {
  storeName?: string;
  today?: string;
  time?: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isHistoricalView?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenCashFlow?: () => void;
}

export function DashboardHeader({
  storeName,
  today,
  time,
  selectedDate,
  onDateChange,
  isHistoricalView,
  onRefresh,
  isRefreshing,
  onOpenCashFlow,
}: DashboardHeaderProps) {
  const handlePrevDay = () => {
    if (!selectedDate) return;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day - 1);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day + 1);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onDateChange(newDate);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end mb-6">

      <div className="flex flex-wrap items-center gap-2">
        {onOpenCashFlow && (
          <button
            onClick={onOpenCashFlow}
            className="flex items-center gap-2 bg-card hover:bg-muted px-3 py-2 border border-input rounded-lg text-sm font-medium text-foreground shadow-sm transition-all active:scale-[0.98] h-[38px]"
          >
            <BookOpen size={16} className="text-emerald-500" />
            <span className="hidden sm:inline">Cash Flow Ledger</span>
          </button>
        )}

        {/* Live Time Display */}
        {time && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-card border border-input rounded-lg text-sm font-mono text-muted-foreground shadow-sm h-[38px]">
            <Clock size={16} />
            <span>{time}</span>
          </div>
        )}

        {/* Date Filter */}
        <div className="flex items-center gap-1 group">
          <button
            onClick={handlePrevDay}
            className="p-2 bg-card border border-input rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm active:scale-95 flex items-center justify-center h-[38px] w-[38px]"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="relative group">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-3 pr-3 py-2 h-[38px] bg-card border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm transition-all hover:border-muted-foreground/50"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 bg-card border border-input rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm active:scale-95 flex items-center justify-center h-[38px] w-[38px]"
            title="Next Day"
            disabled={today ? selectedDate === today : false}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 bg-card border border-input rounded-lg flex items-center justify-center h-[38px] w-[38px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            title="Refresh Dashboard"
          >
            <RefreshCcw size={18} className={isRefreshing ? "animate-spin text-primary" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}
