-- Registers a reference (URL/link) to a financial document per school —
-- nota fiscal, recibo, or a billing link. Not a file upload: there's no
-- Storage/upload infrastructure anywhere in this codebase today, every
-- existing "document" field (receipt_url, waiver_en, ...) is plain text/URL.

CREATE TABLE IF NOT EXISTS public.school_financial_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL,
  url         TEXT NOT NULL,
  note        TEXT,
  created_by  UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_financial_documents_school_id_idx ON public.school_financial_documents(school_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'school_financial_documents_doc_type_check'
      AND conrelid = 'public.school_financial_documents'::regclass
  ) THEN
    ALTER TABLE public.school_financial_documents
      ADD CONSTRAINT school_financial_documents_doc_type_check
      CHECK (doc_type IN ('nota_fiscal', 'recibo', 'link_cobranca'));
  END IF;
END;
$$;
