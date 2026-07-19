import { compassLabel, weatherIcon, type WeatherData } from '@/lib/weather'

// Padding/gap sized for Base Camp's right-hand sidebar column (its only
// call site) — narrower than the old top-of-page 2-column row this used
// to sit in, so the layout was tightened to match rather than wrapping.
export default function WeatherWidget({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div style={{ fontSize: '24px', lineHeight: 1 }}>
        {weatherIcon(weather.weatherCode)}
      </div>
      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '2px',
          }}>
            Temp.
          </div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(weather.temperature)}°C
          </div>
        </div>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '2px',
          }}>
            Vento
          </div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(weather.windSpeedKn)}kn
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--mist)', marginLeft: '4px' }}>
              {compassLabel(weather.windDirectionDeg)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
