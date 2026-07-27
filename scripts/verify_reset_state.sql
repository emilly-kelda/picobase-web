-- Read-only, standalone (no BEGIN/COMMIT — nothing to accidentally leave
-- open). Run this by itself, fresh, to see the actual current database
-- state right now, independent of whatever happened with the earlier
-- transaction.
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
