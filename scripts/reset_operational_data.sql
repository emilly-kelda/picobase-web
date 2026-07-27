-- =============================================================================
-- OPERATIONAL RESET — irreversible. Wipes every real per-school data row
-- (students, bookings, lessons, sessions, payments, costs, etc.), keeping
-- only the setup/config layer, so the school starts exactly like a brand
-- new one on its next login.
--
-- Deliberately NOT in supabase/migrations/ — this is a one-time data wipe,
-- not a schema change, and has no business being replayed if the DB is
-- ever rebuilt from the migration history. Run manually, once, in the
-- Supabase SQL Editor when you're ready.
--
-- KEPT (config/team/pricing — untouched):
--   schools                 school settings, waiver text, notifications, etc.
--   users                   owner login + every instructor account, WITH
--                           their commission_mode/fixed_per_hour config —
--                           this is the login table, not a customer table;
--                           students are entirely separate (see below).
--   activities               modality/pricing catalog (Kitesurf, Surf, ...)
--   packages                  package-type catalog (name, hours, price)
--   partners                  partner records + their referral codes/links
--                              (their REFERRAL HISTORY is wiped below, the
--                              partner record + working link is not)
--   certificate_templates      certificate branding/design config
--
-- WIPED (every other real per-school row):
--   students, checkins, package_sales, scheduled_lessons, sessions,
--   lesson_groups, lesson_requests, bookings, payments, referrals,
--   student_progression, operational_costs, instructor_advances,
--   commission_history, commission_overrides, seasons, school_notices,
--   school_financial_documents
--
-- OUT OF SCOPE (not touched, not this school's data):
--   picobase_costs            platform-level, has no school_id at all
--   v_runway                  a computed VIEW, not a real table — nothing
--                              to delete, it just reflects the tables above
--                              once they're empty
--
-- All primary keys in this schema are UUIDs (gen_random_uuid()) — there
-- are no auto-increment sequences anywhere to reset.
--
-- Wrapped in one transaction: either every DELETE below succeeds and this
-- commits as a whole, or any single failure (e.g. an FK constraint this
-- comment missed) rolls back everything — never a partially-wiped school.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_school_id CONSTANT uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Deleted in dependency order (things that reference other wiped tables
  -- first) so no step can hit a foreign-key violation against a row this
  -- same script already removed.

  DELETE FROM public.student_progression   WHERE school_id = v_school_id;
  DELETE FROM public.referrals              WHERE school_id = v_school_id;
  DELETE FROM public.commission_history     WHERE school_id = v_school_id;
  DELETE FROM public.commission_overrides   WHERE school_id = v_school_id;
  DELETE FROM public.instructor_advances    WHERE school_id = v_school_id;
  DELETE FROM public.lesson_requests        WHERE school_id = v_school_id;
  DELETE FROM public.sessions               WHERE school_id = v_school_id;
  DELETE FROM public.scheduled_lessons      WHERE school_id = v_school_id;
  DELETE FROM public.lesson_groups          WHERE school_id = v_school_id;
  DELETE FROM public.checkins               WHERE school_id = v_school_id;
  DELETE FROM public.package_sales          WHERE school_id = v_school_id;
  DELETE FROM public.students               WHERE school_id = v_school_id;
  DELETE FROM public.bookings               WHERE school_id = v_school_id;
  DELETE FROM public.payments               WHERE school_id = v_school_id;
  DELETE FROM public.operational_costs      WHERE school_id = v_school_id;
  DELETE FROM public.seasons                WHERE school_id = v_school_id;
  DELETE FROM public.school_notices         WHERE school_id = v_school_id;
  DELETE FROM public.school_financial_documents WHERE school_id = v_school_id;
END $$;

-- Review the row counts below BEFORE running COMMIT. If anything looks
-- wrong, run ROLLBACK instead — nothing above is permanent until COMMIT
-- actually runs.
SELECT 'students' t, count(*) FROM public.students
UNION ALL SELECT 'checkins', count(*) FROM public.checkins
UNION ALL SELECT 'package_sales', count(*) FROM public.package_sales
UNION ALL SELECT 'scheduled_lessons', count(*) FROM public.scheduled_lessons
UNION ALL SELECT 'sessions', count(*) FROM public.sessions
UNION ALL SELECT 'bookings', count(*) FROM public.bookings
UNION ALL SELECT 'payments', count(*) FROM public.payments
UNION ALL SELECT 'users (should be unchanged)', count(*) FROM public.users
UNION ALL SELECT 'activities (should be unchanged)', count(*) FROM public.activities
UNION ALL SELECT 'packages (should be unchanged)', count(*) FROM public.packages
UNION ALL SELECT 'partners (should be unchanged)', count(*) FROM public.partners;

-- Everything above should read 0, except the three "should be unchanged"
-- rows. Only once that's confirmed:
-- COMMIT;
