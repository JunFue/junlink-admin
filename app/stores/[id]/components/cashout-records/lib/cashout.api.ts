"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const getSupabase = () => {
  return createAdminClient();
};

const getAuthClient = async () => {
  return await createClient();
};

// --- TYPES ---

// Return type for the Breakdown UI
export type ExpenseBreakdownItem = {
  classification: string;
  amount: number;
  source_name: string;
};

// Strict type for the raw DB response in the breakdown query
interface ExpenseBreakdownRow {
  amount: number;
  classification_details: {
    name: string;
  } | null;
  product_category: {
    category: string;
  } | null;
}

// Types for General Expense Management
interface ExpenseRowDB {
  id: string;
  transaction_date: string;
  source: string | null;
  // We now fetch the relation
  classification_details: {
    name: string;
  } | null;
  amount: number;
  receipt_no: string | null;
  notes: string | null;
  created_at: string;
  product_category: {
    category: string;
  } | null;
  classification_id?: string | null;
  category_id?: string | null;
}

interface RawExpenseRow extends ExpenseRowDB {
  product_category: {
    category: string;
  } | null;
  classification_details: {
    name: string;
  } | null;
  cashout_type: CashoutType | null;
  metadata: Record<string, any> | null;
  remittance_category_id: string | null;
}

// --- TYPES ---

export type CashoutType = 'COGS' | 'OPEX' | 'REMITTANCE';

export interface CashoutInput {
  transaction_date: string;
  amount: number;
  notes: string;
  store_id?: string;
  classification_id?: string;
  cashout_type: CashoutType;
  metadata?: any;
  receipt_no?: string;
  source?: string;
  manufacturer?: string;
  brand?: string;
  product?: string;
  specs?: string;
  subType?: string;
  subTypeLabel?: string;
  referenceNo?: string;
  expenseCategory?: string;
  icon?: string;
  category_id?: string; // For Drawer / Source of Funds
  remittance_category_id?: string; // FK to remittance_categories table
}

export interface RemittanceCategory {
  id: string;
  name: string;
  created_at?: string;
}

export interface CashoutRecord {
  id: string;
  date: string;
  timestamp: string;
  amount: number;
  category: CashoutType;
  notes?: string;
  product?: string;
  expenseCategory?: string;
  icon?: string;
  subTypeLabel?: string;
  manufacturer?: string;
  receiptNo?: string;
  referenceNo?: string;
  created_at: string;
  classificationId?: string;
  categoryId?: string;
  drawerName?: string;
}

export interface OpexCategory {
  id: string | number;
  name: string;
  icon: string;
}

export interface Classification {
  id: string;
  name: string;
  store_id: string;
  icon?: string;
}

export interface CashoutPermissions {
  can_manage_expenses: boolean;
}

// --- API METHODS ---

// 0. Fetch User Permissions
export const fetchUserPermissions = async (): Promise<CashoutPermissions> => {
  const authClient = await getAuthClient();
  const supabase = getSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { can_manage_expenses: false };

  const { data, error } = await supabase
    .from("staff_permissions")
    .select("can_manage_expenses")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching permissions:", error);
    // Fallback: If not found in staff_permissions, check if user is admin
    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();
    
    return { can_manage_expenses: userData?.role === 'admin' };
  }

  return {
    can_manage_expenses: data?.can_manage_expenses || false
  };
};

// 1. Fetch Expenses Breakdown (Integrated & Typed)
export const fetchExpensesBreakdown = async (
  storeId: string,
  startDate: string,
  endDate: string
) => {
  const supabase = await getSupabase();

  // Fetch expenses with their associated source and classification name
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      amount,
      classification_details:classification_id (
        name
      ),
      product_category!inner (
        category
      )
    `
    )
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .eq("store_id", storeId)
    // Filter out rows where the FK might be null (if any)
    .not("classification_id", "is", null)
    .returns<ExpenseBreakdownRow[]>();

  if (error) {
    console.error("Error fetching expense breakdown:", error);
    throw error;
  }

  // Aggregate the data: Group by Source -> Classification
  const aggregated: Record<string, Record<string, number>> = {};

  data?.forEach((item) => {
    const source = item.product_category?.category || "Uncategorized";
    // Use the name from the joined table
    const classification = item.classification_details?.name || "Other";
    const amount = Number(item.amount);

    if (!aggregated[source]) {
      aggregated[source] = {};
    }

    if (!aggregated[source][classification]) {
      aggregated[source][classification] = 0;
    }

    aggregated[source][classification] += amount;
  });

  return aggregated;
};

// 2. Fetch All Expenses (List View)
export const fetchExpenses = async (
  storeId: string,
  startDate?: string,
  endDate?: string
): Promise<CashoutRecord[]> => {
  const supabase = await getSupabase();

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      product_category (
        category
      ),
      classification_details:classification_id (
        name
      )
    `
    )
    .eq("store_id", storeId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("transaction_date", startDate);
  }
  if (endDate) {
    query = query.lte("transaction_date", endDate);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data || []).map(
    (row: RawExpenseRow): CashoutRecord => {
      const meta = row.metadata || {};
      return {
        id: row.id,
        date: row.transaction_date,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: row.created_at,
        category: row.cashout_type || 'OPEX',
        amount: row.amount,
        receiptNo: row.receipt_no ?? "",
        notes: row.notes ?? "",
        
        // Details — extract from metadata first, fallback to joined relations
        expenseCategory: meta.expenseCategory || (row.classification_details?.name ?? (row.cashout_type === 'OPEX' ? "Unclassified" : undefined)),
        product: meta.product || (row.product_category?.category ?? (row.source || undefined)),
        manufacturer: meta.manufacturer || undefined,
        subTypeLabel: meta.subTypeLabel || undefined,
        referenceNo: meta.referenceNo || undefined,
        icon: meta.icon || undefined,
        classificationId: row.classification_id || undefined,
        categoryId: row.category_id || undefined,
        drawerName: row.product_category?.category ?? undefined,
      };
    }
  );
};

// 2b. Fetch Expenses with Pagination (Infinite Scroll)
export const fetchExpensesPaginated = async (
  storeId: string,
  page: number,
  pageSize: number,
  startDate?: string,
  endDate?: string
): Promise<{ data: CashoutRecord[]; count: number }> => {
  const supabase = await getSupabase();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      product_category (
        category
      ),
      classification_details:classification_id (
        name
      )
    `,
      { count: "exact" }
    )
    .eq("store_id", storeId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply date filters only if provided
  if (startDate) {
    query = query.gte("transaction_date", startDate);
  }
  if (endDate) {
    query = query.lte("transaction_date", endDate);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const mappedData = (data || []).map(
    (row: RawExpenseRow): CashoutRecord => {
      const meta = row.metadata || {};
      return {
        id: row.id,
        date: row.transaction_date,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: row.created_at,
        category: row.cashout_type || 'OPEX',
        amount: row.amount,
        receiptNo: row.receipt_no ?? "",
        notes: row.notes ?? "",
        
        // Details — extract from metadata first, fallback to joined relations
        expenseCategory: meta.expenseCategory || row.classification_details?.name,
        product: meta.product || (row.product_category?.category ?? (row.source || undefined)),
        manufacturer: meta.manufacturer || undefined,
        subTypeLabel: meta.subTypeLabel || undefined,
        referenceNo: meta.referenceNo || undefined,
        icon: meta.icon || undefined,
        classificationId: row.classification_id || undefined,
        categoryId: row.category_id || undefined,
        drawerName: row.product_category?.category ?? undefined,
      };
    }
  );

  return { data: mappedData, count: count ?? 0 };
};

// 2c. Fetch Expenses Summary (Totals)
export const fetchExpensesSummary = async (
  storeId: string,
  startDate?: string,
  endDate?: string
): Promise<{ totalAmount: number; totalCount: number }> => {
  const supabase = await getSupabase();
  
  let query = supabase
    .from("expenses")
    .select("amount", { count: "exact" })
    .eq("store_id", storeId);

  if (startDate) {
    query = query.gte("transaction_date", startDate);
  }
  if (endDate) {
    query = query.lte("transaction_date", endDate);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const totalAmount = data?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0;

  return { 
    totalAmount, 
    totalCount: count || 0 
  };
};

// 3. Create Expense (RPC)
export const createExpense = async (input: CashoutInput) => {
  const authClient = await getAuthClient();
  const supabase = getSupabase();
  
  // 1. Get current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const storeId = input.store_id;

  if (!storeId) {
    throw new Error("Store ID not found. Please provide a valid store_id inside the CashoutInput.");
  }

  // 3. Build metadata from form-specific fields
  const metadata: Record<string, any> = { ...(input.metadata || {}) };
  if (input.product) metadata.product = input.product;
  if (input.manufacturer) metadata.manufacturer = input.manufacturer;
  if (input.brand) metadata.brand = input.brand;
  if (input.specs) metadata.specs = input.specs;
  if (input.referenceNo) metadata.referenceNo = input.referenceNo;
  if (input.subType) metadata.subType = input.subType;
  if (input.subTypeLabel) metadata.subTypeLabel = input.subTypeLabel;
  if (input.expenseCategory) metadata.expenseCategory = input.expenseCategory;
  if (input.icon) metadata.icon = input.icon;

  // 4. Call the RPC
  const { error } = await supabase.rpc("insert_new_expense", {
    transaction_date_in: input.transaction_date,
    amount_in: input.amount,
    notes_in: input.notes,
    store_id_in: storeId, 
    classification_id_in: input.classification_id || null, 
    cashout_type_in: input.cashout_type,
    metadata_in: metadata,
    receipt_no_in: input.receipt_no || null, 
    category_id_in: input.category_id || null,
    remittance_category_id_in: input.remittance_category_id || null,
  });

  if (error) {
    console.error("RPC Error:", error);
    throw new Error(error.message);
  }
};

// --- CLASSIFICATION API ---

// 4. Fetch Classifications
export const fetchClassifications = async (storeId?: string): Promise<Classification[]> => {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("classification").select("*").order("name", { ascending: true });

  if (user) {
    if (storeId) {
      query = query.or(`admin_id.eq.${user.id},store_id.eq.${storeId}`);
    } else {
      query = query.or(`admin_id.eq.${user.id},store_id.is.null`);
    }
  } else if (storeId) {
    query = query.eq("store_id", storeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching classifications:", error);
    return [];
  }

  // Deduplicate by lowercase trimmed name
  const seen = new Set<string>();
  const uniqueClassifications: Classification[] = [];
  (data || []).forEach((c) => {
    const key = (c.name || '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueClassifications.push(c);
    }
  });

  return uniqueClassifications;
};

// 4b. Seed Default Classifications
export const seedClassifications = async (storeId?: string) => {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const defaults = [
    { name: 'Utilities', icon: 'Lightbulb' },
    { name: 'Rent & Lease', icon: 'Store' },
    { name: 'Supplier Payment', icon: 'Truck' },
    { name: 'Salaries', icon: 'User' },
    { name: 'Maintenance', icon: 'Wrench' },
    { name: 'Internet/Comm', icon: 'Wifi' },
    { name: 'Supplies', icon: 'Coffee' },
    { name: 'Marketing', icon: 'Briefcase' },
    { name: 'Taxes & Permits', icon: 'ShieldCheck' }
  ];

  const insertData = defaults.map(d => ({
    name: d.name,
    icon: d.icon,
    admin_id: user.id,
    store_id: storeId || null
  }));

  const { error } = await supabase.from("classification").insert(insertData);
  if (error) console.error("Error seeding classifications:", error);
};

// 5. Create Classification
export const createClassification = async (storeId: string, name: string, icon: string = 'Store') => {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("classification").insert({
    name: name.trim(),
    icon,
    admin_id: user?.id,
    store_id: storeId || null
  });

  if (error) {
    console.error("Error creating classification:", error);
    throw new Error(error.message);
  }
};

// 6. Update Classification
export const updateClassification = async (id: string, name: string, icon?: string) => {
  const supabase = await getSupabase();
  const updateData: any = { name };
  if (icon) updateData.icon = icon;

  const { error } = await supabase
    .from("classification")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating classification:", error);
    throw new Error(error.message);
  }
};

// 7. Delete Classification
export const deleteClassification = async (id: string) => {
  const supabase = await getSupabase();
  const { error } = await supabase.from("classification").delete().eq("id", id);

  if (error) {
    console.error("Error deleting classification:", error);
    throw new Error(error.message);
  }
};

// 8. Delete Expense
export const deleteExpense = async (id: string) => {
  const supabase = await getSupabase();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    console.error("Error deleting expense:", error);
    throw new Error(error.message);
  }
};

// --- DATA INTEGRITY / TRANSFER ---

// 10. Check Classification Usage
export const checkClassificationUsage = async (id: string): Promise<number> => {
  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("expenses")
    .select("*", { count: 'exact', head: true })
    .eq("classification_id", id);

  if (error) throw error;
  return count || 0;
};

// 11. Transfer Classification
export const transferClassification = async (fromId: string, toId: string) => {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("expenses")
    .update({ classification_id: toId })
    .eq("classification_id", fromId);

  if (error) throw error;
  
  // After transfer, delete the old one
  await deleteClassification(fromId);
};

// 9. Update Expense (Direct Update)
export const updateExpense = async (id: string, input: CashoutInput) => {
  const supabase = await getSupabase();

  // Build metadata from form-specific fields
  const metadata: Record<string, any> = { ...(input.metadata || {}) };
  if (input.product) metadata.product = input.product;
  if (input.manufacturer) metadata.manufacturer = input.manufacturer;
  if (input.brand) metadata.brand = input.brand;
  if (input.specs) metadata.specs = input.specs;
  if (input.referenceNo) metadata.referenceNo = input.referenceNo;
  if (input.subType) metadata.subType = input.subType;
  if (input.subTypeLabel) metadata.subTypeLabel = input.subTypeLabel;
  if (input.expenseCategory) metadata.expenseCategory = input.expenseCategory;
  if (input.icon) metadata.icon = input.icon;
  
  const { error } = await supabase
    .from("expenses")
    .update({
      transaction_date: input.transaction_date,
      classification_id: input.classification_id, 
      amount: input.amount,
      receipt_no: input.receipt_no,
      notes: input.notes,
      cashout_type: input.cashout_type,
      metadata,
      remittance_category_id: input.remittance_category_id || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating expense:", error);
    throw new Error(error.message);
  }
};

// 12. Fetch Remittance Categories
export const fetchRemittanceCategories = async (): Promise<RemittanceCategory[]> => {
  const supabase = await getSupabase();
  
  const { data, error, status } = await supabase
    .from("remittance_categories")
    .select("*")
    .order("name", { ascending: true });

  console.log("[RemittanceCategories] status:", status, "data:", data?.length ?? 0, "error:", error?.message ?? "none");

  if (error) {
    console.error("Error fetching remittance categories:", error);
    return [];
  }

  return data || [];
};

// 13. Fetch Current Balance (for monitoring)
export const fetchCurrentBalance = async (storeId: string): Promise<number> => {
  const supabase = await getSupabase();

  // 1. Get latest balance from overall_cash_flow
  const { data, error } = await supabase
    .from("overall_cash_flow")
    .select("balance")
    .eq("store_id", storeId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }

  return data?.balance || 0;
};
