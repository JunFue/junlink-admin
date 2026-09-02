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
