"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAddCashout, useClassifications, useRemittanceCategories } from "@/app/transaction/hooks/useCashouts";
import type { Expense } from "@/lib/types/database";

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

type CashoutType = 'COGS' | 'OPEX' | 'REMITTANCE';

export default function CashoutModal({ isOpen, onClose, storeId }: CashoutModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<CashoutType>('OPEX');
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [classificationId, setClassificationId] = useState("");
  const [remittanceId, setRemittanceId] = useState("");

  const addCashoutMutation = useAddCashout();
  const { data: classifications } = useClassifications(storeId);
  const { data: remittanceCategories } = useRemittanceCategories();

  // Reset dependent fields when type changes
  useEffect(() => {
    setClassificationId("");
    setRemittanceId("");
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    if (type === 'OPEX' && !classificationId) {
      alert("Please select a classification for OPEX.");
      return;
    }
    
    if (type === 'REMITTANCE' && !remittanceId) {
      alert("Please select a remittance category.");
      return;
    }

    const payload: Partial<Expense> = {
      store_id: storeId,
      transaction_date: date,
      cashout_type: type,
      amount: Number(amount),
      receipt_no: receipt || null,
      source: source || null,
      notes: notes || null,
      classification_id: type === 'OPEX' ? classificationId : null,
      remittance_category_id: type === 'REMITTANCE' ? remittanceId : null,
    };

    addCashoutMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        // Reset form
        setDate(new Date().toISOString().split('T')[0]);
        setType('OPEX');
        setAmount("");
        setReceipt("");
        setSource("");
        setNotes("");
        setClassificationId("");
        setRemittanceId("");
      },
      onError: (err: any) => {
        alert(err.message || "Failed to add cashout");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-foreground">Record Cashout</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cashout Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CashoutType)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="COGS">COGS (Cost of Goods Sold)</option>
              <option value="OPEX">OPEX (Operating Expenses)</option>
              <option value="REMITTANCE">Remittance</option>
            </select>
          </div>

          {type === 'OPEX' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-foreground">Subcategory (Classification)</label>
              <select
                required
                value={classificationId}
                onChange={(e) => setClassificationId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Subcategory...</option>
                {classifications?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'REMITTANCE' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-foreground">Remittance Category</label>
              <select
                required
                value={remittanceId}
                onChange={(e) => setRemittanceId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Remittance Category...</option>
                {remittanceCategories?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Receipt / Ref No. <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <input
                type="text"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                placeholder="e.g. INV-1234"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Source <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Petty Cash"
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes <span className="text-muted-foreground font-normal">(Optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-card">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addCashoutMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addCashoutMutation.isPending ? "Recording..." : "Record Cashout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
