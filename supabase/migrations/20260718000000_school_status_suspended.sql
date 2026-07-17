-- Adds 'suspended' to schools.status_assinatura. Unlike the earlier
-- additive migrations, this one changes an existing CHECK constraint's
-- allowed values, so it has to drop and recreate rather than just add.
--
-- 'suspended' is enforced as a real access block, not just a status label —
-- see src/app/owner/layout.tsx, which redirects a suspended school's owner
-- to /account-suspended instead of rendering /owner.

ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_status_assinatura_check;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_status_assinatura_check
  CHECK (status_assinatura IN ('trial', 'active', 'past_due', 'suspended'));
