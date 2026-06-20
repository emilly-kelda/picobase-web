-- =============================================================================
-- Commission rate change history for instructors.
--
-- Depends on users.commission_mode / users.fixed_per_hour from
-- 20260622000000_instructor_commission_mode.sql — run that first if it
-- hasn't been applied yet, or the commission save route's history-logging
-- read (and the update right after it) will fail.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.commission_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id),
  instructor_id UUID NOT NULL REFERENCES public.users(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_mode      TEXT,
  old_pct       NUMERIC(5,2),
  old_hourly    NUMERIC(10,2),
  new_mode      TEXT,
  new_pct       NUMERIC(5,2),
  new_hourly    NUMERIC(10,2),
  note          TEXT
);

CREATE INDEX IF NOT EXISTS commission_history_instructor_idx
  ON public.commission_history (instructor_id, changed_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commission_history_mode_check'
      AND conrelid = 'public.commission_history'::regclass
  ) THEN
    ALTER TABLE public.commission_history
      ADD CONSTRAINT commission_history_mode_check
      CHECK (
        (old_mode IS NULL OR old_mode IN ('percentage', 'fixed_per_hour')) AND
        (new_mode IS NULL OR new_mode IN ('percentage', 'fixed_per_hour'))
      );
  END IF;
END;
$$;
