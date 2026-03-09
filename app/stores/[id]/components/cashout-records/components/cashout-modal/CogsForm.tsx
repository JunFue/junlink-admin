"use client";

import { Truck } from "lucide-react";
import React from "react";
import { CashoutInput } from "../../lib/cashout.api";

interface CogsFormProps {
  data: Partial<CashoutInput>;
  onChange: (data: Partial<CashoutInput>) => void;
}

export const CogsForm = ({ data, onChange }: CogsFormProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextField: string) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return;
      e.preventDefault();
      
      const nextInput = document.querySelector(`[name="${nextField}"]`) as HTMLElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-2 text-primary bg-primary/10 w-fit px-3 py-1 rounded-full text-xs font-medium">
        <Truck size={14} /> Supplier Information
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Receipt / Invoice No.</label>
          <input 
            name="receipt_no"
            className="w-full border-input rounded-lg p-2.5 text-sm focus:ring-ring focus:border-ring border bg-muted/20 focus:bg-card text-foreground" 
            placeholder="INV-0001"
            value={data.receipt_no || ''}
            onChange={(e) => onChange({...data, receipt_no: e.target.value})}
            onKeyDown={(e) => handleKeyDown(e, "manufacturer")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Manufacturer</label>
          <input 
            name="manufacturer"
            className="w-full border-input rounded-lg p-2.5 text-sm focus:ring-ring focus:border-ring border bg-muted/20 focus:bg-card text-foreground" 
            placeholder="e.g. Nestlé"
            value={data.manufacturer || ''}
            onChange={(e) => onChange({...data, manufacturer: e.target.value})}
            onKeyDown={(e) => handleKeyDown(e, "brand")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Brand</label>
          <input 
            name="brand"
            className="w-full border-input rounded-lg p-2.5 text-sm focus:ring-ring focus:border-ring border bg-muted/20 focus:bg-card text-foreground" 
            placeholder="e.g. KitKat"
            value={data.brand || ''}
            onChange={(e) => onChange({...data, brand: e.target.value})}
            onKeyDown={(e) => handleKeyDown(e, "product")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Product Name</label>
          <input 
            name="product"
            className="w-full border-input rounded-lg p-2.5 text-sm focus:ring-ring focus:border-ring border bg-muted/20 focus:bg-card text-foreground" 
            placeholder="e.g. Chunky Bar"
            value={data.product || ''}
            onChange={(e) => onChange({...data, product: e.target.value})}
            onKeyDown={(e) => handleKeyDown(e, "specs")}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Specifications / Details</label>
        <textarea 
          name="specs"
          className="w-full border-input rounded-lg p-2.5 text-sm focus:ring-ring focus:border-ring border bg-muted/20 focus:bg-card text-foreground" 
          rows={2} 
          placeholder="e.g. 24 packs x 40g box"
          value={data.specs || ''}
          onChange={(e) => onChange({...data, specs: e.target.value})}
          onKeyDown={(e) => handleKeyDown(e, "notes")}
        ></textarea>
      </div>
    </div>
  );
};
