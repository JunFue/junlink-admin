"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Lightbulb, ArrowRight, X, DollarSign, Save, FileText, Unlock } from 'lucide-react';
import { CashoutInput, CashoutType, CashoutRecord } from '../../lib/cashout.api';
import { DrawerSelect } from "../shared/DrawerSelect";
import { CogsForm } from './CogsForm';
import { OpexForm } from './OpexForm';
import { RemittanceForm } from './RemittanceForm';
import { useExpenses } from '../../hooks/useExpenses'; // Reuse the hook logic
import { useTransactionStore } from '@/app/stores/[id]/components/shared/store/useTransactionStore';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchDrawerMode } from '@/app/stores/[id]/components/dashboard/lib/dashboard.api';
import { useDrawers } from '../../hooks/useDrawers';

interface CashOutModalProps {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
  editData?: CashoutRecord | null;
}

const CashOutModal = ({ storeId, isOpen, onClose, editData }: CashOutModalProps) => {
  const { addExpense, editExpense, isSubmitting } = useExpenses(storeId);
  const { customTransactionDate } = useTransactionStore();
  const [activeTab, setActiveTab] = useState<CashoutType>('COGS'); 
  const [selectedDrawerId, setSelectedDrawerId] = useState<string>("");
  
  // â”€â”€â”€ Drawer Mode & Drawers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { drawers, isLoading: isLoadingDrawers } = useDrawers(storeId);
  const { data: drawerMode = "unified" } = useQuery({
    queryKey: ["drawer-mode", storeId],
    queryFn: () => fetchDrawerMode(storeId),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const isMultiDrawer = drawerMode === "multiple";

  // Auto-select drawer in Unified mode
  useEffect(() => {
    if (!isMultiDrawer && drawers.length > 0 && !selectedDrawerId) {
      setSelectedDrawerId(drawers[0].id);
    }
  }, [isMultiDrawer, drawers, selectedDrawerId]);
  
  // Initialize with empty values to avoid hydration mismatch
  const [baseData, setBaseData] = useState<{amount: string, date: string, notes: string}>({
      amount: '',
      date: '',
      notes: ''
  });

  // Client-side initialization of data
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Edit Mode
        setBaseData({
          amount: editData.amount.toString(),
          date: editData.date,
          notes: editData.notes || ''
        });
        setActiveTab(editData.category);
        setSelectedDrawerId(editData.categoryId || "");
        
        // Populate specific data based on category
        setSpecificData({
          classification_id: editData.classificationId,
          expenseCategory: editData.expenseCategory,
          product: editData.product,
          manufacturer: editData.manufacturer,
          receipt_no: editData.receiptNo,
          referenceNo: editData.referenceNo,
          subTypeLabel: editData.subTypeLabel
        });
      } else if (!baseData.date) {
        // Create Mode
        const initialDate = customTransactionDate 
          ? dayjs(customTransactionDate).format("YYYY-MM-DD")
          : new Date().toISOString().split('T')[0];

        setBaseData(prev => ({
          ...prev,
          date: initialDate
        }));
      }
    }
  }, [isOpen, editData, customTransactionDate]);

  const [specificData, setSpecificData] = useState<Partial<CashoutInput>>({});

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!baseData.amount || parseFloat(baseData.amount) <= 0) return alert("Please enter a valid amount");
    if (!selectedDrawerId) return alert("Please select a drawer to withdraw from");

    const payload: CashoutInput = {
      transaction_date: baseData.date,
      amount: parseFloat(baseData.amount),
      notes: baseData.notes,
      cashout_type: activeTab,
      category_id: selectedDrawerId,
      ...specificData
    };

    if (activeTab === 'OPEX' && !payload.classification_id) {
        return alert("Please select an expense category");
    }

    try {
        if (editData?.id) {
          editExpense(editData.id, payload);
        } else {
          addExpense(payload);
        }
        handleClose();
    } catch (e) {
        console.error("Failed to save transaction:", e);
    }
  };

  const handleClose = () => {
    setBaseData({ amount: '', date: '', notes: '' });
    setSpecificData({});
    setActiveTab('COGS');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, nextField?: string) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return;
      e.preventDefault();
      
      if (nextField) {
        let nextInput = document.querySelector(`[name="${nextField}"]`) as HTMLElement;
        
        // Skip date if it's disabled or readonly
        if (nextField === "date" && customTransactionDate) {
            const skipTo = activeTab === 'COGS' ? 'receipt_no' : 'notes';
            nextInput = document.querySelector(`[name="${skipTo}"]`) as HTMLElement;
        }

        if (nextInput) {
            nextInput.focus();
            if (nextInput instanceof HTMLSelectElement) {
                try { (nextInput as any).showPicker(); } catch(err){}
            }
        }
      } else {
        handleSave();
      }
    }
  };

  const renderTabButton = (id: CashoutType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-4 flex-1 justify-center transition-all border-b-2 text-sm font-semibold ${
        activeTab === id 
          ? 'border-primary text-primary bg-primary/5' 
          : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-border bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="bg-red-100/50 p-2 rounded-lg text-red-600">
                <DollarSign size={20} strokeWidth={3} />
              </div>
              {editData ? "Edit Cash Out" : "Record Cash Out"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 ml-11">Manage your store's outgoing cash flow and expenses</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-border bg-muted/30">
          {renderTabButton('COGS', 'Cost of Goods', <Truck size={18} />)}
          {renderTabButton('OPEX', 'Op. Expenses', <Lightbulb size={18} />)}
          {renderTabButton('REMITTANCE', 'Remittance', <ArrowRight size={18} />)}
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-card">
          {isMultiDrawer && (
            <div className="mb-6">
                 <DrawerSelect 
                    storeId={storeId}
                    value={selectedDrawerId}
                    onChange={setSelectedDrawerId}
                 />
            </div>
          )}
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount Taken</label>
                <input
                  type="number"
                  name="amount"
                  className="px-5 w-full border-input rounded-xl shadow-sm focus:ring-2 focus:ring-ring focus:border-ring text-3xl font-bold py-3 border text-foreground bg-muted/20 focus:bg-card transition-colors placeholder-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  value={baseData.amount}
                  onChange={(e) => setBaseData({...baseData, amount: e.target.value})}
                  onKeyDown={(e) => handleKeyDown(e, "date")}
                  autoFocus
                />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Date</label>
              <input 
                type="date"
                name="date"
                className={`w-full border-input rounded-xl shadow-sm focus:ring-ring focus:border-ring py-4 px-3 border bg-muted/20 text-foreground text-sm ${customTransactionDate ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                value={baseData.date}
                onChange={(e) => setBaseData({...baseData, date: e.target.value})}
                onKeyDown={(e) => handleKeyDown(e, activeTab === 'COGS' ? 'receipt_no' : 'notes')}
                disabled={!!customTransactionDate}
              />
            </div>
          </div>

          {customTransactionDate && (
            <div className="mb-6 flex items-start gap-3 bg-amber-500/10 p-4 border border-amber-500/20 rounded-xl text-amber-600 text-[11px] leading-tight">
               <Unlock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
               <span>
                  <span className="font-bold uppercase tracking-tighter">Backdating Active:</span> This transaction will be recorded on {dayjs(customTransactionDate).format("MMMM D, YYYY")}. Ensure this is correct.
               </span>
            </div>
          )}

          <div className="h-px bg-border w-full mb-6"></div>

          {activeTab === 'COGS' && <CogsForm data={specificData} onChange={(d) => setSpecificData({...specificData, ...d})} />}
          {activeTab === 'OPEX' && <OpexForm storeId={storeId} data={specificData} onChange={(d) => setSpecificData({...specificData, ...d})} />}
          {activeTab === 'REMITTANCE' && <RemittanceForm data={specificData} onChange={(d) => setSpecificData({...specificData, ...d})} />}

          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
                Description / Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
                <textarea
                name="notes"
                className="w-full border-input rounded-xl shadow-sm focus:ring-ring focus:border-ring border p-3 px-4 text-sm bg-muted/20 focus:bg-card transition-colors text-foreground"
                rows={3}
                placeholder="Add any additional details regarding this transaction..."
                value={baseData.notes}
                onChange={(e) => setBaseData({...baseData, notes: e.target.value})}
                onKeyDown={(e) => handleKeyDown(e)}
                />
          </div>
        </div>

        <div className="p-5 border-t border-border bg-muted/20 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
                All fields marked with * are required
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleClose}
                    className="px-6 py-2.5 text-foreground bg-card border border-border rounded-xl hover:bg-muted font-semibold text-sm transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-semibold text-sm flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                >
                    <Save size={18} />
                    {isSubmitting ? 'Saving...' : 'Confirm Cashout'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export { CashOutModal };

