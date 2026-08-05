-- Extends the existing picobase_costs table (Centro de Custos, see
-- 20260718030000_picobase_costs.sql) rather than introducing a parallel
-- platform_expenses table — /master/costs already tracks PicoBase's own
-- operating expenses against real subscription revenue (getMasterMetrics'
-- saasRevenue, from schools.subscription_value); a second, differently
-- sourced expense/revenue system would just produce two numbers that don't
-- agree with each other.
--
-- is_recurring distinguishes ongoing SaaS/infra bills (Vercel, Supabase,
-- Resend...) from one-off costs, so the net-margin calculation on that page
-- can weigh against recurring costs only. Existing rows default to true
-- (recurring) — the categories already logged so far are overwhelmingly
-- recurring infra/software bills.

ALTER TABLE public.picobase_costs
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT true;
