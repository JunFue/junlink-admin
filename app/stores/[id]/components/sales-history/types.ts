// app/transactions/types.ts

// Matches the 'transactions' array in done.ts
export interface TransactionItem {
  transactionNo?: string; // Optional: helpful to link line items to a specific receipt
  barcode: string;
  ItemName: string;
  unitPrice: number;
  discount: number;
  quantity: number;
  totalPrice: number;
  transactionTime: string;
}

// Matches the 'paymentInfo' object in done.ts
export interface PaymentRecord {
  id: string;
  transactionNo: string;
  transactionTime: string;
  customerName: string;
  amountRendered: number; // Mapped from "Amount Rendered"
  voucher: number; // Mapped from "Voucher"
  grandTotal: number;
  change: number; // Mapped from "Change"
}
