-- =============================================================================
-- Receivables ("A Receber"): sessions confirmed with payment_method = 'a_receber'
-- are money owed to the school but not yet collected. received_at marks when
-- that outstanding payment was actually collected; NULL means still unpaid.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NULL;
