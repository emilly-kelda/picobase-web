-- Scopes progression level history by sport/modality. ProgressionEditor.tsx
-- already picks a skills checklist by sport, but never persisted which sport
-- a saved level belongs to — every student had one global level regardless
-- of which sport's checklist justified it. Nullable: old rows stay
-- unscoped (no reliable way to backfill), simply excluded from any
-- per-sport level lookup going forward.

ALTER TABLE public.student_progression
  ADD COLUMN IF NOT EXISTS sport text;
