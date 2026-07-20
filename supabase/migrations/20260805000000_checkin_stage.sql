-- =============================================================================
-- picobase_chameleon_button_dossie.md, Fase 0 — single source of truth for
-- where a student is *today*, replacing the current "infer it from several
-- loose fields" approach (checkins.status + deferred_to_schedule, whether a
-- sessions row exists yet, elapsed time since check-in...).
--
-- IMPORTANT DEVIATION FROM THE DOSSIÊ: it describes one shared table backing
-- both Sala de Espera and Aulas Agendadas. That table doesn't exist —
-- checkins and scheduled_lessons are separate tables (see
-- 20260618000000_session_level_and_checkin_link.sql, which links them via
-- checkins.scheduled_lesson_id, nullable: a walk-in checkin has no
-- scheduled_lessons row until "Agendar Aula" creates one). `stage` is added
-- to checkins only, confirmed with the user — Sala de Espera's cards are
-- keyed on checkins, and Aulas Agendadas keeps using scheduled_lessons.status
-- (scheduled/checked_in/confirmed) as-is rather than gaining a second,
-- possibly-diverging stage column.
--
-- checkins.status today only ever takes 'checked_in' | 'session_confirmed' |
-- 'cancelled' (see scheduledLessonRepository.ts) — there is no existing
-- concept of "in the water" or "at checkout" anywhere in the app. Those two
-- stages are genuinely new: nothing currently transitions a checkin through
-- them, which is exactly what Fase 3 (backend wiring) adds. This migration
-- only adds the column and backfills what's inferable from EXISTING data.
--
-- Backfill can only reflect status, not real elapsed time (no reliable
-- lesson-end timestamp exists for a walk-in with no linked scheduled_lesson):
--   status = 'checked_in'       -> stage = 'sala_de_espera' (the safe
--                                  default; some of these may already be
--                                  mid-lesson in reality, but there's no
--                                  data to distinguish that pre-migration —
--                                  staff will advance them via the new
--                                  ChameleonButton going forward)
--   status = 'session_confirmed' -> stage = 'concluido'
--   status = 'cancelled'        -> stage left NULL (not one of the 4
--                                  lesson-progress states; a cancelled
--                                  checkin never had a "stage" in the sense
--                                  this column means)
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS stage text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'checkins_stage_check'
      AND conrelid = 'public.checkins'::regclass
  ) THEN
    ALTER TABLE public.checkins
      ADD CONSTRAINT checkins_stage_check
      CHECK (stage IS NULL OR stage IN ('sala_de_espera', 'na_agua', 'checkout', 'concluido'));
  END IF;
END;
$$;

ALTER TABLE public.checkins
  ALTER COLUMN stage SET DEFAULT 'sala_de_espera';

UPDATE public.checkins
SET stage = CASE
  WHEN status = 'checked_in'       THEN 'sala_de_espera'
  WHEN status = 'session_confirmed' THEN 'concluido'
  ELSE NULL
END
WHERE stage IS NULL;

CREATE INDEX IF NOT EXISTS checkins_stage_idx
  ON public.checkins (stage);
