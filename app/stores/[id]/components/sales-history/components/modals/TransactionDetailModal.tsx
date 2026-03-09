"use client";

import React, { useEffect, useState } from "react";
import { X, Printer, Loader2, Info, ReceiptText } from "lucide-react";
import { getInvoiceDetails, DetailedInvoice } from "@/app/stores/[id]/components/shared/actions/transactions";

interface TransactionDetailModalProps {
  invoiceNo: string;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  invoiceNo,
  onClose,
}) => {
  const [data, setData] = useState<DetailedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getInvoiceDetails(invoiceNo);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load transaction details.");
      }
      setLoading(false);
    };

    fetchData();
  }, [invoiceNo]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoiceNo) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col bg-card text-foreground shadow-2xl border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Invoice Details</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col flex-1 justify-center items-center gap-4 h-full min-h-[250px]">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-medium text-muted-foreground animate-pulse">Fetching details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col flex-1 justify-center items-center gap-2 h-full text-red-500">
              <Info className="w-10 h-10" />
              <p>{error}</p>
            </div>
          ) : data ? (
            <div className="receipt-content">
              {/* Summary Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Invoice Number</span>
                    <span className="font-mono font-bold text-lg">{data.invoice_no}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Date & Time</span>
                    <span className="font-medium">{new Date(data.transaction_time).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Store</span>
                    <span className="font-medium">{data.store_name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Customer</span>
                    <span className="font-medium">{data.customer_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Cashier</span>
                    <span className="font-medium">{data.cashier_name}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="mb-4 font-bold text-sm uppercase tracking-wider">Items Purchased</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left">Item Name</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items.map((item) => (
                        <tr key={item.transaction_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{item.item_name}</span>
                              <span className="text-muted-foreground text-xs font-mono">{item.sku}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">â‚±{item.sales_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">â‚±{item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="flex justify-end">
                <div className="space-y-2 w-full max-w-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Rendered</span>
                    <span>â‚±{data.amount_rendered.toFixed(2)}</span>
                  </div>
                  {data.voucher > 0 && (
                    <div className="flex justify-between text-sm text-primary font-medium">
                      <span>Voucher Applied</span>
                      <span>- â‚±{data.voucher.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t flex justify-between font-bold text-lg">
                    <span className="text-foreground">Grand Total</span>
                    <span className="text-primary">â‚±{(data.amount_rendered + data.voucher - data.change).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-500 font-bold">
                    <span>Change</span>
                    <span>â‚±{data.change.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 bg-muted/20 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-all font-medium text-sm"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={!data}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium text-sm disabled:opacity-50"
          >
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          .receipt-content, .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .receipt-content .text-muted-foreground {
            color: #666 !important;
          }
          .receipt-content .text-primary {
            color: black !important;
            font-weight: bold;
          }
          .receipt-content .border-border {
            border-color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

