-- Append-only audit trail for master "view as school" impersonation
-- (src/app/api/master/impersonate/route.ts). One row per impersonation
-- start — no ended_at/session tracking here, the live session state is the
-- httpOnly cookie itself; this table only needs to answer "who impersonated
-- which school, and when" after the fact.

CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_user_id uuid NOT NULL REFERENCES public.users(id),
  school_id      uuid NOT NULL REFERENCES public.schools(id),
  started_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

-- Master-only, both directions — same auth_is_master() helper every other
-- master-scoped table policy already uses (see 20260717000000_master_role_rls.sql).
-- Owners never read or write this table.
DROP POLICY IF EXISTS "impersonation_log: master full access" ON public.impersonation_log;
CREATE POLICY "impersonation_log: master full access"
  ON public.impersonation_log
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());
