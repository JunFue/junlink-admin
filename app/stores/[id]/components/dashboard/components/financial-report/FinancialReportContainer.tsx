"use client";

import dayjs from "dayjs";
import { DateColumnFilter } from "@/app/stores/[id]/components/cashout-records/components/shared/DateColumnFilter";
import { useFinancialReport } from "../../hooks/useFinancialReport";
import { useDashboardDateStore } from "../../store/useDashboardDateStore";
import { FinancialReportTable } from "./FinancialReportTable";
import { CashFlow } from "./CashFlow";

export const FinancialReportContainer = ({ storeId }: { storeId: string }) => {
  const { startDate, endDate, setDateRange, hasHydrated } = useDashboardDateStore();
  const { data, isLoading } = useFinancialReport(storeId, startDate, endDate);

  return (
    <div className="space-y-6 bg-slate-900 shadow-lg p-6 border border-slate-800 rounded-xl text-white">
      {/* --- Section 1: Financial Summary Report --- */}
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col">
            <h2 className="font-bold text-emerald-400 text-2xl">
              Financial Report
            </h2>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>Selected Range:</span>
              <span className="text-slate-200">
                {hasHydrated && startDate && endDate
                  ? `${dayjs(startDate).format("MMM D")} - ${dayjs(
                      endDate
                    ).format("MMM D, YYYY")}`
                  : "Loading Range..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DateColumnFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={setDateRange}
              align="end"
            />
          </div>
        </div>

        <FinancialReportTable data={data} isLoading={isLoading} />

        <div className="flex sm:flex-row flex-col justify-center gap-2 sm:gap-6 mt-2 text-slate-500 text-xs text-center">
          <span>
            Forwarded = Balance before {dayjs(startDate).format("MMM D")}
          </span>
          <span className="font-mono text-emerald-500/80">
            (Total Forwarded + Total Gross) - Total Expenses = Total Cash on
            Hand
          </span>
        </div>
      </div>

      {/* --- Divider --- */}
      <hr className="my-8 border-slate-800" />

      {/* --- Section 2: Cash Flow Ledger --- */}
      <div>
        <h3 className="mb-4 font-bold text-slate-300 text-xl">
          Cash Flow Ledger
        </h3>
        <CashFlow storeId={storeId} startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
};

