-- Distinguishes a checkin whose lesson was deferred to a later scheduled
-- slot (via the new "Agendar Aula" action in Sala de Espera) from one
-- that arrived already matched to a pre-existing scheduled_lesson (booked
-- in advance, checked in for it today) — the latter must keep showing in
-- Sala de Espera ready for "Confirmar", the former should not (they're not
-- doing the lesson right now anymore, it'll happen at the scheduled time).
-- Both cases end up with checkins.scheduled_lesson_id set, so that column
-- alone can't tell them apart.
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS deferred_to_schedule BOOLEAN NOT NULL DEFAULT false;
