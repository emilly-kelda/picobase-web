-- Extends the "Notificações Automáticas e Gatilhos" toggles
-- (20260726000000_notification_flags.sql) with financial, operational,
-- and post-lesson retention triggers. All default false, same as before —
-- no dispatch service is wired up yet, see TODO comments at the trigger
-- points in api/owner/confirm-lesson and api/owner/schedule.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS notify_package_low            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_late_cancellation       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_post_class_feedback     BOOLEAN NOT NULL DEFAULT false;
