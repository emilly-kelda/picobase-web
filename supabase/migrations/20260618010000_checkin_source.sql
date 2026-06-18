-- =============================================================================
-- Check-in source tracking ("Como você chegou até nós?").
--
-- Replaces the old two-step referral flow (free-floating partner picker) with
-- a single source question. source is the channel; partner_id (already on
-- checkins) is which specific hotel/agency when source is 'hotel' or 'agencia'.
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkins_source_check'
      AND conrelid = 'public.checkins'::regclass
  ) THEN
    ALTER TABLE public.checkins
      ADD CONSTRAINT checkins_source_check
      CHECK (source IS NULL OR source IN (
        'walk_in', 'whatsapp', 'instagram', 'hotel', 'agencia', 'outro'
      ));
  END IF;
END;
$$;
