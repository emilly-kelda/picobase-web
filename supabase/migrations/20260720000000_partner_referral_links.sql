-- Partner referral links: trackable /book/[slug]?ref=[code] links + QR codes,
-- a customer-facing discount (distinct from commission_pct, which is what the
-- school pays the partner, not what the customer sees), and partner
-- attribution on public bookings.
--
-- referral_code backfilled from name so existing partner rows (inserted by
-- hand before this — there was no create UI) get a working link immediately,
-- no re-save required. Uniqueness suffixed with part of the row id in the
-- rare case two partners share a name.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_pct  NUMERIC;

UPDATE public.partners
SET referral_code = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text, 1, 4)
WHERE referral_code IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partners_referral_code_key'
      AND conrelid = 'public.partners'::regclass
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_referral_code_key UNIQUE (referral_code);
  END IF;
END;
$$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id);
