-- Read-only. Lists every foreign key pointing FROM or TO any table involved
-- in reset_operational_data.sql, straight from the live schema — run this
-- first and paste the result back so the DELETE order in that script can be
-- corrected with certainty instead of another guess. Changes nothing.

SELECT
  tc.table_name       AS referencing_table,
  kcu.column_name      AS referencing_column,
  ccu.table_name        AS referenced_table,
  ccu.column_name       AS referenced_column,
  rc.delete_rule         AS on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN (
      'students', 'checkins', 'package_sales', 'scheduled_lessons', 'sessions',
      'lesson_groups', 'lesson_requests', 'bookings', 'payments', 'referrals',
      'student_progression', 'operational_costs', 'instructor_advances',
      'commission_history', 'commission_overrides', 'seasons', 'school_notices',
      'school_financial_documents'
    )
    OR ccu.table_name IN (
      'students', 'checkins', 'package_sales', 'scheduled_lessons', 'sessions',
      'lesson_groups', 'lesson_requests', 'bookings', 'payments', 'referrals',
      'student_progression', 'operational_costs', 'instructor_advances',
      'commission_history', 'commission_overrides', 'seasons', 'school_notices',
      'school_financial_documents'
    )
  )
ORDER BY referencing_table, referencing_column;
