-- Audit trail for Mercado Pago payment/subscription webhook events (see
-- src/app/api/webhooks/mercadopago/route.ts). Append-only — one row per
-- processed event, not a live-updated "current state" table (that's
-- schools.subscription_status/current_period_end, updated alongside each
-- insert here).

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          uuid REFERENCES public.schools(id),
  event_type         text NOT NULL,   -- 'payment' | 'subscription_preapproval'
  mp_payment_id      text,
  mp_preapproval_id  text,
  status             text NOT NULL,   -- Mercado Pago's own status string for this event
  amount_cents       int,
  raw_payload        jsonb,           -- full MP resource, fetched fresh at verification time
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_school_id_idx ON public.payment_transactions(school_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Master-only — same auth_is_master() helper every other master-scoped
-- table policy uses. This is an internal billing audit log, not something
-- owners read directly (a future "billing history" page for owners would
-- be a separate, deliberately-scoped read policy, not this one widened).
DROP POLICY IF EXISTS "payment_transactions: master full access" ON public.payment_transactions;
CREATE POLICY "payment_transactions: master full access"
  ON public.payment_transactions
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());
