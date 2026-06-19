-- =============================================================================
-- Fixed hourly-rate commission mode for instructors.
--
-- The Crew page's commission editor already had a "R$/hora fixo" toggle, but
-- nothing backed it: there was no commission_mode or rate column on users, so
-- the PATCH route silently dropped the rate (it echoed fixed_per_hour back in
-- the JSON response without ever writing it), and every confirm path computed
-- commission_amount = price * commission_pct unconditionally.
--
-- commission_mode/fixed_per_hour naming matches the existing CommissionEditor.tsx
-- UI and crew/commission route exactly — no extra translation layer.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS commission_mode TEXT DEFAULT 'percentage';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_commission_mode_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_commission_mode_check
      CHECK (commission_mode IS NULL OR commission_mode IN ('percentage', 'fixed_per_hour'));
  END IF;
END;
$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS fixed_per_hour NUMERIC(10,2) DEFAULT NULL;
