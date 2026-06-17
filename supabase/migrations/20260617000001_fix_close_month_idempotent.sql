-- =============================================================================
-- Fix: make close_month idempotent (UPSERT) so re-running it for a period
-- that already has payment rows safely adds any missing instructors and
-- refreshes amounts without duplicating or overwriting approved rows.
--
-- Root cause of the Nycolas Oliveira missing payment:
--   close_month('...school...', '2026-06') was run when only Marco Ferreira
--   had confirmed sessions. Nycolas was added the next day. Because the old
--   function used a plain INSERT, re-running it was blocked by a unique
--   constraint (or would have created duplicates without one). The UI also hid
--   the "Fechar período" button once any payment row existed for the period,
--   giving the owner no path to recover.
--
-- Fix strategy: idempotent re-run (over trigger-per-session).
--   Tradeoff: requires a manual re-run after late session additions, but keeps
--   the existing "batch at period-close" mental model intact. A per-session
--   trigger would auto-update payments on every confirm, but would add DB
--   complexity and make the payments page live-update in ways the owner may
--   not expect mid-period. Idempotent re-run is lower risk and consistent with
--   the current UX flow.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Guarantee a unique constraint on payments(instructor_id, period, school_id)
--    so the ON CONFLICT clause below has a target. Skip if it already exists.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_instructor_id_period_school_id_key'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_instructor_id_period_school_id_key
      UNIQUE (instructor_id, period, school_id);
  END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 2. Replace close_month with an idempotent version.
--
-- Aggregates commission_amount from sessions confirmed in the given period,
-- then UPSERTs one payments row per instructor.
--
-- Approved/paid rows: amounts are updated in case new sessions arrive, but
-- status is preserved so the owner doesn't have to re-approve unchanged rows.
-- If that behaviour is unwanted (e.g. you want re-running to reset status to
-- pending), change the CASE expression in the DO UPDATE clause.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.close_month(p_school_id uuid, p_period text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.payments (
    school_id,
    instructor_id,
    period,
    sessions_count,
    revenue_generated,
    commission_pct,
    commission_amount,
    bonus,
    total_to_pay,
    status
  )
  SELECT
    p_school_id,
    s.instructor_id,
    p_period,
    COUNT(*)::int                                           AS sessions_count,
    SUM(s.price)                                           AS revenue_generated,
    -- Use the session-level commission_pct when available, fall back to the
    -- instructor's current rate. MAX() is a safe aggregate for a single-value
    -- field (all sessions for one instructor in one period share the same pct).
    MAX(COALESCE(s.commission_pct, u.commission_pct, 0))   AS commission_pct,
    SUM(COALESCE(s.commission_amount, 0))                  AS commission_amount,
    0                                                      AS bonus,
    SUM(COALESCE(s.commission_amount, 0))                  AS total_to_pay,
    'pending'                                              AS status
  FROM public.sessions  s
  JOIN public.users     u ON u.id = s.instructor_id
  WHERE s.school_id      = p_school_id
    AND s.instructor_id IS NOT NULL
    AND s.confirmed_at  IS NOT NULL
    -- Match the period as YYYY-MM prefix of session_date
    AND to_char(s.session_date::date, 'YYYY-MM') = p_period
  GROUP BY s.instructor_id

  ON CONFLICT (instructor_id, period, school_id)
  DO UPDATE SET
    sessions_count    = EXCLUDED.sessions_count,
    revenue_generated = EXCLUDED.revenue_generated,
    commission_pct    = EXCLUDED.commission_pct,
    commission_amount = EXCLUDED.commission_amount,
    -- total_to_pay = recalculated commission + any bonus already on the row
    total_to_pay      = EXCLUDED.commission_amount + public.payments.bonus,
    -- Preserve approved/paid status; only reset to pending for amounts that
    -- have genuinely changed (keeps stable rows stable).
    status = CASE
      WHEN public.payments.status IN ('approved', 'paid')
        AND public.payments.commission_amount = EXCLUDED.commission_amount
      THEN public.payments.status   -- no change → keep existing status
      ELSE 'pending'                -- amounts changed → back to pending
    END;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. One-time backfill: create the missing 2026-06 payment for Nycolas Oliveira.
--
-- After applying this migration you can instead just click "↻ Recalcular período"
-- on the Payments page for June 2026 — the idempotent close_month above will
-- INSERT Nycolas's row and UPSERT Marco's without touching his status.
-- This block is provided as a direct SQL alternative if the UI is not available.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Only run if the row is still missing (idempotent safety check)
  IF NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE instructor_id = 'fc6b81ca-6dc4-4578-bd1e-c6a8a9814393'  -- Nycolas Oliveira
      AND period        = '2026-06'
      AND school_id     = '00000000-0000-0000-0000-000000000001'
  ) THEN
    PERFORM public.close_month(
      '00000000-0000-0000-0000-000000000001',
      '2026-06'
    );
  END IF;
END;
$$;
