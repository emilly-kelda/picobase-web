-- Infra status panel (/master/status): a SECURITY DEFINER RPC wrapping
-- pg_catalog/storage metadata that the service-role key can't otherwise
-- see through PostgREST's exposed-schema restriction. Same pattern as
-- auth_user_role() etc. in 20260717000000_master_role_rls.sql — the
-- function owner (postgres, via migration) already has the privileges
-- to read pg_stat_activity/pg_database_size; callers only need EXECUTE.
--
-- storage_bytes sums storage.objects.metadata->>'size' across every
-- bucket (partner-logos, school-waivers, ...) — Supabase's actual
-- "Storage" product, not Postgres table data.

CREATE OR REPLACE FUNCTION public.get_infra_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_db_size      bigint;
  v_storage_size bigint;
  v_active_conns int;
  v_max_conns    int;
BEGIN
  SELECT pg_catalog.pg_database_size(pg_catalog.current_database()) INTO v_db_size;

  SELECT count(*) INTO v_active_conns
  FROM pg_catalog.pg_stat_activity
  WHERE datname = pg_catalog.current_database();

  SELECT setting::int INTO v_max_conns
  FROM pg_catalog.pg_settings
  WHERE name = 'max_connections';

  SELECT coalesce(sum((metadata->>'size')::bigint), 0) INTO v_storage_size
  FROM storage.objects;

  RETURN json_build_object(
    'db_size_bytes',      v_db_size,
    'storage_bytes',      v_storage_size,
    'active_connections', v_active_conns,
    'max_connections',    v_max_conns
  );
END;
$$;

-- service_role only — this is internal infra data for the master status
-- page, called exclusively via createServiceClient() behind requireMaster().
GRANT EXECUTE ON FUNCTION public.get_infra_status() TO service_role;
