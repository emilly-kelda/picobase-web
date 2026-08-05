-- Plans & Subscriptions module for the master ("Super Admin") panel: a
-- formal tier catalog (pricing, student/storage limits, feature toggles)
-- that schools can be assigned to.
--
-- subscription_status here is a *separate* concept from schools.status_assinatura
-- (added in 20260717010000_school_billing_fields.sql / widened in
-- 20260718000000_school_status_suspended.sql). status_assinatura is the
-- real access gate — 'suspended' redirects the owner to /account-suspended
-- (src/app/owner/layout.tsx) — and stays exactly as-is, untouched by this
-- migration. subscription_status is the billing-lifecycle detail behind a
-- specific plan assignment (trialing/active/past_due/canceled/paused), for
-- the master plans UI — it does not drive any access control on its own.
-- These two fields are allowed to disagree transiently (e.g. a school can be
-- status_assinatura = 'active' while its subscription_status = 'past_due'
-- during a grace period) — reconciling them into one field is a separate,
-- future decision, not part of this change.

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'paused'
);

CREATE TABLE IF NOT EXISTS public.plans (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar NOT NULL,
  slug                 varchar NOT NULL UNIQUE,
  price_monthly_cents  int NOT NULL DEFAULT 0,
  price_yearly_cents   int NOT NULL DEFAULT 0,
  max_students         int,          -- NULL = unlimited
  max_storage_gb       int,          -- NULL = unlimited
  features             jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS plan_id               uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS subscription_status    subscription_status,
  ADD COLUMN IF NOT EXISTS current_period_end     timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end   boolean NOT NULL DEFAULT false;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- master: unrestricted, same auth_is_master() helper every other
-- master-scoped table policy uses (see 20260717000000_master_role_rls.sql).
DROP POLICY IF EXISTS "plans: master full access" ON public.plans;
CREATE POLICY "plans: master full access"
  ON public.plans
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());

-- Everyone else (owners today; a public pricing page tomorrow) can read
-- active plans only — never inactive/retired ones, never write.
DROP POLICY IF EXISTS "plans: public read active" ON public.plans;
CREATE POLICY "plans: public read active"
  ON public.plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- schools' new columns are covered by the existing row-level policies on
-- that table ("schools: master full access" / "schools: owner own school",
-- both from 20260717000000_master_role_rls.sql) — RLS in Postgres is
-- per-row, not per-column, so no new policy is needed here.
