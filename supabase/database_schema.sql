-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.classification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  store_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classification_pkey PRIMARY KEY (id),
  CONSTRAINT classification_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.customer_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  store_id uuid NOT NULL,
  admin_id uuid,
  is_shared boolean DEFAULT false,
  CONSTRAINT customer_groups_pkey PRIMARY KEY (id),
  CONSTRAINT customer_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT customer_groups_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT customer_groups_owner_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  store_id uuid NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  email text,
  address text,
  total_spent numeric DEFAULT 0.00,
  visit_count integer DEFAULT 0,
  last_visit_at timestamp with time zone,
  remarks text,
  group_id uuid,
  admin_id uuid,
  documents ARRAY DEFAULT '{}'::text[],
  birthdate date,
  date_of_registration date DEFAULT CURRENT_DATE,
  document_metadata jsonb DEFAULT '{}'::jsonb,
  civil_status text,
  gender text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT customers_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.customer_groups(id),
  CONSTRAINT customers_owner_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.daily_store_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_gross_sales numeric DEFAULT 0,
  total_net_sales numeric DEFAULT 0,
  transaction_count integer DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  total_cashout numeric DEFAULT 0,
  gross_profit numeric DEFAULT 0,
  net_profit numeric DEFAULT 0,
  total_opex numeric DEFAULT 0,
  total_remittance numeric DEFAULT 0,
  cash_remaining numeric DEFAULT 0,
  CONSTRAINT daily_store_stats_pkey PRIMARY KEY (id),
  CONSTRAINT daily_store_stats_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  receipt_no text,
  notes text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  store_id uuid NOT NULL,
  source text,
  category_id uuid,
  classification_id uuid,
  cashout_type text CHECK (cashout_type = ANY (ARRAY['COGS'::text, 'OPEX'::text, 'REMITTANCE'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.classification(id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT expenses_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(id)
);
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  invitee_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  store_ids ARRAY NOT NULL,
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id)
);
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  item_name text NOT NULL,
  sku text NOT NULL,
  cost_price numeric,
  description text,
  store_id uuid,
  user_id uuid,
  low_stock_threshold integer,
  category_id uuid,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_stores_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(id),
  CONSTRAINT items_creator_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.payments (
  invoice_no text NOT NULL,
  customer_name text,
  amount_rendered numeric,
  voucher numeric,
  amount_paid numeric,
  change numeric,
  transaction_no text,
  transaction_time timestamp with time zone NOT NULL DEFAULT now(),
  cashier_id uuid,
  store_id uuid,
  customer_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT payments_cashier_name_fkey FOREIGN KEY (cashier_id) REFERENCES auth.users(id),
  CONSTRAINT payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.playground_states (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT playground_states_pkey PRIMARY KEY (id),
  CONSTRAINT playground_states_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.product_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  store_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_default_voucher_source boolean DEFAULT false,
  CONSTRAINT product_category_pkey PRIMARY KEY (id),
  CONSTRAINT product_category_store_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.quick_pick_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  store_id uuid NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'bg-blue-500'::text,
  image_url text,
  position integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quick_pick_items_pkey PRIMARY KEY (id),
  CONSTRAINT quick_pick_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT quick_pick_items_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);
CREATE TABLE public.staff_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  can_backdate boolean NOT NULL DEFAULT false,
  can_edit_price boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  can_edit_transaction boolean DEFAULT false,
  can_delete_transaction boolean DEFAULT false,
  can_manage_items boolean DEFAULT false,
  can_manage_categories boolean DEFAULT false,
  can_manage_customers boolean DEFAULT false,
  can_manage_expenses boolean DEFAULT false,
  CONSTRAINT staff_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT staff_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.stock_flow (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  flow text NOT NULL,
  quantity numeric NOT NULL,
  capital_price numeric NOT NULL,
  notes text,
  time_stamp timestamp with time zone DEFAULT now(),
  user_id uuid,
  store_id uuid,
  item_id uuid NOT NULL,
  category_id uuid,
  CONSTRAINT stock_flow_pkey PRIMARY KEY (id),
  CONSTRAINT stock_flow_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT stock_flow_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(id),
  CONSTRAINT stock_flow_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT stock_flow_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.store_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'incomplete'::text,
  payer_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  amount_paid numeric,
  xendit_invoice_id text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  CONSTRAINT store_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT store_sub_store_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT store_sub_payer_fkey FOREIGN KEY (payer_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.stores (
  store_id uuid NOT NULL DEFAULT gen_random_uuid(),
  store_name text,
  store_address jsonb,
  store_img text,
  user_id uuid NOT NULL,
  enrollment_id text NOT NULL DEFAULT "substring"(md5((random())::text), 1, 8) UNIQUE,
  deleted_at timestamp with time zone,
  co_admins ARRAY DEFAULT '{}'::uuid[],
  CONSTRAINT stores_pkey PRIMARY KEY (store_id),
  CONSTRAINT store_owner_auth_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku text,
  item_name text,
  cost_price numeric NOT NULL DEFAULT 0.00,
  total_price numeric NOT NULL,
  discount numeric DEFAULT 0.00,
  cashier uuid,
  store_id uuid,
  quantity numeric,
  invoice_no text,
  transaction_time timestamp with time zone NOT NULL DEFAULT now(),
  category_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_id uuid,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT transactions_cashier_fkey FOREIGN KEY (cashier) REFERENCES auth.users(id),
  CONSTRAINT transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'user'::text,
  email text,
  store_id uuid,
  avatar text,
  metadata jsonb DEFAULT '{}'::jsonb,
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);