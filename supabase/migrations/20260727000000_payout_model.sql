-- School-wide override for how instructors are paid per confirmed lesson.
-- Default 'percentage' preserves today's behavior exactly (each
-- instructor's own commission_pct / fixed_per_hour, computed in
-- src/lib/commission.ts). 'fixed' ignores the instructor's own rate
-- entirely and pays fixed_payout_value (BRL) per lesson regardless of
-- duration or price — see api/owner/confirm-lesson/route.ts.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS payout_model        TEXT NOT NULL DEFAULT 'percentage'
    CHECK (payout_model IN ('percentage', 'fixed')),
  ADD COLUMN IF NOT EXISTS fixed_payout_value  NUMERIC(10,2);
