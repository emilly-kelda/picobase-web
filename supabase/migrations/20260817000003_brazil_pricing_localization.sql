-- Brazil-market pricing model for plans (20260817000001_plans_and_subscriptions.sql):
-- setup fees, percentage-based commission billing (Pay-as-you-grow) as an
-- alternative to fixed monthly tiers, and BR-specific payment methods.
--
-- max_students stays NULL-means-unlimited, per the original plans table's
-- own convention (see that migration's comment, and checkPlanLimit() in
-- src/lib/auth/check-plan-limit.ts, which reads `max === null` as
-- unlimited) — the two default plans below use NULL for that reason, not
-- -1. A -1 sentinel would silently break checkPlanLimit's
-- `current < max` comparison (every real student count is >= 0, so
-- `current < -1` is always false — "unlimited" would read as "blocks
-- every student").

CREATE TYPE plan_billing_type AS ENUM ('commission', 'fixed_recurring');

CREATE TYPE supported_payment_method AS ENUM ('pix', 'credit_card', 'boleto');

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS billing_type           plan_billing_type NOT NULL DEFAULT 'fixed_recurring',
  ADD COLUMN IF NOT EXISTS commission_percentage   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS setup_fee_cents         int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency                VARCHAR(3) NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS payment_methods         supported_payment_method[] NOT NULL DEFAULT ARRAY['pix', 'credit_card']::supported_payment_method[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plans_commission_percentage_check'
      AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_commission_percentage_check
      CHECK (commission_percentage >= 0 AND commission_percentage <= 100);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plans_setup_fee_cents_check'
      AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_setup_fee_cents_check
      CHECK (setup_fee_cents >= 0);
  END IF;
END;
$$;

-- Default localized plans. ON CONFLICT (slug) makes this safe to re-run.
INSERT INTO public.plans
  (name, slug, billing_type, commission_percentage, setup_fee_cents, price_monthly_cents, max_students)
VALUES
  ('Plano Flex',             'flex',       'commission',      3.00, 49000,      0, NULL),
  ('Plano Escala Enterprise','enterprise', 'fixed_recurring',  0.00, 120000, 89900, NULL)
ON CONFLICT (slug) DO NOTHING;
