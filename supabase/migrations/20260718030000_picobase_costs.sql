-- PicoBase's own operating expenses (server, licenses, dev costs), for the
-- Centro de Custos net-result calculation: saasRevenue (schools.subscription_value,
-- already summed in schoolRepository.getMasterMetrics()) minus sum(amount) here.

CREATE TABLE IF NOT EXISTS public.picobase_costs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  cost_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
