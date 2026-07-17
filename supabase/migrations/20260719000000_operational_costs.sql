-- Operational costs (fixed/variable expenses an owner logs — rent,
-- accountant, internet, affiliation fees, ...). Feeds the "Custo mensal"
-- Base Camp tile and the Runway Calculator's burn rate once a school has
-- real entries (see src/repositories/costRepository.ts / runwayRepository.ts).
--
-- RLS: owner and accountant read/manage their own school's rows, master has
-- unrestricted access (reusing the auth_user_role()/auth_user_school_id()/
-- auth_is_master() helpers from 20260617000000_rls_auth_policies.sql and
-- 20260717000000_master_role_rls.sql). No policy for instructor/partner —
-- RLS default-denies once enabled, so they simply have no access.

CREATE TABLE IF NOT EXISTS public.operational_costs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  cost_type    TEXT NOT NULL,
  recurrence   TEXT NOT NULL,
  due_date     DATE NOT NULL,
  category     TEXT,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_costs_school_id_idx ON public.operational_costs(school_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'operational_costs_cost_type_check'
      AND conrelid = 'public.operational_costs'::regclass
  ) THEN
    ALTER TABLE public.operational_costs
      ADD CONSTRAINT operational_costs_cost_type_check
      CHECK (cost_type IN ('fixo', 'variavel'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'operational_costs_recurrence_check'
      AND conrelid = 'public.operational_costs'::regclass
  ) THEN
    ALTER TABLE public.operational_costs
      ADD CONSTRAINT operational_costs_recurrence_check
      CHECK (recurrence IN ('mensal', 'anual', 'unico'));
  END IF;
END;
$$;

ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "operational_costs: master full access" ON public.operational_costs;
CREATE POLICY "operational_costs: master full access"
  ON public.operational_costs
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());

DROP POLICY IF EXISTS "operational_costs: owner/accountant school access" ON public.operational_costs;
CREATE POLICY "operational_costs: owner/accountant school access"
  ON public.operational_costs
  FOR ALL
  USING (
    public.auth_user_role() IN ('owner', 'accountant')
    AND school_id = public.auth_user_school_id()
  )
  WITH CHECK (
    public.auth_user_role() IN ('owner', 'accountant')
    AND school_id = public.auth_user_school_id()
  );
