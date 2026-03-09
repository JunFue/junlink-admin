"use client";

import React, { useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { CashoutInput } from "../../lib/cashout.api";
import { useRemittanceCategories } from "../../hooks/useRemittanceCategories";

interface RemittanceFormProps {
  data: Partial<CashoutInput>;
  onChange: (data: Partial<CashoutInput>) => void;
}

const generateRefNumber = () => `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

export const RemittanceForm = ({ data, onChange }: RemittanceFormProps) => {
  const { referenceNo, remittance_category_id } = data;
  const { categories, isLoading } = useRemittanceCategories();

  useEffect(() => {
    // Generate ref number on mount if not present
    if (!referenceNo) {
        onChange({ ...data, referenceNo: generateRefNumber() });
    }
  }, []);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!remittance_category_id && categories.length > 0) {
      const first = categories[0];
      onChange({
        ...data,
        remittance_category_id: first.id,
        subType: first.name,
        subTypeLabel: first.name,
      });
    }
  }, [categories, remittance_category_id]);

  const handleTypeChange = (id: string) => {
      const cat = categories.find(c => c.id === id);
      onChange({
          ...data, 
          remittance_category_id: id,
          subType: cat?.name,
          subTypeLabel: cat?.name,
      });
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-muted/30 border border-border p-4 rounded-xl flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
                <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">System Reference</span>
                <span className="text-xs text-muted-foreground">Auto-generated for audit</span>
            </div>
         </div>
         <span className="font-mono bg-card px-3 py-1.5 rounded-lg border border-border text-foreground text-sm font-bold shadow-sm tracking-wide select-all">{referenceNo}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Transfer Destination</label>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No remittance categories found. Please add categories in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <label 
                  key={cat.id} 
                  className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                      remittance_category_id === cat.id 
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' 
                      : 'bg-card hover:bg-muted/50 hover:border-border'
                  }`}
              >
                <input 
                  type="radio" 
                  name="remitType" 
                  className="sr-only"
                  checked={remittance_category_id === cat.id}
                  onChange={() => handleTypeChange(cat.id)}
                />
                {/* Custom Radio Circle */}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${remittance_category_id === cat.id ? 'border-primary' : 'border-muted-foreground'}`}>
                    {remittance_category_id === cat.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>

                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
