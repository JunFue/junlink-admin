-- ==============================================================================
-- RESTORE `get_dashboard_metrics` RPC TO QUERY `daily_store_stats`
-- ==============================================================================
-- Now that `daily_store_stats` is kept in sync with net gross sales (minus vouchers)
-- and handles backdated transactions via triggers, `get_dashboard_metrics` can
-- safely query `daily_store_stats` for maximum query speed.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_store_id uuid DEFAULT NULL::uuid,
  p_start_date date DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'::text))::date,
  p_end_date date DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila'::text))::date
)
RETURNS TABLE(
  gross_sales numeric,
  net_sales numeric,
  net_profit numeric,
  transaction_count integer,
  average_order_value numeric,
  available_cash numeric,
  total_expenses numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_gross_sales numeric;
  v_net_sales numeric;
  v_net_profit numeric;
  v_transactions integer;
  v_total_expenses numeric;
  v_available_cash numeric;
BEGIN
  -- Fast flow metrics from daily_store_stats
  SELECT
    COALESCE(SUM(dss.total_gross_sales), 0),
    COALESCE(SUM(dss.total_net_sales), 0),
    COALESCE(SUM(dss.net_profit), 0),
    COALESCE(SUM(dss.transaction_count), 0),
    COALESCE(SUM(dss.total_cashout), 0)
  INTO
    v_gross_sales, v_net_sales, v_net_profit, v_transactions, v_total_expenses
  FROM public.daily_store_stats dss
  JOIN public.stores s ON dss.store_id = s.store_id
  WHERE s.deleted_at IS NULL
    AND (s.user_id = auth.uid() OR auth.uid() = ANY(s.co_admins)) -- Tenant Lock
    AND dss.date >= p_start_date AND dss.date <= p_end_date
    AND (p_store_id IS NULL OR dss.store_id = p_store_id);

  -- Available Cash Snapshot
  SELECT COALESCE(SUM(latest_balance), 0) INTO v_available_cash
  FROM (
    SELECT DISTINCT ON (dss.store_id) dss.running_balance as latest_balance
    FROM public.daily_store_stats dss
    JOIN public.stores s ON dss.store_id = s.store_id
    WHERE s.deleted_at IS NULL
      AND (s.user_id = auth.uid() OR auth.uid() = ANY(s.co_admins)) -- Tenant Lock
      AND dss.date <= p_end_date 
      AND (p_store_id IS NULL OR dss.store_id = p_store_id)
    ORDER BY dss.store_id, dss.date DESC
  ) store_snapshots;

  RETURN QUERY SELECT
    v_gross_sales,
    v_net_sales,
    v_net_profit,
    v_transactions,
    CASE WHEN v_transactions > 0 THEN ROUND(v_gross_sales / v_transactions, 2) ELSE 0.00 END,
    COALESCE(v_available_cash, 0),
    v_total_expenses;
END;
$function$;
