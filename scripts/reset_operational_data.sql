-- =============================================================================
-- OPERATIONAL RESET — irreversible. Wipes every real per-school data row
-- (students, bookings, lessons, sessions, payments, costs, etc.), keeping
-- only the setup/config layer, so the school starts exactly like a brand
-- new one on its next login.
--
-- Deliberately NOT in supabase/migrations/ — this is a one-time data wipe,
-- not a schema change, and has no business being replayed if the DB is
-- ever rebuilt from the migration history. Run manually, once, in the
-- Supabase SQL Editor when you're ready — select this file's ENTIRE
-- contents (BEGIN through the final COMMIT) and run it as ONE execution.
-- Do not split BEGIN/DELETE and COMMIT into separate "Run" actions — if
-- COMMIT lands on a different connection than the one that ran the
-- deletes, it silently does nothing while the real transaction
-- auto-rolls-back in the background (this happened on a real attempt:
-- the deletes reported success, but nothing was actually gone afterward).
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

-- Delete order below is derived from the ACTUAL live FK graph (verified via
-- scripts/inspect_fk_graph.sql against information_schema — several of
-- these tables predate the tracked migration files, so this could not be
-- fully determined from supabase/migrations/ alone). Every edge among the
-- wiped tables:
--   bookings->students, checkins->package_sales, checkins->scheduled_lessons,
--   lesson_requests->scheduled_lessons, package_sales->students,
--   referrals->package_sales, referrals->sessions,
--   scheduled_lessons->lesson_groups (SET NULL), scheduled_lessons->package_sales
--   (SET NULL), scheduled_lessons->scheduled_lessons (self, via rescheduled_from),
--   sessions->checkins, sessions->scheduled_lessons, sessions->package_sales,
--   student_progression->sessions, student_progression->students
-- None of the kept tables (schools/users/activities/packages/partners) are
-- ever a referencing table anywhere in the graph — only ever referenced —
-- so nothing here can cascade into them regardless of order.

BEGIN;

DO $$
DECLARE
  v_school_id CONSTANT uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Tables nothing else in this wipe depends on — safe first, order among
  -- these nine doesn't matter.
  DELETE FROM public.lesson_groups              WHERE school_id = v_school_id;
  DELETE FROM public.commission_history          WHERE school_id = v_school_id;
  DELETE FROM public.commission_overrides        WHERE school_id = v_school_id;
  DELETE FROM public.instructor_advances         WHERE school_id = v_school_id;
  DELETE FROM public.operational_costs           WHERE school_id = v_school_id;
  DELETE FROM public.payments                    WHERE school_id = v_school_id;
  DELETE FROM public.seasons                     WHERE school_id = v_school_id;
  DELETE FROM public.school_notices              WHERE school_id = v_school_id;
  DELETE FROM public.school_financial_documents  WHERE school_id = v_school_id;

  -- Nothing else in this wipe references these four — safe next.
  DELETE FROM public.bookings                    WHERE school_id = v_school_id;
  DELETE FROM public.lesson_requests             WHERE school_id = v_school_id;
  DELETE FROM public.referrals                   WHERE school_id = v_school_id;
  DELETE FROM public.student_progression         WHERE school_id = v_school_id;

  -- sessions was blocked only by referrals/student_progression, both gone now.
  DELETE FROM public.sessions                    WHERE school_id = v_school_id;

  -- checkins was blocked only by sessions, gone now.
  DELETE FROM public.checkins                    WHERE school_id = v_school_id;

  -- scheduled_lessons.rescheduled_from self-references this same table —
  -- null it out first so the bulk delete below can't trip over a row still
  -- pointing at a sibling row in the same statement.
  UPDATE public.scheduled_lessons SET rescheduled_from = NULL WHERE school_id = v_school_id;
  DELETE FROM public.scheduled_lessons           WHERE school_id = v_school_id;

  -- package_sales was blocked by checkins/referrals, both gone now.
  DELETE FROM public.package_sales               WHERE school_id = v_school_id;

  -- students was blocked by bookings/package_sales, both gone now.
  DELETE FROM public.students                    WHERE school_id = v_school_id;
END $$;

-- Verification pass already happened (this ordering was confirmed correct
-- against the live FK graph, all-zero result). The row counts below are
-- now just a receipt, not a manual gate — COMMIT is part of this same
-- execution, on purpose: running it as a separate step last time meant it
-- landed on a fresh connection with no open transaction, silently doing
-- nothing while the real one auto-rolled-back. Select ALL of this file's
-- text (BEGIN through the final COMMIT) and run it as ONE paste.
SELECT 'students' t, count(*) FROM public.students
UNION ALL SELECT 'checkins', count(*) FROM public.checkins
UNION ALL SELECT 'package_sales', count(*) FROM public.package_sales
UNION ALL SELECT 'scheduled_lessons', count(*) FROM public.scheduled_lessons
UNION ALL SELECT 'sessions', count(*) FROM public.sessions
UNION ALL SELECT 'lesson_groups', count(*) FROM public.lesson_groups
UNION ALL SELECT 'lesson_requests', count(*) FROM public.lesson_requests
UNION ALL SELECT 'bookings', count(*) FROM public.bookings
UNION ALL SELECT 'payments', count(*) FROM public.payments
UNION ALL SELECT 'referrals', count(*) FROM public.referrals
UNION ALL SELECT 'student_progression', count(*) FROM public.student_progression
UNION ALL SELECT 'operational_costs', count(*) FROM public.operational_costs
UNION ALL SELECT 'instructor_advances', count(*) FROM public.instructor_advances
UNION ALL SELECT 'commission_history', count(*) FROM public.commission_history
UNION ALL SELECT 'commission_overrides', count(*) FROM public.commission_overrides
UNION ALL SELECT 'seasons', count(*) FROM public.seasons
UNION ALL SELECT 'school_notices', count(*) FROM public.school_notices
UNION ALL SELECT 'school_financial_documents', count(*) FROM public.school_financial_documents
UNION ALL SELECT 'users (should be unchanged)', count(*) FROM public.users
UNION ALL SELECT 'activities (should be unchanged)', count(*) FROM public.activities
UNION ALL SELECT 'packages (should be unchanged)', count(*) FROM public.packages
UNION ALL SELECT 'partners (should be unchanged)', count(*) FROM public.partners
UNION ALL SELECT 'certificate_templates (should be unchanged)', count(*) FROM public.certificate_templates;

-- Everything above should read 0, except the five "should be unchanged"
-- rows.
COMMIT;
