// Open-Meteo is free, keyless, and CORS-friendly — no account or secret to
// manage.
export type WeatherSpot = { id: string; label: string; lat: number; lon: number }

// Small curated list of real, well-known wind/kite spots along the Ceará
// coast (the school itself, Taíba Kites, is named after one of them) — a
// plausible set of places an operator wants to quick-check regardless of
// where the school is actually based. The school's OWN location (set via
// Nominatim search in Settings → Geral, schools.spot_name/latitude/
// longitude) is prepended ahead of these by buildWeatherSpots() below and
// used as the default — these presets are just extra quick-swap options in
// WeatherWidget's popover, not the primary source of "where is my school".
const CURATED_WEATHER_SPOTS: WeatherSpot[] = [
  { id: 'fortaleza',     label: 'Fortaleza',         lat: -3.7319, lon: -38.5267 },
  { id: 'cumbuco',       label: 'Cumbuco',           lat: -3.6167, lon: -38.7333 },
  { id: 'taiba',         label: 'Taíba',             lat: -3.5667, lon: -38.9000 },
  { id: 'icarai',        label: 'Icaraí de Amontada', lat: -3.2667, lon: -39.3667 },
  { id: 'jericoacoara',  label: 'Jericoacoara',      lat: -2.7967, lon: -40.5136 },
]

/** Builds the spot list for a given school: its own configured location
 *  first (if set), then the curated presets. Called server-side (owner/
 *  page.tsx) with the school row already fetched — the result gets passed
 *  to both getWeather() (to resolve which one to fetch) and WeatherWidget
 *  (to render the popover), so the two always agree on the same list. */
export function buildWeatherSpots(school?: {
  spot_name?: string | null
  latitude?: number | null
  longitude?: number | null
} | null): WeatherSpot[] {
  if (school?.latitude != null && school?.longitude != null) {
    return [
      { id: 'school', label: school.spot_name || 'Localização da escola', lat: school.latitude, lon: school.longitude },
      ...CURATED_WEATHER_SPOTS,
    ]
  }
  return CURATED_WEATHER_SPOTS
}

export function resolveWeatherSpot(spots: WeatherSpot[], spotId?: string | null): WeatherSpot {
  return spots.find(s => s.id === spotId) ?? spots[0]
}

export type WeatherData = {
  temperature: number
  windSpeedKn: number
  windDirectionDeg: number
  weatherCode: number
  spotId: string
  spotLabel: string
}

export async function getWeather(spot: WeatherSpot): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&wind_speed_unit=kn&timezone=America%2FFortaleza`
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return null
    const data = await res.json()
    const current = data?.current
    if (!current) return null
    return {
      temperature:       current.temperature_2m,
      windSpeedKn:       current.wind_speed_10m,
      windDirectionDeg:  current.wind_direction_10m,
      weatherCode:       current.weather_code,
      spotId:            spot.id,
      spotLabel:         spot.label,
    }
  } catch {
    return null
  }
}

// 16-point compass with full Portuguese names rather than abbreviations
// (e.g. "Leste-Sudeste" instead of "ESE") — wind direction meaningfully
// affects lesson/spot choice for kite and wingfoil, so the extra precision
// over the previous 8-point label is worth the longer string.
const COMPASS_16 = [
  'Norte', 'Norte-Nordeste', 'Nordeste', 'Leste-Nordeste',
  'Leste', 'Leste-Sudeste', 'Sudeste', 'Sul-Sudeste',
  'Sul', 'Sul-Sudoeste', 'Sudoeste', 'Oeste-Sudoeste',
  'Oeste', 'Oeste-Noroeste', 'Noroeste', 'Norte-Noroeste',
]
export function compassLabel(deg: number): string {
  return COMPASS_16[Math.round(deg / 22.5) % 16]
}

/** WMO weather codes (used by Open-Meteo) collapsed to a simple emoji. */
export function weatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌥️'
}
