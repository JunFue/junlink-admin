import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";

interface DateColumnFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  align?: "center" | "start" | "end";
}

export const DateColumnFilter = ({
  startDate,
  endDate,
  onDateChange,
  align = "start",
}: DateColumnFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Sync temp state with actual props when opening
  useEffect(() => {
    if (isOpen) {
      setTempStart(startDate);
      setTempEnd(endDate);

      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
    }
  }, [isOpen, startDate, endDate]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleApply = () => {
    onDateChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const startStr = formatDate(start);
    const endStr = formatDate(end);

    setTempStart(startStr);
    setTempEnd(endStr);
    onDateChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startStr = formatDate(start);
    const endStr = formatDate(end);

    setTempStart(startStr);
    setTempEnd(endStr);
    onDateChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart("");
    setTempEnd("");
    onDateChange("", "");
    setIsOpen(false);
  };

  const dropdown = isOpen
    ? createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-9998"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Popover */}
          <div
            className="fixed z-9999 flex flex-col gap-4 bg-card shadow-2xl backdrop-blur-md p-4 border border-border rounded-xl w-72"
            style={{
              top: coords.top,
              left:
                align === "end"
                  ? coords.left - (288 - (buttonRef.current?.offsetWidth || 0))
                  : align === "center"
                  ? coords.left - (144 - (buttonRef.current?.offsetWidth || 0) / 2)
                  : coords.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-border border-b">
              <span className="font-semibold text-foreground text-sm">
                Filter Date Range
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date Inputs */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground text-xs">Start</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="bg-transparent px-2 py-1.5 border border-border focus:border-emerald-500 rounded outline-none w-full text-foreground text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground text-xs">End</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="bg-transparent px-2 py-1.5 border border-border focus:border-emerald-500 rounded outline-none w-full text-foreground text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-semibold text-white text-xs transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
              >
                Apply Filter
              </button>
            </div>

            {/* Presets Grid */}
            <div className="gap-2 grid grid-cols-2 pt-3 border-border border-t">
              <button
                onClick={() => handlePreset(0)}
                className="bg-muted hover:bg-emerald-900/30 px-3 py-2 border border-border rounded font-medium text-muted-foreground hover:text-emerald-400 text-xs transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => handlePreset(7)}
                className="bg-muted hover:bg-emerald-900/30 px-3 py-2 border border-border rounded font-medium text-muted-foreground hover:text-emerald-400 text-xs transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={handleThisMonth}
                className="col-span-2 bg-muted hover:bg-emerald-900/30 px-3 py-2 border border-border rounded font-medium text-muted-foreground hover:text-emerald-400 text-xs transition-colors"
              >
                This Month
              </button>
              <button
                onClick={handleClear}
                className="col-span-2 bg-muted hover:bg-red-900/30 mt-1 px-3 py-2 border border-border rounded font-medium text-muted-foreground hover:text-red-400 text-xs transition-colors"
              >
                Show All History
              </button>
            </div>
          </div>
        </>
      , document.body)
    : null;

  return (
    <div className="inline-block relative" ref={buttonRef}>
      {/* Header Trigger */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-muted ${
          isOpen || (startDate && endDate)
            ? "text-emerald-400"
            : "text-muted-foreground"
        }`}
      >
        <span>Date</span>
        <CalendarDays className="w-4 h-4" />
      </div>

      {dropdown}
    </div>
  );
};
