-- Custom package icon upload — lets an owner replace the default sport
-- icon/emoji (src/components/SportIcon.tsx) on a per-package basis.
-- Uploads go through api/owner/packages/upload-icon (service-role client),
-- same pattern as 20260722000000_partner_logo_upload.sql — no INSERT/UPDATE
-- policy on storage.objects needed, only a public SELECT policy so the
-- resulting URLs render in <img> tags without auth.

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('package-icons', 'package-icons', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read access for package icons'
  ) THEN
    CREATE POLICY "Public read access for package icons"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'package-icons');
  END IF;
END;
$$;
