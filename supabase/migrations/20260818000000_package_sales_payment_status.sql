ALTER TABLE package_sales
  ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN payment_method text;

-- Every historical sale was charged in full at sale time (sell-package
-- always inserted price_paid as the full amount) — this backfill is a
-- correct fact, not a guess.
UPDATE package_sales SET amount_paid = price_paid;
