"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { FinancialReportItem } from "../../lib/types";
import { financialReportColumns } from "./FinancialReportColumns";

interface FinancialReportTableProps {
  data: FinancialReportItem[];
  isLoading: boolean;
}

export const FinancialReportTable = ({ data, isLoading }: FinancialReportTableProps) => {
  const table = useReactTable({
    data,
    columns: financialReportColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b-2 border-slate-700">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3 px-4 text-sm uppercase tracking-wider">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          {/* Body */}
          <tbody className="bg-slate-900/50 text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={financialReportColumns.length} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-800 hover:bg-slate-800/80 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={financialReportColumns.length} className="h-24 text-center text-slate-500">
                  No data for this range.
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer (Totals) */}
          {!isLoading && data.length > 0 && (
            <tfoot className="bg-slate-800/80 border-t-2 border-emerald-500/50">
              {table.getFooterGroups().map((footerGroup) => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <td key={header.id} className="py-4 px-4">
                      {flexRender(header.column.columnDef.footer, header.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};