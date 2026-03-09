"use client";

import React, { FormEvent } from "react";
import { X, ArrowRight } from "lucide-react";
import type { ExpenseCategory } from "../../hooks/useDashboard";

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseAmount: string;
  setExpenseAmount: (val: string) => void;
  expenseReason: string;
  setExpenseReason: (val: string) => void;
  expenseCategory: ExpenseCategory;
  setExpenseCategory: (cat: ExpenseCategory) => void;
  onSubmit: (e: FormEvent) => void;
  isMultiDrawer: boolean;
}

export function CashoutModal({
  isOpen,
  onClose,
  expenseAmount,
  setExpenseAmount,
  expenseReason,
  setExpenseReason,
  expenseCategory,
  setExpenseCategory,
  onSubmit,
  isMultiDrawer,
}: CashoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Add Expense / Cashout
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Record money taken out of the drawer.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Amount (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  ₱
                </span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-muted/30 border border-input rounded-xl text-lg font-bold text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {/* Category Selection - Only show in Multi Drawer Mode */}
            {isMultiDrawer && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "COGS", label: "Supplier (COGS)" },
                    { id: "OPEX", label: "Expense (OPEX)" },
                    { id: "REMIT", label: "Remittance" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setExpenseCategory(cat.id as ExpenseCategory)}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                        expenseCategory === cat.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason/Description Input */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Description / Note
              </label>
              <input
                type="text"
                value={expenseReason}
                onChange={(e) => setExpenseReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/30 border border-input rounded-xl text-sm text-foreground focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                placeholder="e.g. Ice delivery, Pepsi restock..."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
            >
              Confirm Cashout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
