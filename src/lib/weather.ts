// Open-Meteo is free, keyless, and CORS-friendly — no account or secret to
// manage.
export type WeatherSpot = { id: string; label: string; lat: number; lon: number }

// This app has no multi-location/"sedes" concept anywhere in the schema —
// every table is scoped to one hardcoded SCHOOL_ID, single-tenant, no
// locations table to read a list from. Rather than inventing that schema
// for a weather picker alone, this is a small curated list of real,
// well-known wind/kite spots along the Ceará coast (the school itself,
// Taíba Kites, is named after one of them) — a plausible set of places an
// operator actually wants to check, not a database-backed location registry.
export const WEATHER_SPOTS: WeatherSpot[] = [
  { id: 'fortaleza',     label: 'Fortaleza',         lat: -3.7319, lon: -38.5267 },
  { id: 'cumbuco',       label: 'Cumbuco',           lat: -3.6167, lon: -38.7333 },
  { id: 'taiba',         label: 'Taíba',             lat: -3.5667, lon: -38.9000 },
  { id: 'icarai',        label: 'Icaraí de Amontada', lat: -3.2667, lon: -39.3667 },
  { id: 'jericoacoara',  label: 'Jericoacoara',      lat: -2.7967, lon: -40.5136 },
]
export const DEFAULT_WEATHER_SPOT_ID = WEATHER_SPOTS[0].id

export function resolveWeatherSpot(spotId?: string | null): WeatherSpot {
  return WEATHER_SPOTS.find(s => s.id === spotId) ?? WEATHER_SPOTS[0]
}

export type WeatherData = {
  temperature: number
  windSpeedKn: number
  windDirectionDeg: number
  weatherCode: number
  spotId: string
  spotLabel: string
}

export async function getWeather(spotId?: string | null): Promise<WeatherData | null> {
  const spot = resolveWeatherSpot(spotId)
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
