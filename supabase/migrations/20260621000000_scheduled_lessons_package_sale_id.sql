-- =============================================================================
-- Sticky package selection for scheduling (Option B).
--
-- A student can have multiple package_sales rows (e.g. one per activity, or a
-- renewal). The "Agendar aula" dropdown now shows one row per package_sale so
-- the owner picks the exact bucket; package_sale_id carries through to the
-- booking so drawdown hits the correct package instead of guessing by name.
-- =============================================================================

ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS package_sale_id UUID
  REFERENCES public.package_sales(id) ON DELETE SET NULL;
