-- =============================================================================
-- RLS support for the master role: adds auth_is_master() and re-asserts
-- master full-access policies on public.schools and public.users.
--
-- Context: 20260617000000_rls_auth_policies.sql already gave master
-- unrestricted access to schools/users via a separate "master full access"
-- FOR ALL policy on each table (condition: auth_user_role() = 'master').
-- Postgres OR's multiple permissive policies together for the same
-- operation, so that policy already coexists with the owner's
-- school-scoped policy with no conflict — master was never blocked by the
-- owner policy to begin with.
--
-- This migration is intentionally safe to run whether or not that one ever
-- executed in this project — every statement is idempotent
-- (CREATE OR REPLACE / DROP POLICY IF EXISTS), so running it standalone
-- produces the same correct end state either way.
--
-- Master's own public.users row has school_id =
-- 00000000-0000-0000-0000-000000000000. That value is never compared
-- against in any policy below — master's access is unconditional on role,
-- not on that placeholder id, so there's nothing to special-case for it.
--
-- NOT in scope here: the ~11 other school_id-bearing tables listed in the
-- "REPLICATION NOTICE" at the bottom of 20260617000000_rls_auth_policies.sql
-- (students, sessions, payments, packages, ...) still have no RLS enabled
-- at all. That's unchanged by this file — this migration only touches
-- schools and users, matching what was asked.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER: read public.users regardless of RLS
-- on that table — safe because every one of these scopes to auth.uid(),
-- never to a caller-supplied id).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.auth_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid()
$$;

-- New: boolean wrapper around auth_user_role() = 'master', so policies that
-- want a single combined "owner-of-row OR master" expression (e.g.
-- `using (id = auth_user_school_id() or auth_is_master())`) can use it
-- directly instead of repeating the role check inline. Existing
-- schools/users policies below keep the separate-policy style already
-- established in this project (Postgres OR's them together automatically),
-- just referencing this function instead of the raw role comparison.
CREATE OR REPLACE FUNCTION public.auth_is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.auth_user_role() = 'master'
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_role()     TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auth_user_school_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auth_is_master()      TO authenticated, anon;


-- ---------------------------------------------------------------------------
-- public.schools
-- ---------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- master: unrestricted (SELECT/INSERT/UPDATE/DELETE) — this is what backs
-- "+ Nova Escola" for any session-bound query path (see caveat in the PR
-- notes: the current /api/owner/admin/schools route inserts via the
-- service-role client, which bypasses RLS entirely and doesn't need this
-- policy — it's still correct to have it for defense-in-depth and for any
-- future session-bound admin query).
DROP POLICY IF EXISTS "schools: master full access" ON public.schools;
CREATE POLICY "schools: master full access"
  ON public.schools
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());

-- owner: own school only (id = their school_id)
DROP POLICY IF EXISTS "schools: owner own school" ON public.schools;
CREATE POLICY "schools: owner own school"
  ON public.schools
  FOR ALL
  USING (
    public.auth_user_role() = 'owner'
    AND id = public.auth_user_school_id()
  )
  WITH CHECK (
    public.auth_user_role() = 'owner'
    AND id = public.auth_user_school_id()
  );


-- ---------------------------------------------------------------------------
-- public.users
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Every authenticated user can always read their own row (required for
-- getAuthContext() to resolve role/school_id on login and page load).
DROP POLICY IF EXISTS "users: read own row" ON public.users;
CREATE POLICY "users: read own row"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- master: unrestricted across all users (every school)
DROP POLICY IF EXISTS "users: master full access" ON public.users;
CREATE POLICY "users: master full access"
  ON public.users
  FOR ALL
  USING      (public.auth_is_master())
  WITH CHECK (public.auth_is_master());

-- owner: all users in their own school (instructors, partners, etc.)
DROP POLICY IF EXISTS "users: owner school access" ON public.users;
CREATE POLICY "users: owner school access"
  ON public.users
  FOR ALL
  USING (
    public.auth_user_role() = 'owner'
    AND school_id = public.auth_user_school_id()
  )
  WITH CHECK (
    public.auth_user_role() = 'owner'
    AND school_id = public.auth_user_school_id()
  );
