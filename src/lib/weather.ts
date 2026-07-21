// Open-Meteo is free, keyless, and CORS-friendly — no account or secret to
// manage.
export type WeatherSpot = { id: string; label: string; lat: number; lon: number }

// Small curated list of real, well-known wind/kite spots along the Ceará
// coast (the school itself, Taíba Kites, is named after one of them) — a
// fallback for a school that hasn't configured its own location yet
// (Settings → Geral, schools.spot_name/latitude/longitude). Once a school
// has one saved, buildWeatherSpots() below returns ONLY that spot — no
// picker, no quick-swap to Cumbuco/Taíba/etc. — the school's own location
// is authoritative, not one option among several. This list only exists
// to give a new school something to look at before they've set anything.
const CURATED_WEATHER_SPOTS: WeatherSpot[] = [
  { id: 'fortaleza',     label: 'Fortaleza',         lat: -3.7319, lon: -38.5267 },
  { id: 'cumbuco',       label: 'Cumbuco',           lat: -3.6167, lon: -38.7333 },
  { id: 'taiba',         label: 'Taíba',             lat: -3.5667, lon: -38.9000 },
  { id: 'icarai',        label: 'Icaraí de Amontada', lat: -3.2667, lon: -39.3667 },
  { id: 'jericoacoara',  label: 'Jericoacoara',      lat: -2.7967, lon: -40.5136 },
]

/** Builds the spot list for a given school. A configured school gets a
 *  single-item list (its own location) — WeatherWidget uses spots.length
 *  <= 1 as the signal to hide the picker entirely, since there's nothing
 *  to switch to. A school with nothing configured yet gets the curated
 *  Ceará list instead, picker included, purely as a placeholder until
 *  they set a real one in Settings → Geral. Called server-side (owner/
 *  page.tsx) with the school row already fetched — the result feeds both
 *  getWeather() (which spot to fetch) and WeatherWidget (what to render),
 *  so the two always agree. */
export function buildWeatherSpots(school?: {
  spot_name?: string | null
  latitude?: number | null
  longitude?: number | null
} | null): WeatherSpot[] {
  if (school?.latitude != null && school?.longitude != null) {
    return [
      { id: 'school', label: school.spot_name || 'Localização da escola', lat: school.latitude, lon: school.longitude },
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

export type WeatherIconKind = 'sun' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

/** WMO weather codes (used by Open-Meteo) collapsed to an icon kind — the
 *  actual glyph (WeatherIcon, weather-icons.tsx) is a monochrome SVG, not
 *  an emoji. */
export function weatherIcon(code: number): WeatherIconKind {
  if (code === 0) return 'sun'
  if (code <= 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'fog'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}
