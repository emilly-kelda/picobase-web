-- HOTFIX — restores the two columns 20260816000000 dropped.
--
-- That migration's DROP COLUMN ran immediately against the live database,
-- but the app code that stops reading payout_model/fixed_payout_value only
-- ships on a separate, explicit deploy (git push) — which had not happened
-- yet. The still-live old code's getSchool() query (called unguarded at
-- the top of /owner/page.tsx) still selects both columns, so every request
-- to the owner dashboard started failing with "column does not exist" the
-- moment the DROP ran. This restores them so the currently-deployed code
-- works again immediately, no deploy required.
--
-- The actual prior values (whatever payout_model/fixed_payout_value this
-- school had configured) were NOT preserved by the DROP — they're gone.
-- 'percentage' is restored as the default, which is what every
-- confirm-session route already treats as the safe/neutral case (no
-- flat-rate override), so this does not reintroduce incorrect commission
-- amounts — it only stops the crash.
--
-- Do not re-drop these columns until the code from 20260816000000's
-- companion commit (the one removing every payout_model/fixed_payout_value
-- reference from src/) has actually been deployed and confirmed working.

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS payout_model text NOT NULL DEFAULT 'percentage';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS fixed_payout_value numeric;
