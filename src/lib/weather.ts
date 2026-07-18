// Open-Meteo is free, keyless, and CORS-friendly — no account or secret to
// manage. Coordinates are hardcoded to Fortaleza (this app is single-school
// today; the timezone is already hardcoded to America/Fortaleza in several
// places — e.g. ScheduledLessons.tsx, MissedLessons.tsx — so this matches an
// existing assumption rather than introducing a new one).
const FORTALEZA_LAT = -3.7319
const FORTALEZA_LON = -38.5267

export type WeatherData = {
  temperature: number
  windSpeedKn: number
  windDirectionDeg: number
  weatherCode: number
}

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${FORTALEZA_LAT}&longitude=${FORTALEZA_LON}` +
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
    }
  } catch {
    return null
  }
}

const COMPASS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']
export function compassLabel(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8]
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
