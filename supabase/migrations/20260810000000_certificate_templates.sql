-- Lets the school owner customize certificate appearance (background theme
-- or custom image, generic or per-sport, plus a signature and the school's
-- own logo) instead of the fully hardcoded look certificate-pdf.tsx had
-- until now.
--
-- Scoped by sport_key (free text, normalized via normalizeSportKey — e.g.
-- 'kitesurf'), NOT activity_id. A school can have several `activities` rows
-- that normalize to the same sport (e.g. "Kitesurf - Iniciante" and
-- "Kitesurf - Avançado"), and the rest of the certificate/progression
-- system already keys by this same normalized sport string (see
-- student_progression.sport from migration 20260809000002) — activity_id
-- would create a subtly wrong join.

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  sport_key text NULL, -- NULL = generic template (all sports)
  theme_key text NOT NULL DEFAULT 'oceano',
  background_image_url text NULL,
  signature_type text NOT NULL DEFAULT 'text'
    CHECK (signature_type IN ('upload', 'fictitious', 'text')),
  signature_data text NULL, -- upload: storage URL; fictitious: preset key; text: typed name/title
  font_family text NULL,    -- cursive font key, used by 'text' signatures
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One generic template per school.
CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_generic_uidx
  ON public.certificate_templates (school_id) WHERE sport_key IS NULL;
-- One template per sport per school.
CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_sport_uidx
  ON public.certificate_templates (school_id, sport_key) WHERE sport_key IS NOT NULL;

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url text NULL;

-- Same convention as school-waivers/partner-logos: public bucket + public-read
-- policy, uploads always go through the service-role client server-side.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('certificate-assets', 'certificate-assets', true)
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read access for certificate-assets'
  ) THEN
    CREATE POLICY "Public read access for certificate-assets"
      ON storage.objects FOR SELECT USING (bucket_id = 'certificate-assets');
  END IF;
END $$;
