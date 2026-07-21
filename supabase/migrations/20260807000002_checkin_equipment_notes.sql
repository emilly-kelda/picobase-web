-- =============================================================================
-- Free-text equipment notes on a checkin (kite size, board, harness, etc.) —
-- editable from PendingLessons.tsx's "Ver ficha" modal. Deliberately just a
-- text column, not structured/normalized: equipment varies too much across
-- schools/sports (kitesurf kite+board+harness vs. surf board only, etc.) to
-- justify a fixed schema, same reasoning as checkins.category/source being
-- free text elsewhere in this app.
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS equipment_notes text;
