-- Payment-status tracking for operational_costs. due_date already exists
-- (lets "atrasado" be derived as due_date < today), but nothing records
-- whether a cost has actually been paid — "pago" was previously
-- unrepresentable. paid_at is nullable: null = not yet paid, a timestamp =
-- when it was marked paid. Deliberately a timestamp, not a boolean, so
-- "when" is available for free if ever needed (audit trail), same
-- reasoning as sessions.received_at / waiver_signed_at elsewhere.

ALTER TABLE public.operational_costs
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
