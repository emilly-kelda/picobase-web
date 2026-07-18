-- =============================================================================
-- Waiver as an uploaded file (PDF/DOCX) instead of typed text.
--
-- waiver_type switches the check-in waiver step between the existing typed
-- text (waiver_en/pt/fr/es, unchanged) and an uploaded document. The two
-- resolution paths are independent: waiver_file_global_url is a single
-- document valid for every language; waiver_files_by_lang overrides it
-- per-language when the school wants localized documents. Resolution order
-- (per language, at read time): waiver_files_by_lang[lang] ->
-- waiver_file_global_url -> (fall back to the typed-text flow).
--
-- Same upload pattern as the partner-logos bucket (20260722000000): a
-- public bucket, uploads via a service-role API route (not direct
-- client-to-storage), so only a public-read policy is needed here.
-- =============================================================================

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS waiver_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS waiver_file_global_url TEXT,
  ADD COLUMN IF NOT EXISTS waiver_files_by_lang JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_waiver_type_check'
      AND conrelid = 'public.schools'::regclass
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_waiver_type_check
      CHECK (waiver_type IN ('text', 'file'));
  END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-waivers', 'school-waivers', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read access for school waivers'
  ) THEN
    CREATE POLICY "Public read access for school waivers"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'school-waivers');
  END IF;
END;
$$;
