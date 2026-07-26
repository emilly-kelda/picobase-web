-- Off-Season Runway's "6 meses de reserva" target was hardcoded in three
-- separate places (runwayRepository.getRunwayProjection, owner/costs/page.tsx's
-- own gapToTarget calc, and RunwayCalculator.tsx's local const) — each school
-- has its own seasonality/working-capital needs, so this makes the target
-- (and, optionally, the high-season month range used for future seasonality-
-- aware projections) a per-school setting instead.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS reserve_target_months integer NOT NULL DEFAULT 6;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS high_season_start_month smallint,
  ADD COLUMN IF NOT EXISTS high_season_end_month smallint;

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_reserve_target_months_check;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_reserve_target_months_check CHECK (reserve_target_months > 0);

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_high_season_start_month_check;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_high_season_start_month_check
    CHECK (high_season_start_month IS NULL OR high_season_start_month BETWEEN 1 AND 12);

ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_high_season_end_month_check;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_high_season_end_month_check
    CHECK (high_season_end_month IS NULL OR high_season_end_month BETWEEN 1 AND 12);
