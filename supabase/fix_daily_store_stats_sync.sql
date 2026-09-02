-- ==============================================================================
-- FIX & AUTOMATICALLY SYNC `daily_store_stats` WITH `overall_cash_flow` LOGIC
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- 
-- PURPOSE:
-- Keeps dashboard queries blazing fast by using pre-aggregated `daily_store_stats`,
-- while ensuring 100% data consistency with the `overall_cash_flow` live view
-- (subtracting vouchers from gross sales and handling backdated transactions).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Function: Recalculate daily stats for a specific store and date
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_daily_store_stats(
  p_store_id UUID,
  p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gross_sales NUMERIC := 0;
  v_vouchers NUMERIC := 0;
  v_net_gross NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_tx_count INT := 0;
BEGIN
  IF p_store_id IS NULL OR p_date IS NULL THEN
    RETURN;
  END IF;

  -- Gross sales from transactions on date
  SELECT COALESCE(SUM(t.total_price), 0), COUNT(DISTINCT t.payment_id)
  INTO v_gross_sales, v_tx_count
  FROM public.transactions t
  WHERE t.store_id = p_store_id
    AND t.transaction_time::date = p_date;

  -- Vouchers applied on date
  SELECT COALESCE(SUM(p.voucher), 0)
  INTO v_vouchers
  FROM public.payments p
  WHERE p.store_id = p_store_id
    AND p.transaction_time::date = p_date;

  -- Net Gross Sales (Gross - Vouchers)
  v_net_gross := GREATEST(v_gross_sales - v_vouchers, 0);

  -- Expenses on date
  SELECT COALESCE(SUM(e.amount), 0)
  INTO v_expenses
  FROM public.expenses e
  WHERE e.store_id = p_store_id
    AND e.transaction_date = p_date;

  -- Try updating existing row first
  UPDATE public.daily_store_stats
  SET 
    total_gross_sales = v_net_gross,
    total_cashout = v_expenses,
    transaction_count = v_tx_count
  WHERE store_id = p_store_id AND date = p_date;

  -- If row doesn't exist yet, insert it
  IF NOT FOUND THEN
    INSERT INTO public.daily_store_stats (
      store_id,
      date,
      total_gross_sales,
      total_cashout,
      transaction_count
    )
    VALUES (
      p_store_id,
      p_date,
      v_net_gross,
      v_expenses,
      v_tx_count
    );
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Trigger Function for Payments & Transactions
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_sync_daily_store_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT & UPDATE (use NEW values)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.store_id IS NOT NULL AND NEW.transaction_time IS NOT NULL THEN
      PERFORM public.recalculate_daily_store_stats(NEW.store_id, NEW.transaction_time::date);
    END IF;
  END IF;

  -- Handle DELETE or UPDATE (if date/store changed, update OLD date as well)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.store_id IS NOT NULL AND OLD.transaction_time IS NOT NULL THEN
      PERFORM public.recalculate_daily_store_stats(OLD.store_id, OLD.transaction_time::date);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Drop triggers if existing to prevent duplicates
DROP TRIGGER IF EXISTS trg_payments_sync_daily_stats ON public.payments;
DROP TRIGGER IF EXISTS trg_transactions_sync_daily_stats ON public.transactions;

-- Attach triggers to payments and transactions
CREATE TRIGGER trg_payments_sync_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_daily_store_stats();

CREATE TRIGGER trg_transactions_sync_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_daily_store_stats();


-- ------------------------------------------------------------------------------
-- 3. HISTORICAL BACKFILL: Fix all existing historical records in `daily_store_stats`
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Loop through all unique store_id and transaction dates in payments/transactions
  FOR r IN (
    SELECT DISTINCT store_id, transaction_time::date AS tx_date
    FROM public.payments
    WHERE store_id IS NOT NULL AND transaction_time IS NOT NULL
    UNION
    SELECT DISTINCT store_id, transaction_time::date AS tx_date
    FROM public.transactions
    WHERE store_id IS NOT NULL AND transaction_time IS NOT NULL
  ) LOOP
    PERFORM public.recalculate_daily_store_stats(r.store_id, r.tx_date);
  END LOOP;
END $$;
