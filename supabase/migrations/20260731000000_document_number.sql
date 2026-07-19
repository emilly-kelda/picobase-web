-- CPF (Brazilian nationals) or Passport (foreign nationals) captured at
-- public check-in (checkin/[school]/CheckinForm.tsx) for waiver legal
-- validity and precise reception-side search (AddBookingModal.tsx).
--
-- One column pair on both tables, not separate cpf/passport columns —
-- document_type disambiguates so it can still be labeled correctly
-- ("CPF: ..." vs "Passaporte: ...") without needing two nullable columns
-- and an OR'd search across both. Plaintext, not encrypted like
-- health_conditions/pix_key: this field's whole purpose is to be
-- ILIKE-searchable by reception, which an encrypted column can't support.
-- It sits alongside name/email/whatsapp (already plaintext PII in this
-- schema) rather than alongside the fields that get the encryption
-- treatment.

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS document_type   TEXT CHECK (document_type IN ('cpf', 'passport'));

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS document_type   TEXT CHECK (document_type IN ('cpf', 'passport'));
