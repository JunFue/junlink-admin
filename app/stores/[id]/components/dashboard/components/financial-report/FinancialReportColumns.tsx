"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FinancialReportItem } from "../../lib/types";

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const financialReportColumns: ColumnDef<FinancialReportItem>[] = [
  {
    accessorKey: "category",
    header: "Category",
    cell: (info) => (
      <span className="font-medium text-slate-200">
        {info.getValue<string>()}
      </span>
    ),
    footer: () => <span className="font-bold text-emerald-400">TOTALS</span>,
  },
  {
    accessorKey: "cash_forwarded",
    header: () => (
      <div className="text-blue-300 text-right">Cash Forwarded</div>
    ),
    cell: (info) => (
      <div className="text-slate-400 text-right">
        {formatCurrency(info.getValue<number>())}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + row.original.cash_forwarded, 0);
      return (
        <div className="font-bold text-blue-200 text-right">
          {formatCurrency(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "gross_income",
    header: () => (
      <div className="text-emerald-300 text-right">Gross Income</div>
    ),
    cell: (info) => (
      <div className="text-emerald-100 text-right">
        {formatCurrency(info.getValue<number>())}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + row.original.gross_income, 0);
      return (
        <div className="font-bold text-emerald-200 text-right">
          {formatCurrency(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "expenses",
    header: () => <div className="text-rose-300 text-right">Expenses</div>,
    cell: (info) => (
      <div className="text-rose-100 text-right">
        {formatCurrency(info.getValue<number>())}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + row.original.expenses, 0);
      return (
        <div className="font-bold text-rose-200 text-right">
          {formatCurrency(total)}
        </div>
      );
    },
  },
  {
    accessorKey: "cash_on_hand",
    header: () => (
      <div className="font-bold text-white text-right">Cash on Hand</div>
    ),
    cell: (info) => (
      <div className="font-bold text-slate-100 text-right">
        {formatCurrency(info.getValue<number>())}
      </div>
    ),
    footer: ({ table }) => {
      const total = table
        .getFilteredRowModel()
        .rows.reduce((sum, row) => sum + row.original.cash_on_hand, 0);
      return (
        <div className="font-bold text-white text-xl text-right decoration-2 decoration-emerald-500 underline underline-offset-4">
          {formatCurrency(total)}
        </div>
      );
    },
  },
];
