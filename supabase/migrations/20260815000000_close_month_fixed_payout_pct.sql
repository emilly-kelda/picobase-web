-- close_month's commission_pct column falls back to the instructor's own
-- commission_pct (COALESCE(s.commission_pct, u.commission_pct, 0)) whenever
-- a session's own commission_pct is null — which confirm-lesson/route.ts
-- deliberately sets to null for every session confirmed under the
-- school-wide payout_model = 'fixed' override (see commission_pct's own
-- ternary there: `usesFixedPayout ? null : ...`). That null was meant to
-- mean "not percentage-based", but this fallback then filled it back in
-- with whatever percentage the instructor happens to have configured —
-- so the Pagamentos page kept showing a % next to a payout that was
-- actually a flat rate, even though the *amount* itself was already
-- correct. Gated on the school's own payout_model now, same source
-- confirm-lesson/route.ts reads, so a fixed-payout school always stores
-- NULL (renders as "—", not a stale/misleading percentage).

CREATE OR REPLACE FUNCTION public.close_month(p_school_id uuid, p_period text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count int;
  v_fixed_payout boolean;
BEGIN
  SELECT (payout_model = 'fixed') INTO v_fixed_payout
  FROM public.schools WHERE id = p_school_id;

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
    CASE WHEN COALESCE(v_fixed_payout, false) THEN NULL
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
