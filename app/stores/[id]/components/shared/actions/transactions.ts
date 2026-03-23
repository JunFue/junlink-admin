"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// --- 1. Domain Interfaces ---

export interface TransactionHeader {
  customer_name: string | null;
  amount_rendered: number;
  voucher: number;
  grand_total: number;
  change: number;
  // cashier_name is removed from here because the DB gets it from auth.uid()
  // transaction_no is removed because the DB generates the invoice_no
  transaction_time?: string | null; // Optional - for backdating
  customer_id?: string | null; // Optional - for customer association
}

export interface TransactionItem {
  sku: string;
  item_name: string;
  sales_price?: number; // Optional input, DB looks it up
  total_price: number;
  discount: number;
  quantity: number;
}

export interface TransactionFilters {
  startDate?: string | null;
  endDate?: string | null;
  transactionNo?: string;
  barcode?: string;
  ItemName?: string;
  search?: string;
}

interface ActionResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  count?: number;
}

// --- 2. The Core Function (Refactored) ---

export async function processTransaction(
  headerPayload: TransactionHeader,
  itemsPayload: TransactionItem[]
): Promise<ActionResponse<{ invoice_no: string; payment_id: string }>> {
  const authClient = await createClient();
  const supabase = createAdminClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    // 1. Call the Database RPC
    // We do NOT manually insert into 'payments' or 'transactions' anymore.
    // The RPC handles the transaction, ID generation, and linking.
    const { data, error } = await supabase.rpc(
      "insert_new_payment_and_transaction",
      {
        header: headerPayload,
        items: itemsPayload,
      }
    );

    if (error) {
      console.error("âŒ RPC Transaction Error:", error);
      return { success: false, error: error.message };
    }

    // 2. Revalidate Cache
    // Clear the cache for pages that display sales history
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/expenses"); // Because vouchers might affect expenses

    // 3. Return the generated data (Invoice # and UUID)
    // The RPC returns { "payment_id": "...", "invoice_no": "..." }
    return {
      success: true,
      data: {
        invoice_no: data.invoice_no,
        payment_id: data.payment_id,
      },
    };
  } catch (err: any) {
    console.error("âŒ Unexpected Transaction Error:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

// --- 3. Query Functions (Updated for Read Operations) ---

export interface TransactionRecord {
  id: string; // UUID
  invoice_no: string;
  transaction_time: string;
  total_price: number;
  item_name: string;
  quantity: number;
  sku: string;
  payment_id: string; // The link to the parent payment
  sales_price: number;
  discount: number;
}

export async function getTransactionHistory(
  storeId: string,
  page: number = 1,
  pageSize: number = 10,
  filters: TransactionFilters = {}
): Promise<ActionResponse<TransactionRecord[]>> {
  const authClient = await createClient();
  const supabase = createAdminClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Calculate pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("store_id", storeId);

  // Apply Filters (Only if no specific identifiers are provided for a "global" search feel)
  const isGlobalSearch = !!(filters.transactionNo || filters.barcode || filters.ItemName || filters.search);

  if (!isGlobalSearch) {
    if (filters.startDate) {
      query = query.gte("transaction_time", `${filters.startDate}T00:00:00`);
    }
    if (filters.endDate) {
      query = query.lte("transaction_time", `${filters.endDate}T23:59:59`);
    }
  }

  // Handle Text Search Filters
  if (filters.transactionNo) {
    query = query.ilike("invoice_no", `%${filters.transactionNo}%`);
  }
  if (filters.barcode) {
    query = query.ilike("sku", `%${filters.barcode}%`);
  }
  if (filters.ItemName) {
    query = query.ilike("item_name", `%${filters.ItemName}%`);
  }

  const { data, error, count } = await query
    .order("transaction_time", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as TransactionRecord[]) || [], count: count || 0 };
}

export interface PaymentRecord {
  id: string; // UUID
  invoice_no: string;
  transaction_no?: string; // Fallback
  customer_name: string | null;
  grand_total: number;
  amount_paid?: number; // Fallback
  transaction_time: string;
  amount_rendered: number;
  voucher: number;
  change: number;
  cashier_id?: string; // We read ID, not name directly from this table
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  transactionNo?: string; // mapped to invoice_no
  customerName?: string;
  search?: string;
}

export async function getPaymentHistory(
  storeId: string,
  page: number,
  pageSize: number,
  filters: PaymentFilters
): Promise<ActionResponse<PaymentRecord[]>> {
  const authClient = await createClient();
  const supabase = createAdminClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("payments").select("*", { count: "exact" }).eq("store_id", storeId);

  // Apply Filters (Ignore dates if searching for a specific term for "global" database search)
  const isSearching = !!(filters.search || filters.transactionNo || filters.customerName);

  if (!isSearching) {
    if (filters.startDate) {
      query = query.gte("transaction_time", `${filters.startDate}T00:00:00`);
    }
    if (filters.endDate) {
      query = query.lte("transaction_time", `${filters.endDate}T23:59:59`);
    }
  }

  // Handle Text Search Filters
  if (filters.search) {
     query = query.or(`invoice_no.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
  } else {
    if (filters.transactionNo) {
      query = query.ilike("invoice_no", `%${filters.transactionNo}%`);
    }
    if (filters.customerName) {
      query = query.ilike("customer_name", `%${filters.customerName}%`);
    }
  }

  const { data, error, count } = await query
    .range(from, to)
    .order("transaction_time", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as PaymentRecord[]) || [], count: count || 0 };
}

export async function deletePayment(id: string): Promise<ActionResponse> {
  const authClient = await createClient();
  const supabase = createAdminClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    // 1. Delete associated transactions first to avoid orphan rows 
    // (though the DB constraint would likely block it if we didn't)
    const { error: transError } = await supabase
      .from("transactions")
      .delete()
      .eq("payment_id", id);

    if (transError) {
      console.error("âŒ Error deleting associated transactions:", transError);
      return { success: false, error: transError.message };
    }

    // 2. Delete the payment itself
    const { error: payError } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (payError) {
      console.error("âŒ Error deleting payment:", payError);
      return { success: false, error: payError.message };
    }

    // 3. Revalidate paths
    revalidatePath("/transactions");
    revalidatePath("/sales");

    return { success: true };
  } catch (err: any) {
    console.error("âŒ Unexpected Error during deletion:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

export interface DetailedTransactionItem {
  transaction_id: string;
  item_name: string;
  sku: string;
  quantity: number;
  sales_price: number;
  discount: number;
  total_price: number;
}

export interface DetailedInvoice {
  payment_id: string;
  invoice_no: string;
  transaction_no: string;
  transaction_time: string;
  amount_paid: number;
  amount_rendered: number;
  change: number;
  voucher: number;
  store_name: string;
  cashier_name: string;
  customer_name: string;
  items: DetailedTransactionItem[];
}

export async function getInvoiceDetails(
  invoiceNo: string
): Promise<ActionResponse<DetailedInvoice>> {
  const authClient = await createClient();
  const supabase = createAdminClient();

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const { data, error } = await supabase.rpc("get_invoice_details", {
      p_invoice_no: invoiceNo,
    });

    if (error) {
      console.error("âŒ RPC get_invoice_details Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DetailedInvoice };
  } catch (err: any) {
    console.error("âŒ Unexpected get_invoice_details Error:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}
