-- =============================================================================
-- Multi-currency pricing for packages and activities.
--
-- packages already has a BRL price (base_price / final_price) — only EUR/USD
-- are new here. activities only had default_price (BRL); this adds a parallel
-- price_brl/price_eur/price_usd set used by the multi-currency editor and the
-- confirm-lesson currency picker. price_brl is backfilled from default_price
-- so existing activities don't show a blank BRL price until the owner re-enters
-- it — default_price itself is left untouched (still used elsewhere as the
-- scheduling/check-in default).
--
-- sessions gets `currency` (what the owner was actually paid in) and
-- `price_original` (the amount in that currency). `price` stays the
-- BRL-equivalent used for revenue/runway — for now that BRL-equivalent is
-- entered manually by the owner when currency isn't BRL (no live FX
-- conversion yet).
-- =============================================================================

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS price_eur NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2);

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS price_brl NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_eur NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2);

UPDATE public.activities
SET price_brl = default_price
WHERE price_brl IS NULL;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS price_original NUMERIC(10,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_currency_check'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_currency_check
      CHECK (currency IS NULL OR currency IN ('BRL', 'EUR', 'USD'));
  END IF;
END;
$$;
