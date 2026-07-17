-- One-way master -> owner notices, shown as a dismissible banner in /owner.
-- read_at is set (client-side PATCH) when the owner dismisses it; the owner
-- banner only ever shows the most recent notice with read_at IS NULL.

CREATE TABLE IF NOT EXISTS public.school_notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS school_notices_school_id_idx ON public.school_notices(school_id);
