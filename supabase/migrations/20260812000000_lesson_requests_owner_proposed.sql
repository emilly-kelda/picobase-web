-- Owner-initiated reschedule proposals (RescheduleModal, missed lessons):
-- the instructor proposes a new date, the student accepts/declines via
-- their existing per-lesson /aula/[token] link, and the schedule only
-- actually changes on acceptance. Opposite direction from the existing
-- 'reschedule' type (student proposes, owner approves) — kept as a
-- distinct type rather than reusing 'reschedule' so it never shows up in
-- the owner's own PendingRequestsAlert (that queue is for requests THEY
-- need to act on, not ones they just sent and are waiting on the student
-- for — see lessonRequestRepository.getPendingLessonRequests, which
-- explicitly excludes this type).

ALTER TABLE public.lesson_requests DROP CONSTRAINT IF EXISTS lesson_requests_type_check;

ALTER TABLE public.lesson_requests ADD CONSTRAINT lesson_requests_type_check
  CHECK (type IN ('reschedule', 'cancellation', 'owner_proposed_reschedule'));
