-- Owner-facing toggles for transactional notifications (Settings →
-- "Notificações Automáticas e Gatilhos"). All default false — no message
-- dispatch service is wired up yet (see TODO comments at the trigger
-- points in api/owner/schedule, api/owner/bookings, api/checkin), so
-- these flags exist purely as stored intent until that integration lands.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS notify_student_before_class  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_payment_and_waiver     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_instructor_on_checkin  BOOLEAN NOT NULL DEFAULT false;
