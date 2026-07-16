-- =============================================================================
-- Salary advances ("adiantamentos") for instructors.
--
-- Owner records a mid-month advance payment; it is deducted from the
-- instructor's commission at payout time (see getPayments in
-- crewRepository.ts, which nets total_to_pay against advances for the
-- same period).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.instructor_advances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id),
  instructor_id UUID NOT NULL REFERENCES public.users(id),
  amount        NUMERIC(10,2) NOT NULL,
  period        TEXT NOT NULL, -- YYYY-MM
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_advances_instructor_period_idx
  ON public.instructor_advances (instructor_id, period);
