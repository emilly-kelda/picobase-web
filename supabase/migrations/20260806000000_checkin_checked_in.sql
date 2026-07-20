-- =============================================================================
-- Urgent correction to picobase_chameleon_button_dossie.md's original model:
-- `stage` alone conflated "arrival confirmed at the desk" with "credit sold"
-- and "sent to the water", so a student who just bought a package skipped
-- check-in entirely. `checked_in` is a fact independent of both `stage` and
-- `hasCredit` — a student can have credit and not be checked in yet, or be
-- checked in with no credit.
--
-- Default false: any NEW checkin row (including ones inserted by the
-- self-service QR waiver flow in api/checkin/route.ts) starts as "not yet
-- checked in at the desk" — the waiver/QR submission is a legal/registration
-- event, not staff confirming the student is physically present and ready.
--
-- Existing rows are backfilled to true rather than left at the new default:
-- they were already operating under the old model where arriving in Sala de
-- Espera implicitly meant checked in, so flipping them to false would
-- regress every student currently mid-flow (e.g. anyone already sent to the
-- water) back to a "Check-in" button that makes no sense for them.
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false;

UPDATE public.checkins
SET checked_in = true
WHERE checked_in = false;
