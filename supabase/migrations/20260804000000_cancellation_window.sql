-- Configurable "janela de cancelamento" (Regra 4): how many hours before a
-- scheduled lesson's start a cancellation is still penalty-free. Cancelling
-- inside that window still frees up the instructor's slot, but the
-- student's package credit is forfeited instead of refunded (see
-- /api/owner/schedule DELETE). Defaults to 24 to match the number already
-- hardcoded into notify_late_cancellation's own description copy in
-- NotificationsModal.tsx ("menos de 24h antes").

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER NOT NULL DEFAULT 24;
