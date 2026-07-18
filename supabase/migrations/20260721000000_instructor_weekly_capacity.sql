-- =============================================================================
-- Weekly capacity (hours) per instructor.
--
-- Backs the "Taxa de Ocupação" metric on /owner/reports (hours taught ÷
-- instructor capacity) — there was previously no notion of contracted/
-- available hours anywhere on users, so occupancy had nothing to divide by.
-- Nullable and unset by default: an instructor with no capacity configured
-- is excluded from the occupancy denominator rather than silently counted
-- as zero (or worse, treated as infinite).
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC(5,1);
