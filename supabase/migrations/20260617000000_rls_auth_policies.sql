-- =============================================================================
-- RLS LAYER 3 — database-level data isolation (the innermost security boundary).
--
-- Middleware (layer 1) checks session validity.
-- Server layout (layer 2) checks role and school_id from public.users.
-- This layer enforces that data queries can ONLY touch rows the caller is
-- authorized for, even if layers 1 and 2 are somehow bypassed.
--
-- Access rules implemented here:
--   master → unrestricted access to every row in every table
--   owner  → restricted to rows where school_id = their own school_id
--   instructor / partner / accountant → no authenticated session; RLS via
--     auth.uid() is moot for them by design. Their out-of-band PDF delivery
--     uses service_role (bypasses RLS) — that's a separate, future concern.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read public.users regardless
-- of RLS status on that table — safe because they always scope to auth.uid()).
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

-- Grant execute to the authenticated and anon roles so RLS policies can call them.
GRANT EXECUTE ON FUNCTION public.auth_user_role()     TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auth_user_school_id() TO authenticated, anon;


-- ---------------------------------------------------------------------------
-- public.schools
-- ---------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- master: unrestricted
CREATE POLICY "schools: master full access"
  ON public.schools
  FOR ALL
  USING      (public.auth_user_role() = 'master')
  WITH CHECK (public.auth_user_role() = 'master');

-- owner: own school only (id = their school_id)
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
--
-- The helper functions are SECURITY DEFINER and bypass RLS when reading
-- public.users, so there is no circular dependency.
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Every authenticated user can always read their own row (required for
-- getAuthContext() to resolve role/school_id on login and page load).
CREATE POLICY "users: read own row"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- master: unrestricted across all users
CREATE POLICY "users: master full access"
  ON public.users
  FOR ALL
  USING      (public.auth_user_role() = 'master')
  WITH CHECK (public.auth_user_role() = 'master');

-- owner: all users in their school (instructors, partners, etc.)
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


-- ---------------------------------------------------------------------------
-- REPLICATION NOTICE
-- Apply the same pattern to every school_id-bearing table:
--
--   ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
--
--   CREATE POLICY "<table>: master full access"
--     ON public.<table> FOR ALL
--     USING      (public.auth_user_role() = 'master')
--     WITH CHECK (public.auth_user_role() = 'master');
--
--   CREATE POLICY "<table>: owner school access"
--     ON public.<table> FOR ALL
--     USING (
--       public.auth_user_role() = 'owner'
--       AND school_id = public.auth_user_school_id()
--     )
--     WITH CHECK (
--       public.auth_user_role() = 'owner'
--       AND school_id = public.auth_user_school_id()
--     );
--
-- Tables that need this treatment:
--   public.students
--   public.sessions
--   public.payments
--   public.packages
--   public.package_sales
--   public.checkins
--   public.scheduled_lessons
--   public.referrals
--   public.commission_overrides
--   public.student_progression
--   public.documents
--   (any other table with a school_id column)
--
-- Note: rows written via service_role (e.g. the Add Instructor API route)
-- bypass RLS entirely — that is intentional and expected for server-side
-- admin operations. Do NOT use service_role in any code path that runs in
-- a browser context.
-- ---------------------------------------------------------------------------
