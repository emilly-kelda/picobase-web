-- Lets an owner set the school's own home spot (name + coordinates) via a
-- Nominatim/OpenStreetMap search in Settings, instead of typing lat/lon by
-- hand. Feeds Base Camp's WeatherWidget as the default monitored location
-- (see src/lib/weather.ts) — previously that widget only had a hardcoded
-- list of Ceará spots to pick from, with no per-school concept at all.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS spot_name TEXT,
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
