-- Optional link to the school's own Privacy Policy document, shown next to
-- the LGPD/GDPR consent checkbox at check-in (checkin/[school]/CheckinForm.tsx)
-- only when set. Deliberately just a URL, not a generated document — a
-- real privacy policy needs the school's own legal review, so this app
-- doesn't author or assume one; the checkbox text makes a general LGPD/GDPR
-- reference regardless of whether a specific policy document exists yet.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;
