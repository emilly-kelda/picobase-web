-- schools.payout_model / fixed_payout_value (the school-wide "everyone gets
-- the same flat rate" override) has been removed from the app entirely —
-- real-world instructors negotiate individually different rates, so the
-- only mechanism left is the per-instructor users.commission_mode /
-- fixed_per_hour, already set on each instructor's own profile
-- (Equipe → instructor → Comissão) and already what every confirm-session
-- route computes commission_amount from (see src/lib/commission.ts).
--
-- close_month's commission_pct column still needs the same "don't show a
-- stale/irrelevant percentage next to a flat-rate payout" gate that
-- 20260815000000 added — just keyed off each instructor's own
-- commission_mode now instead of the school's (now-gone) payout_model.
-- u.commission_mode is constant within each GROUP BY s.instructor_id
-- group (one instructor per group), so MAX() here is just how Postgres
-- lets a non-aggregated, join-derived column sit in the SELECT list —
-- not an actual aggregation across different instructors.

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
    CASE WHEN MAX(u.commission_mode) = 'fixed_per_hour' THEN NULL
         ELSE MAX(COALESCE(s.commission_pct, u.commission_pct, 0))
    END                                                     AS commission_pct,
    SUM(COALESCE(s.commission_amount, 0))                  AS commission_amount,
    0                                                      AS bonus,
    SUM(COALESCE(s.commission_amount, 0))                  AS total_to_pay,
    'pending'                                              AS status
  FROM public.sessions  s
  JOIN public.users     u ON u.id = s.instructor_id
  WHERE s.school_id      = p_school_id
    AND s.instructor_id IS NOT NULL
    AND s.confirmed_at  IS NOT NULL
    AND to_char(s.session_date::date, 'YYYY-MM') = p_period
  GROUP BY s.instructor_id

  ON CONFLICT (instructor_id, period, school_id)
  DO UPDATE SET
    sessions_count    = EXCLUDED.sessions_count,
    revenue_generated = EXCLUDED.revenue_generated,
    commission_pct    = EXCLUDED.commission_pct,
    commission_amount = EXCLUDED.commission_amount,
    total_to_pay      = EXCLUDED.commission_amount + public.payments.bonus,
    status = CASE
      WHEN public.payments.status IN ('approved', 'paid')
        AND public.payments.commission_amount = EXCLUDED.commission_amount
      THEN public.payments.status
      ELSE 'pending'
    END;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- The global override columns themselves are no longer read or written by
-- any app code (GeneralSettingsModal.tsx's radio group was removed) — drop
-- them so the schema doesn't keep advertising a mechanism the UI no longer
-- exposes.
ALTER TABLE public.schools DROP COLUMN IF EXISTS payout_model;
ALTER TABLE public.schools DROP COLUMN IF EXISTS fixed_payout_value;
