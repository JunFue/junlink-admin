-- ==============================================================================
-- FIX & AUTOMATICALLY SYNC `daily_store_stats` WITH `overall_cash_flow` & EXPENSES LOGIC
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- 
-- PURPOSE:
-- Keeps dashboard queries blazing fast by using pre-aggregated `daily_store_stats`,
-- while ensuring 100% data consistency with the `overall_cash_flow` live view
-- (subtracting vouchers from gross sales, tracking COGS/OPEX from cashout expenses,
-- and computing gross_profit and net_profit).
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
  v_cogs NUMERIC := 0;
  v_opex NUMERIC := 0;
  v_remittance NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_gross_profit NUMERIC := 0;
  v_net_profit NUMERIC := 0;
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

  -- Expenses breakdown on date (COGS, OPEX, REMITTANCE)
  SELECT 
    COALESCE(SUM(CASE WHEN e.cashout_type = 'COGS' THEN e.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN e.cashout_type = 'OPEX' THEN e.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN e.cashout_type = 'REMITTANCE' THEN e.amount ELSE 0 END), 0),
    COALESCE(SUM(e.amount), 0)
  INTO v_cogs, v_opex, v_remittance, v_expenses
  FROM public.expenses e
  WHERE e.store_id = p_store_id
    AND e.transaction_date = p_date;

  -- Gross Profit = Net Gross Sales - COGS (from cashouts)
  v_gross_profit := v_net_gross - v_cogs;

  -- Net Profit = Net Gross Sales - (COGS + OPEX)
  v_net_profit := v_net_gross - (v_cogs + v_opex);

  -- Try updating existing row first
  UPDATE public.daily_store_stats
  SET 
    total_gross_sales = v_net_gross,
    total_net_sales = v_net_gross,
    total_cogs = v_cogs,
    total_opex = v_opex,
    total_remittance = v_remittance,
    total_cashout = v_expenses,
    gross_profit = v_gross_profit,
    net_profit = v_net_profit,
    cash_remaining = v_net_gross - v_expenses,
    transaction_count = v_tx_count
  WHERE store_id = p_store_id AND date = p_date;

  -- If row doesn't exist yet, insert it
  IF NOT FOUND THEN
    INSERT INTO public.daily_store_stats (
      store_id,
      date,
      total_gross_sales,
      total_net_sales,
      total_cogs,
      total_opex,
      total_remittance,
      total_cashout,
      gross_profit,
      net_profit,
      cash_remaining,
      transaction_count
    )
    VALUES (
      p_store_id,
      p_date,
      v_net_gross,
      v_net_gross,
      v_cogs,
      v_opex,
      v_remittance,
      v_expenses,
      v_gross_profit,
      v_net_profit,
      v_net_gross - v_expenses,
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

-- ------------------------------------------------------------------------------
-- 3. Trigger Function for Expenses (COGS, OPEX, Remittance)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_sync_daily_store_stats_expenses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT & UPDATE (use NEW values)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.store_id IS NOT NULL AND NEW.transaction_date IS NOT NULL THEN
      PERFORM public.recalculate_daily_store_stats(NEW.store_id, NEW.transaction_date);
    END IF;
  END IF;

  -- Handle DELETE or UPDATE (if date/store changed, update OLD date as well)
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.store_id IS NOT NULL AND OLD.transaction_date IS NOT NULL THEN
      PERFORM public.recalculate_daily_store_stats(OLD.store_id, OLD.transaction_date);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Drop triggers if existing to prevent duplicates
DROP TRIGGER IF EXISTS trg_payments_sync_daily_stats ON public.payments;
DROP TRIGGER IF EXISTS trg_transactions_sync_daily_stats ON public.transactions;
DROP TRIGGER IF EXISTS trg_expenses_sync_daily_stats ON public.expenses;

-- Attach triggers to payments, transactions, and expenses
CREATE TRIGGER trg_payments_sync_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_daily_store_stats();

CREATE TRIGGER trg_transactions_sync_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_daily_store_stats();

CREATE TRIGGER trg_expenses_sync_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_daily_store_stats_expenses();

-- ------------------------------------------------------------------------------
-- 4. HISTORICAL BACKFILL: Fix all existing historical records in `daily_store_stats`
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Loop through all unique store_id and transaction dates in payments/transactions/expenses
  FOR r IN (
    SELECT DISTINCT store_id, transaction_time::date AS tx_date
    FROM public.payments
    WHERE store_id IS NOT NULL AND transaction_time IS NOT NULL
    UNION
    SELECT DISTINCT store_id, transaction_time::date AS tx_date
    FROM public.transactions
    WHERE store_id IS NOT NULL AND transaction_time IS NOT NULL
    UNION
    SELECT DISTINCT store_id, transaction_date AS tx_date
    FROM public.expenses
    WHERE store_id IS NOT NULL AND transaction_date IS NOT NULL
  ) LOOP
    PERFORM public.recalculate_daily_store_stats(r.store_id, r.tx_date);
  END LOOP;
END $$;
