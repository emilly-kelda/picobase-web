-- Student-initiated reschedule/cancellation requests raised from the public
-- /aula/[token] page. Named lesson_requests (NOT session_requests) to avoid
-- confusion with the unrelated `sessions` (realized/paid lessons) table.
--
-- No-RLS pattern, same as bookings (see 20260716010000_bookings.sql): every
-- read/write goes through the service-role client (public /api/aula, owner
-- /api/owner/lesson-requests), so RLS would only risk silent-block bugs.

CREATE TABLE IF NOT EXISTS public.lesson_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           uuid NOT NULL REFERENCES public.schools(id),
  scheduled_lesson_id uuid NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  type                text NOT NULL CHECK (type IN ('reschedule', 'cancellation')),
  requested_data      jsonb,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz
);

CREATE INDEX IF NOT EXISTS lesson_requests_pending_idx
  ON public.lesson_requests (school_id, status, created_at DESC);
