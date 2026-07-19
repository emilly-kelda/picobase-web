-- Lets a staff-created booking (owner/bookings AddBookingModal) link to an
-- existing students row instead of re-typing a customer's contact info —
-- the customer already provided it once via the public check-in/waiver
-- form (checkin/[school]), which find-or-creates a students row per
-- api/checkin/route.ts. Nullable: the public /book/[school] intake form
-- and the "cadastrar novo cliente manualmente" fallback both still create
-- bookings with no matching student yet.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id);
