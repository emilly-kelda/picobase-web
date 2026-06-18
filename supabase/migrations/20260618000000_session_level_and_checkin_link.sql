-- =============================================================================
-- Level progression (per student + activity) and check-in → agendamento link.
--
-- Level was previously only tracked globally per student (students.skill_level,
-- student_progression) with no per-activity scoping and no "experimental"
-- (one-time trial) tier. That global table is left untouched here — it backs a
-- separate "skill progression notes" feature. This migration adds a NEW,
-- per-activity level on the things that are already activity-scoped:
--   - sessions.level       → level actually taught in a CONFIRMED session
--   - scheduled_lessons.level → level the owner intends to teach when booking
--
-- It also links a check-in to the scheduled_lessons row it fulfills, so the
-- owner's confirmation screen can pull agendamento details (activity,
-- level, instructor, duration, time) without opening AULAS AGENDADAS.
--
-- Vocabulary (ascending): experimental -> iniciante -> intermediario -> avancado.
-- Stored without accents; UI applies accented PT/EN labels at render time.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS level text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_level_check'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_level_check
      CHECK (level IS NULL OR level IN ('experimental', 'iniciante', 'intermediario', 'avancado'));
  END IF;
END;
$$;

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS level text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scheduled_lessons_level_check'
      AND conrelid = 'public.scheduled_lessons'::regclass
  ) THEN
    ALTER TABLE public.scheduled_lessons
      ADD CONSTRAINT scheduled_lessons_level_check
      CHECK (level IS NULL OR level IN ('experimental', 'iniciante', 'intermediario', 'avancado'));
  END IF;
END;
$$;

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS scheduled_lesson_id uuid REFERENCES public.scheduled_lessons(id);

CREATE INDEX IF NOT EXISTS checkins_scheduled_lesson_id_idx
  ON public.checkins (scheduled_lesson_id);
