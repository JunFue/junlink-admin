CREATE OR REPLACE FUNCTION get_cashouts(
  p_date_range text,
  p_store_id uuid DEFAULT NULL,
  p_page integer DEFAULT 0,
  p_limit integer DEFAULT 20,
  p_subcategory text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  transaction_date date,
  amount numeric,
  receipt_no text,
  notes text,
  user_id uuid,
  store_id uuid,
  source text,
  category_id uuid,
  classification_id uuid,
  cashout_type text,
  remittance_category_id uuid,
  metadata jsonb,
  users jsonb,
  stores jsonb,
  classification jsonb,
  remittance_categories jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset integer := p_page * p_limit;
  v_start_date date;
BEGIN
  -- Determine start date
  IF p_date_range = 'today' THEN
    v_start_date := CURRENT_DATE;
  ELSIF p_date_range = 'week' THEN
    v_start_date := CURRENT_DATE - INTERVAL '7 days';
  ELSIF p_date_range = 'month' THEN
    v_start_date := CURRENT_DATE - INTERVAL '30 days';
  ELSE
    v_start_date := '1970-01-01'::date;
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.created_at,
    e.transaction_date,
    e.amount,
    e.receipt_no,
    e.notes,
    e.user_id,
    e.store_id,
    e.source,
    e.category_id,
    e.classification_id,
    e.cashout_type,
    e.remittance_category_id,
    e.metadata,
    CASE WHEN u.user_id IS NOT NULL THEN jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name) ELSE NULL END AS users,
    CASE WHEN s.store_id IS NOT NULL THEN jsonb_build_object('store_name', s.store_name) ELSE NULL END AS stores,
    CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('name', c.name) ELSE NULL END AS classification,
    CASE WHEN r.id IS NOT NULL THEN jsonb_build_object('name', r.name) ELSE NULL END AS remittance_categories
  FROM public.expenses e
  LEFT JOIN public.users u ON e.user_id = u.user_id
  LEFT JOIN public.stores s ON e.store_id = s.store_id
  LEFT JOIN public.classification c ON e.classification_id = c.id
  LEFT JOIN public.remittance_categories r ON e.remittance_category_id = r.id
  WHERE (p_store_id IS NULL OR e.store_id = p_store_id)
    AND (p_date_range = 'all' OR e.transaction_date >= v_start_date)
    AND (
      p_subcategory IS NULL OR p_subcategory = '' OR p_subcategory = 'All Subcategories' OR
      TRIM(UPPER(c.name)) = TRIM(UPPER(p_subcategory)) OR
      TRIM(UPPER(r.name)) = TRIM(UPPER(p_subcategory))
    )
  ORDER BY e.transaction_date DESC, e.created_at DESC
  LIMIT p_limit OFFSET v_offset;
END;
$$;
