// Database types based on the provided Supabase schema

export interface User {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string | null;
  store_id: string | null;
  avatar: string | null;
  metadata: Record<string, any> | null;
  deleted_at: string | null;
}

export interface Admin {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  job_title: string | null;
  avatar: string | null;
  email: string | null;
}

export interface Staff {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  email: string | null;
  avatar: string | null;
  store_id: string | null;
}

export interface StaffPermissions {
  id: string;
  user_id: string;
  can_backdate: boolean;
  can_edit_price: boolean;
  created_at: string | null;
  can_edit_transaction: boolean;
  can_delete_transaction: boolean;
  can_manage_items: boolean;
  can_manage_categories: boolean;
  can_manage_customers: boolean;
  can_manage_expenses: boolean;
}

export interface StoreAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Store {
  store_id: string;
  store_name: string | null;
  store_address: StoreAddress | null;
  store_img: string | null;
  user_id: string;
  enrollment_id: string;
  enrollment_code_expires_at: string | null;
  deleted_at: string | null;
}

export interface StoreWithStaffCount extends Store {
  staff_count: number;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  status: string;
  payer_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  amount_paid: number | null;
  xendit_invoice_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Transaction {
  id: string;
  sku: string | null;
  item_name: string | null;
  cost_price: number;
  total_price: number;
  discount: number | null;
  cashier: string | null;
  store_id: string | null;
  quantity: number | null;
  invoice_no: string | null;
  transaction_time: string;
  category_id: string | null;
  created_at: string;
  payment_id: string | null;
}

export interface Payment {
  id: string;
  invoice_no: string;
  customer_name: string | null;
  amount_rendered: number | null;
  voucher: number | null;
  amount_paid: number | null;
  change: number | null;
  transaction_no: string | null;
  transaction_time: string;
  cashier_id: string | null;
  store_id: string | null;
  customer_id: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  created_at: string;
  item_name: string;
  sku: string;
  cost_price: number | null;
  description: string | null;
  store_id: string | null;
  user_id: string | null;
  low_stock_threshold: number | null;
  category_id: string | null;
}

export interface ProductCategory {
  id: string;
  category: string;
  store_id: string;
  created_at: string | null;
  is_default_voucher_source: boolean;
}

export interface Classification {
  id: string;
  name: string;
  store_id: string;
  created_at: string | null;
}

export interface Expense {
  id: string;
  created_at: string;
  transaction_date: string;
  amount: number;
  receipt_no: string | null;
  notes: string | null;
  user_id: string;
  store_id: string;
  source: string | null;
  category_id: string | null;
  classification_id: string | null;
  cashout_type: 'COGS' | 'OPEX' | 'REMITTANCE' | null;
  remittance_category_id: string | null;
}

export interface RemittanceCategory {
  id: string;
  name: string;
  created_at: string | null;
}

export interface StockFlow {
  id: string;
  item_id: string;
  item_name: string;
  flow: string;
  quantity: number;
  capital_price: number;
  notes: string | null;
  time_stamp: string | null;
  user_id: string | null;
  store_id: string | null;
  category_id: string | null;
}

export interface CustomerGroup {
  id: string;
  created_at: string | null;
  name: string;
  created_by: string;
  store_id: string;
  admin_id: string | null;
  is_shared: boolean;
}

export interface Customer {
  id: string;
  created_at: string | null;
  store_id: string;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  total_spent: number;
  visit_count: number;
  last_visit_at: string | null;
  remarks: string | null;
  group_id: string | null;
  admin_id: string | null;
  documents: string[];
  birthdate: string | null;
  date_of_registration: string | null;
  document_metadata: Record<string, any>;
  civil_status: string | null;
  gender: string | null;
}

export interface PlaygroundState {
  id: string;
  store_id: string;
  name: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QuickPickItem {
  id: string;
  item_id: string;
  store_id: string;
  label: string;
  color: string;
  image_url: string | null;
  position: number | null;
  created_at: string | null;
}
