-- sessions only ever linked to a student via checkin_id -> checkins.
-- Group-confirmed lessons have no checkin (the owner confirms the whole
-- group directly, per confirm-lesson/route.ts's own comment), and any
-- individual lesson confirmed straight from Aulas Agendadas (not through
-- the check-in kiosk) has no checkin either — both leave checkin_id null,
-- which meant the session's own student name was permanently
-- unrecoverable from the row itself. confirm-lesson/route.ts already
-- resolves scheduled_lesson_id at confirm time (used for the package
-- capacity check) but never persisted it — this column lets it, so
-- getTodayDetail and friends can fall back to
-- scheduled_lessons.student_name when checkins is null.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS scheduled_lesson_id UUID REFERENCES public.scheduled_lessons(id);
