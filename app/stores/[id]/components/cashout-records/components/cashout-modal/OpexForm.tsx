"use client";

import React, { useState } from "react";
import { Store, Plus, Settings } from "lucide-react";
import { CashoutInput } from "../../lib/cashout.api";
import { useClassifications } from "../../hooks/useClassifications";
import { ClassificationManager, ICON_MAP } from "./ClassificationManager";

interface OpexFormProps {
  storeId: string;
  data: Partial<CashoutInput>;
  onChange: (data: Partial<CashoutInput>) => void;
}

export const OpexForm = ({ storeId, data, onChange }: OpexFormProps) => {
  const { classifications, isLoading } = useClassifications(storeId);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleSelect = (cls: any) => {
      onChange({
          ...data,
          classification_id: cls.id,
          expenseCategory: cls.name,
          icon: cls.icon || 'Store'
      });
  }

  if (isLoading) {
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
            {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-muted rounded-xl border border-border"></div>
            ))}
        </div>
      );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
       <div className="flex justify-between items-center mb-4">
         <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Expense Category</label>
         <button 
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-all bg-primary/5 px-2 py-1 rounded-md border border-primary/20"
         >
             <Settings size={12} />
             Manage
         </button>
       </div>
       
       <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
         {classifications.map((cat) => (
           <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border duration-200 group ${
              data.classification_id === cat.id 
                ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1' 
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
            }`}
           >
             <div className={`mb-2 p-2 rounded-full transition-colors ${data.classification_id === cat.id ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/20'}`}>
               {ICON_MAP[cat.icon || 'Store'] || <Store size={20}/>} 
             </div>
             <span className="text-[10px] font-bold text-center uppercase tracking-tight leading-tight px-1">{cat.name}</span>
           </button>
         ))}
         
         <button 
           type="button"
           onClick={() => setIsManagerOpen(true)}
           className="flex flex-col items-center justify-center p-3 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
         >
           <Plus size={20} className="mb-2"/>
           <span className="text-[10px] font-bold uppercase">New</span>
         </button>
       </div>

       <ClassificationManager 
         storeId={storeId}
         isOpen={isManagerOpen}
         onClose={() => setIsManagerOpen(false)}
       />
    </div>
  );
};
