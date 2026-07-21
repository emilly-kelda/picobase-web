-- =============================================================================
-- Student weight (kg) captured at check-in — feeds the equipment-size
-- suggestion widget in PendingLessons.tsx's "Ficha" modal (weight + current
-- spot wind speed -> rough kite-size range). Optional, numeric, same
-- nullable/no-default pattern as equipment_notes: not every check-in flow
-- (or sport) needs it, and older rows simply have it null.
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS weight_kg numeric;
