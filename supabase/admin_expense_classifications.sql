-- ============================================================================
-- HIGH-PERFORMANCE MIGRATION: Centralize Expense Classifications & Deduplicate
-- ============================================================================

-- 0. Set safety timeout & ensure indexes exist for instant foreign-key checks
SET statement_timeout = '300s';

-- Create index on expenses(classification_id) to eliminate full-table sequential scans
CREATE INDEX IF NOT EXISTS idx_expenses_classification_id ON public.expenses(classification_id);
CREATE INDEX IF NOT EXISTS idx_classification_store_id ON public.classification(store_id);

-- 1. Add admin_id and icon columns if missing
ALTER TABLE public.classification 
ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.users(user_id);

ALTER TABLE public.classification 
ALTER COLUMN store_id DROP NOT NULL;

ALTER TABLE public.classification 
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Store';

-- Update foreign key constraint on expenses so deleting a category safely sets classification_id to NULL
ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS expenses_classification_id_fkey;

ALTER TABLE public.expenses
ADD CONSTRAINT expenses_classification_id_fkey
FOREIGN KEY (classification_id)
REFERENCES public.classification(id)
ON DELETE SET NULL;

-- 2. Fast set-based backfill of admin_id from stores
UPDATE public.classification c
SET admin_id = s.user_id
FROM public.stores s
WHERE c.store_id = s.store_id 
  AND c.admin_id IS NULL;

-- 3. High-Speed Set-Based Deduplication with Triggers Disabled
-- (Temporarily disable triggers on expenses so daily_store_stats calculations don't fire repeatedly)
ALTER TABLE public.expenses DISABLE TRIGGER USER;

-- Step 3a: Re-link all expenses referencing duplicate categories to the canonical ID
WITH ranked_classifications AS (
  SELECT 
    c.id,
    COALESCE(c.admin_id, s.user_id) AS owner_admin_id,
    LOWER(TRIM(c.name)) AS clean_name,
    FIRST_VALUE(c.id) OVER (
      PARTITION BY COALESCE(c.admin_id, s.user_id), LOWER(TRIM(c.name))
      ORDER BY c.created_at ASC NULLS LAST, c.id ASC
    ) AS canonical_id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(c.admin_id, s.user_id), LOWER(TRIM(c.name))
      ORDER BY c.created_at ASC NULLS LAST, c.id ASC
    ) AS row_num
  FROM public.classification c
  LEFT JOIN public.stores s ON c.store_id = s.store_id
),
duplicates AS (
  SELECT id AS duplicate_id, canonical_id
  FROM ranked_classifications
  WHERE row_num > 1
)
UPDATE public.expenses e
SET classification_id = d.canonical_id
FROM duplicates d
WHERE e.classification_id = d.duplicate_id;

-- Step 3b: Delete duplicate classifications in one pass
WITH ranked_classifications AS (
  SELECT 
    c.id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(c.admin_id, s.user_id), LOWER(TRIM(c.name))
      ORDER BY c.created_at ASC NULLS LAST, c.id ASC
    ) AS row_num
  FROM public.classification c
  LEFT JOIN public.stores s ON c.store_id = s.store_id
)
DELETE FROM public.classification
WHERE id IN (
  SELECT id FROM ranked_classifications WHERE row_num > 1
);

-- Re-enable triggers on expenses immediately
ALTER TABLE public.expenses ENABLE TRIGGER USER;

-- 4. Clean up names
UPDATE public.classification
SET name = TRIM(name)
WHERE name <> TRIM(name);

-- 5. Add unique index per admin on case-insensitive name
CREATE UNIQUE INDEX IF NOT EXISTS idx_classification_admin_name_ci 
ON public.classification (COALESCE(admin_id, store_id), LOWER(TRIM(name)));

-- 6. Fast Default Seeding for admins without any categories
INSERT INTO public.classification (name, icon, admin_id)
SELECT d.name, d.icon, adm.user_id
FROM (
  SELECT DISTINCT user_id 
  FROM public.stores 
  WHERE user_id IS NOT NULL
) adm
CROSS JOIN (
  VALUES 
    ('Utilities', 'Lightbulb'),
    ('Rent & Lease', 'Store'),
    ('Supplier Payment', 'Truck'),
    ('Salaries', 'User'),
    ('Maintenance', 'Wrench'),
    ('Internet/Comm', 'Wifi'),
    ('Supplies', 'Coffee'),
    ('Marketing', 'Briefcase'),
    ('Taxes & Permits', 'ShieldCheck')
) AS d(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.classification c 
  WHERE c.admin_id = adm.user_id
)
ON CONFLICT DO NOTHING;

-- 7. High-Performance RLS Policies (wrapped with (SELECT auth.uid()) for caching)
ALTER TABLE public.classification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View Classifications" ON public.classification;
DROP POLICY IF EXISTS "Manage Classifications" ON public.classification;
DROP POLICY IF EXISTS "Admin Manage Classifications" ON public.classification;
DROP POLICY IF EXISTS "Staff View Classifications" ON public.classification;
DROP POLICY IF EXISTS "Staff and Admins View Classifications" ON public.classification;
DROP POLICY IF EXISTS "Admins Insert Classifications" ON public.classification;
DROP POLICY IF EXISTS "Admins Update Classifications" ON public.classification;
DROP POLICY IF EXISTS "Admins Delete Classifications" ON public.classification;

-- Policy 1: SELECT
CREATE POLICY "Staff and Admins View Classifications" ON public.classification
FOR SELECT TO authenticated
USING (
  admin_id = (SELECT auth.uid())
  OR
  admin_id IN (
    SELECT s.user_id 
    FROM public.stores s
    JOIN public.users u ON u.store_id = s.store_id
    WHERE u.user_id = (SELECT auth.uid())
  )
  OR
  store_id IN (
    SELECT store_id FROM public.users WHERE user_id = (SELECT auth.uid())
  )
  OR
  (admin_id IS NULL AND store_id IS NULL)
);

-- Policy 2: INSERT
CREATE POLICY "Admins Insert Classifications" ON public.classification
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Policy 3: UPDATE
CREATE POLICY "Admins Update Classifications" ON public.classification
FOR UPDATE TO authenticated
USING (
  admin_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE user_id = (SELECT auth.uid()) AND store_id = classification.store_id
  )
);

-- Policy 4: DELETE
CREATE POLICY "Admins Delete Classifications" ON public.classification
FOR DELETE TO authenticated
USING (
  admin_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE user_id = (SELECT auth.uid()) AND store_id = classification.store_id
  )
);

-- 8. RPC Function Optimization
CREATE OR REPLACE FUNCTION get_cashouts_breakdown(
  p_start_date date,
  p_end_date date,
  p_store_id uuid DEFAULT NULL
)
RETURNS TABLE (
  cashout_type text,
  subcategory text,
  total_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- OPEX Breakdown
  SELECT 
    'OPEX'::text as cashout_type,
    TRIM(c.name) as subcategory,
    SUM(e.amount) as total_amount
  FROM public.expenses e
  JOIN public.classification c ON e.classification_id = c.id
  WHERE (p_store_id IS NULL OR e.store_id = p_store_id)
    AND e.transaction_date >= p_start_date
    AND e.transaction_date <= p_end_date
    AND e.cashout_type = 'OPEX'
  GROUP BY TRIM(c.name)
  
  UNION ALL
  
  -- REMITTANCE Breakdown
  SELECT 
    'REMITTANCE'::text as cashout_type,
    TRIM(r.name) as subcategory,
    SUM(e.amount) as total_amount
  FROM public.expenses e
  JOIN public.remittance_categories r ON e.remittance_category_id = r.id
  WHERE (p_store_id IS NULL OR e.store_id = p_store_id)
    AND e.transaction_date >= p_start_date
    AND e.transaction_date <= p_end_date
    AND e.cashout_type = 'REMITTANCE'
  GROUP BY TRIM(r.name)
  
  UNION ALL
  
  -- COGS Breakdown
  SELECT 
    e.cashout_type,
    'Total COGS'::text as subcategory,
    SUM(e.amount) as total_amount
  FROM public.expenses e
  WHERE (p_store_id IS NULL OR e.store_id = p_store_id)
    AND e.transaction_date >= p_start_date
    AND e.transaction_date <= p_end_date
    AND e.cashout_type = 'COGS'
  GROUP BY e.cashout_type;
END;
$$;
