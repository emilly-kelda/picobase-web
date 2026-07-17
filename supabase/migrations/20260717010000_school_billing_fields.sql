-- =============================================================================
-- Contract/billing fields on public.schools, for the master dashboard.
--
-- Every school starts life in 'trial' (set explicitly by the create-school API
-- route, not just by this column default — the default here only covers rows
-- that predate this migration). payment_method/payment_terms/subscription_value
-- are nullable: a trial school may not have any of that decided yet.
-- =============================================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS status_assinatura   TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS payment_method       TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms        TEXT,
  ADD COLUMN IF NOT EXISTS subscription_value   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cost_center          TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_status_assinatura_check'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_status_assinatura_check
      CHECK (status_assinatura IN ('trial', 'active', 'past_due'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_payment_method_check'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('cartao', 'pix', 'boleto'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_payment_terms_check'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_payment_terms_check
      CHECK (payment_terms IS NULL OR payment_terms IN ('mensal', 'semestral', 'anual'));
  END IF;
END;
$$;
