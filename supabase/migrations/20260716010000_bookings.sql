-- =============================================================================
-- Public booking intake ("Solicitar aula") — /book/[school].
--
-- Lead capture only, no payment: a student submits a request, the owner
-- confirms or declines it from /owner/bookings. Mirrors the no-RLS pattern
-- already used for commission_history/instructor_advances — every write goes
-- through the service-role client (see /api/book, /api/owner/bookings), so
-- RLS would add nothing here and only risk the silent-block bug already fixed
-- once on the commission route.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id),
  student_name   TEXT NOT NULL,
  whatsapp       TEXT NOT NULL,
  activity_id    UUID REFERENCES public.activities(id),
  preferred_date DATE,
  preferred_time TEXT,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_school_id_idx
  ON public.bookings (school_id, created_at DESC);
