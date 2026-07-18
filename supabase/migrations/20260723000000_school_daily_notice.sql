-- =============================================================================
-- Daily notice board ("Mural de Avisos").
--
-- Distinct from the existing school_notices table (20260718010000), which is
-- Master → Owner one-way announcements with per-notice read/dismiss
-- tracking. This is simpler and one-directional the other way: the owner
-- writes a single current-day message, instructors read it. One column,
-- no history, no read tracking — matches the task's own "estrutura básica
-- rápida" ask.
-- =============================================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS daily_notice TEXT;
