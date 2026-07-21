-- =============================================================================
-- Fix: "Confirmar Aula" / "Encerrar Pacote e Cobrar" (ConfirmLessonModal.tsx)
-- were failing sessions_payment_method_check on every package-covered
-- confirm — NOT because payment_method was null (the button is disabled
-- until a method is picked whenever the financial form is shown, and the
-- package-covered path already sends a real string), but because that
-- package-covered path sends payment_method: 'pacote', a value this
-- constraint was never updated to allow. PaymentsClient.tsx's PM_LABELS
-- already has a 'pacote' entry ("Pacote (pré-pago)") — the display layer
-- expected this value; only the DB constraint was out of sync.
--
-- Real vocabulary for sessions.payment_method, confirmed against every
-- write site in the app (api/owner/confirm-lesson, ScheduledLessons.tsx's
-- PAYMENT_METHODS, PaymentsClient.tsx's PM_LABELS): pix / dinheiro /
-- cartao / a_receber / pacote — Portuguese terms, not the English
-- credit_card/cash/bank_transfer vocabulary schools.payment_method uses
-- for billing subscriptions (a completely different column). Explicitly
-- allows NULL too (same pattern as schools_payment_method_check) since a
-- session can be confirmed before payment is reconciled.
-- =============================================================================

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_payment_method_check;

ALTER TABLE public.sessions ADD CONSTRAINT sessions_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('pix', 'dinheiro', 'cartao', 'a_receber', 'pacote'));
