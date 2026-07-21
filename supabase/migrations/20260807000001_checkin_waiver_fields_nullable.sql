-- =============================================================================
-- Defensive fix for a likely silent-insert regression: scheduledLessonRepository.
-- ts's ensureActiveCheckinForToday (Venda Rápida / bookings / same-day
-- scheduling) used to fake lgpd_consent/gdpr_consent as true and
-- waiver_signed_at as now() for a brand-new student, so the "Termo
-- Assinado" badge lied. Fixed to insert false/false/null instead — but if
-- waiver_signed_at (or either consent column) is NOT NULL without a
-- default, that insert now fails outright, and the surrounding
-- try/catch in api/owner/sell-package/route.ts ("never let this block
-- the sale") silently swallows the error: the package sale still
-- succeeds, but the student's checkin row is never created at all —
-- they vanish from Aguardando Vento entirely instead of showing
-- "Termo Pendente".
--
-- DROP NOT NULL is a no-op (no error) if the column is already nullable,
-- so this is safe to run regardless of the column's actual current state.
-- =============================================================================

ALTER TABLE public.checkins
  ALTER COLUMN waiver_signed_at DROP NOT NULL;

ALTER TABLE public.checkins
  ALTER COLUMN lgpd_consent DROP NOT NULL;

ALTER TABLE public.checkins
  ALTER COLUMN gdpr_consent DROP NOT NULL;
