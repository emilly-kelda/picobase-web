-- =============================================================================
-- Variable package costs (e.g. Downwind boat/fuel) flowing into commission.
--
-- packages.has_variable_cost / variable_cost_name / variable_cost_amount /
-- variable_cost_mode are assumed to already exist (per the requester).
--
-- variable_cost_deduction is an audit trail on sessions: the amount actually
-- deducted from the commission base for this specific confirmed session.
-- price stays the full amount charged (revenue is unaffected) — only
-- commission_amount is computed on price minus this deduction.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS variable_cost_deduction NUMERIC(10,2) DEFAULT NULL;
