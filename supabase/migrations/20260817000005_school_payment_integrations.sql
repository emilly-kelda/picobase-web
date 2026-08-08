-- Per-school Mercado Pago OAuth connection (marketplace model — each school
-- connects its own MP account so student payments land directly with them,
-- distinct from the platform-level account src/lib/payments/mercadopago.ts
-- already uses for PicoBase's own subscription billing).
--
-- access_token/refresh_token are written pre-encrypted by the callback
-- route (src/app/api/auth/callback/mercadopago/route.ts) via
-- src/utils/crypto.ts's encrypt()/decrypt() — the same helper already used
-- for health_conditions, whose own comment already called out "future
-- financial credentials" as a use case. This migration does not enforce
-- that at the DB level (plain `text` columns) — it's an application-layer
-- guarantee, same as every other encrypted field in this schema.

CREATE TABLE IF NOT EXISTS public.school_payment_integrations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      uuid NOT NULL UNIQUE REFERENCES public.schools(id),
  provider       varchar NOT NULL DEFAULT 'mercadopago',
  mp_user_id     varchar,
  mp_public_key  varchar,
  access_token   text,
  refresh_token  text,
  expires_at     timestamptz,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_payment_integrations ENABLE ROW LEVEL SECURITY;

-- master: unrestricted, same auth_is_master() helper every other
-- master-scoped table policy uses.
DROP POLICY IF EXISTS "school_payment_integrations: master full access" ON public.school_payment_integrations;
CREATE POLICY "school_payment_integrations: master full access"
  ON public.school_payment_integrations
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());

-- owner: their own school's row only — same auth_user_school_id() shape as
-- "schools: owner own school" (20260717000000_master_role_rls.sql). In
-- practice every real read/write goes through the service-role client in
-- the connect/callback/tenant-client routes below (like the rest of this
-- app's owner-facing tables), so this is defense-in-depth, not the primary
-- access path.
DROP POLICY IF EXISTS "school_payment_integrations: owner own school" ON public.school_payment_integrations;
CREATE POLICY "school_payment_integrations: owner own school"
  ON public.school_payment_integrations
  FOR ALL
  USING (
    public.auth_user_role() = 'owner'
    AND school_id = public.auth_user_school_id()
  )
  WITH CHECK (
    public.auth_user_role() = 'owner'
    AND school_id = public.auth_user_school_id()
  );
