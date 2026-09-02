"use client";

import React from "react";
import { StandardSelect } from "@/app/stores/[id]/components/shared/components/reusables/StandardSelect";
import { ColumnDef } from "@tanstack/react-table";
import { CashoutRecord, CashoutType } from "../../lib/cashout.api";
import { Trash2, ArrowUpDown, Truck, Lightbulb, ArrowRight, Store, Edit2, Check, X as CloseX, Loader2 } from "lucide-react";
import { formatCurrency } from "@/app/stores/[id]/components/shared/lib/utils/currency";

export interface CashoutTableMeta {
  editingRowId: string | null;
  setEditingRowId: (id: string | null) => void;
  updateData: (id: string, values: Partial<CashoutRecord>) => Promise<boolean>;
  isUpdating?: boolean;
}

export const getColumns = (
  onDelete?: (id: string) => void,
  onEdit?: (record: CashoutRecord) => void,
  canManage: boolean = false,
  isMultiDrawer: boolean = false
): ColumnDef<CashoutRecord>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="w-4 h-4 opacity-50" />
        </button>
      );
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      if (isEditing) {
        return (
          <input
            type="date"
            defaultValue={row.original.date}
            className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            onChange={(e) => {
               // We'll handle save via the Save button, but we need to track values. 
               // For simplicity in this common react-table pattern, we can use a local state in the row or just query the DOM on save.
               // Let's use name attributes and handle in Save.
            }}
            name="date"
          />
        );
      }

      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.getValue("date")}</span>
          <span className="text-xs text-muted-foreground">{row.original.timestamp}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row, table }) => {
      const category = row.getValue("category") as string;
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      if (isEditing) {
        return (
          <StandardSelect 
            name="category"
            defaultValue={category}
            className="py-1 px-2 h-8"
          >
            <option value="COGS" className="bg-background">COGS</option>
            <option value="OPEX" className="bg-background">OPEX</option>
            <option value="REMITTANCE" className="bg-background">REMITTANCE</option>
          </StandardSelect>
        );
      }
      
      let style = "bg-muted text-muted-foreground border-border";
      let Icon = Store;

      if (category === "COGS") {
        style = "bg-orange-500/10 text-orange-500 border-orange-500/20";
        Icon = Truck;
      } else if (category === "OPEX") {
        style = "bg-purple-500/10 text-purple-500 border-purple-500/20";
        Icon = Lightbulb;
      } else if (category === "REMITTANCE") {
        style = "bg-green-500/10 text-green-500 border-green-500/20";
        Icon = ArrowRight;
      }

      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
          <Icon size={12} />
          {category}
        </span>
      );
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row, table }) => {
      const record = row.original;
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      let mainText = "N/A";
      let subText = null;

      if (record.category === "OPEX") {
        mainText = record.expenseCategory || "Unclassified";
      } else if (record.category === "REMITTANCE") {
        mainText = record.subTypeLabel || "Transfer";
      } else {
        // COGS
        mainText = record.product || "No Product Specified";
        
        // If in unified mode and the 'product' is just the fallback drawer name,
        // show 'N/A' (user says 'unnecessary to display overall').
        if (!isMultiDrawer && record.product === record.drawerName) {
          mainText = "N/A";
        }
      }

      if (record.notes) {
        subText = record.notes;
      }

      if (isEditing) {
        return (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <input 
              name="product"
              defaultValue={record.product}
              placeholder="Product / Detail"
              className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
             <input 
              name="notes"
              defaultValue={record.notes}
              placeholder="Notes (Optional)"
              className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <div className="font-medium text-foreground flex items-center gap-2">
            {mainText}
          </div>
          {subText && (
            <div className="text-muted-foreground text-xs mt-1 line-clamp-1 max-w-[200px]" title={subText}>
              {subText}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "reference",
    header: "Reference / Supplier",
    cell: ({ row, table }) => {
      const record = row.original;
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      if (isEditing) {
        if (record.category === "COGS") {
          return (
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              <input
                name="manufacturer"
                defaultValue={record.manufacturer || ''}
                placeholder="Manufacturer"
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                name="receipt_no"
                defaultValue={record.receiptNo || ''}
                placeholder="Receipt / Invoice No."
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          );
        }
        if (record.category === "REMITTANCE") {
          return (
            <input
              name="referenceNo"
              defaultValue={record.referenceNo || ''}
              placeholder="Reference No."
              className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-primary min-w-[130px]"
            />
          );
        }
        return <span className="text-muted-foreground/30">-</span>;
      }

      if (record.category === "COGS") {
        return (
           <div className="flex flex-col">
            <span className="font-medium text-foreground/80">{record.manufacturer || 'Unknown Mfr.'}</span>
            <span className="text-xs font-mono text-muted-foreground">{record.receiptNo || 'NO RECEIPT'}</span>
          </div>
        );
      }
      
      if (record.category === "REMITTANCE") {
        return <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">{record.referenceNo || "-"}</span>;
      }

      return <span className="text-muted-foreground/30">-</span>;
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row, table }) => {
      const amount = parseFloat(row.getValue("amount"));
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      if (isEditing) {
        return (
          <div className="relative">
             <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₱</span>
             <input 
               name="amount"
               type="number"
               defaultValue={amount}
               className="w-24 pl-5 bg-muted border border-border rounded px-2 py-1 text-xs text-red-500 font-bold outline-none text-right focus:ring-1 focus:ring-red-500"
             />
          </div>
        );
      }

      const formatted = formatCurrency(amount, 'PHP');

      return (
        <div className="text-right font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg inline-block float-right border border-red-500/20">
          -{formatted}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row, table }) => {
      if (!canManage) return null;
      const meta = table.options.meta as CashoutTableMeta;
      const isEditing = meta?.editingRowId === row.original.id;

      const handleSaveInline = (e: React.MouseEvent) => {
        // Find inputs in the current row
        const rowElement = (e.currentTarget as HTMLElement).closest('tr');
        if (!rowElement) return;

        const inputs = rowElement.querySelectorAll('input, select');
        const values: any = {};
        inputs.forEach((input: any) => {
          if (input.name) {
            values[input.name] = input.type === 'number' ? parseFloat(input.value) : input.value;
          }
        });

        // Trigger update (optimistic) and close edit mode instantly
        meta.updateData(row.original.id, values);
        meta.setEditingRowId(null);
      };

      if (isEditing) {
        return (
          <div className="flex justify-center gap-1 animate-in fade-in duration-300">
             <button
              onClick={handleSaveInline}
              disabled={meta.isUpdating}
              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
              title="Save Changes"
            >
              {meta.isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
            <button
              onClick={() => meta.setEditingRowId(null)}
              disabled={meta.isUpdating}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
              title="Cancel"
            >
              <CloseX size={16} />
            </button>
          </div>
        );
      }
      
      return (
        <div className="flex justify-center gap-1 group-hover:opacity-100 opacity-60 transition-opacity">
          <button
            onClick={() => meta?.setEditingRowId(row.original.id)}
            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
            title="Edit Transaction"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
                if (window.confirm("Are you sure you want to delete this transaction?")) {
                    onDelete?.(row.original.id);
                }
            }}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            title="Delete Transaction"
          >
            <Trash2 size={16} />
          </button>
        </div>
      );
    },
  },
];

