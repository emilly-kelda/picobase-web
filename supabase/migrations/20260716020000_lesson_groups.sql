-- =============================================================================
-- Group lesson scheduling.
--
-- A group lesson is N students scheduled for the same activity/time/duration.
-- Each student still gets their own scheduled_lessons row (and, once
-- confirmed, their own sessions row — own price, own instructor, own
-- commission) — lesson_groups is just the shared scheduling metadata that
-- ties those rows together. Instructors are assigned per student at confirm
-- time, not at scheduling time.
--
-- Also relaxes sessions.checkin_id to nullable: group-confirmed sessions
-- have no checkin (there was never a public check-in for them — the owner
-- schedules and confirms the group directly), so confirm-lesson now accepts
-- a null checkin_id for that path. Safe/idempotent if the column was already
-- nullable.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id),
  activity_id  UUID REFERENCES public.activities(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS group_id UUID
  REFERENCES public.lesson_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scheduled_lessons_group_idx
  ON public.scheduled_lessons (group_id);

ALTER TABLE public.sessions
  ALTER COLUMN checkin_id DROP NOT NULL;
