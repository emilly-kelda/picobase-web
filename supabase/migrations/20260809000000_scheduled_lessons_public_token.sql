-- Public per-lesson token for the WhatsApp student self-service page
-- (/aula/[token]) + a lightweight "student confirmed attendance" marker
-- that is deliberately SEPARATE from status='confirmed' (which means
-- "class happened, revenue recorded" — see /api/owner/confirm-lesson).

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS student_confirmed_at timestamptz;

-- gen_random_uuid() is volatile, so the ADD COLUMN above rewrites the table
-- and fills each existing row with a DISTINCT value; the unique index then
-- holds for both existing and future rows.
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_lessons_public_token_idx
  ON public.scheduled_lessons (public_token);
