-- =============================================================================
-- One-time data fix. ChameleonButton's "Iniciar Velejo" (send-to-water) had
-- no guard requiring an activity to be defined first, so a handful of
-- checkins today got moved to stage = 'na_agua' with no activity_id/
-- instructor_id at all — visible in Aguardando Vento as "Sem atividade ·
-- Sem instrutor" cards muted-texted "Na água", with no button left to
-- undo it (na_agua has no action of its own by design). The application
-- code now gates this transition on activityName being set (see
-- ChameleonButton's onNeedsSchedule branch) — this migration only repairs
-- the checkins that already got stuck before that guard existed.
--
-- Narrowly scoped on purpose: only reverts na_agua rows that have BOTH
-- activity_id and instructor_id null — a checkin genuinely sent to the
-- water with a real activity/instructor attached (e.g. the pre-existing,
-- confirmed-correct manual sends from earlier today) is untouched.
-- =============================================================================

UPDATE public.checkins
SET stage = 'sala_de_espera'
WHERE stage = 'na_agua'
  AND activity_id IS NULL
  AND instructor_id IS NULL;
