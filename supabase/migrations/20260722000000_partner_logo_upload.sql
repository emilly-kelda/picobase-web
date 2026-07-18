-- =============================================================================
-- Partner logo upload.
--
-- Adds partners.logo_url and a public Storage bucket to hold the images.
-- Uploads go through api/owner/partners/upload-logo (service-role client),
-- same as every other write in this app — so no INSERT/UPDATE policy on
-- storage.objects is needed, only a public SELECT policy so the resulting
-- URLs actually render in <img> tags without auth.
-- =============================================================================

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read access for partner logos'
  ) THEN
    CREATE POLICY "Public read access for partner logos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'partner-logos');
  END IF;
END;
$$;
