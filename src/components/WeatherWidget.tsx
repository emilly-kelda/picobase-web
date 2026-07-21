'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { compassLabel, weatherIcon, type WeatherData, type WeatherSpot } from '@/lib/weather'
import { WeatherIcon } from '@/components/weather-icons'
import { RefreshIcon } from '@/components/nav-icons'

// Same "set the cookie directly, then router.refresh()" pattern OwnerNav.tsx
// already uses for the season switcher — no dedicated API route needed,
// this is a client-readable preference, not something that needs
// server-side validation.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

// Sized for Spot's right-hand sidebar column (its only call site) —
// stacked temp/wind rows instead of side-by-side, since the full compass
// names (e.g. "Leste-Sudeste") need more horizontal room than the old
// 8-point abbreviations did.
export default function WeatherWidget({ weather, spots }: { weather: WeatherData | null; spots: WeatherSpot[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Two phases, both feed the spin animation: `posting` covers the POST
  // that busts the tagged Data Cache entry (see lib/weather.ts), then
  // startTransition's isPending covers router.refresh() actually re-
  // rendering the server component with the now-fresh fetch. A transition
  // callback has to stay synchronous for isPending to track it correctly
  // (same reason AutoRefresh.tsx only wraps the bare router.refresh() call)
  // — awaiting inside it wouldn't reliably hold isPending true.
  async function refreshWeather() {
    setPosting(true)
    try {
      await fetch('/api/owner/refresh-weather', { method: 'POST' })
    } catch {} finally {
      setPosting(false)
    }
    startTransition(() => { router.refresh() })
  }
  const refreshing = posting || isPending

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function selectSpot(id: string) {
    document.cookie = `weather_spot=${id}; path=/; max-age=${COOKIE_MAX_AGE}`
    setOpen(false)
    router.refresh()
  }

  if (!weather) return null

  // Nothing to switch to once the school has its own configured location —
  // buildWeatherSpots() collapses to a single-item list in that case (see
  // src/lib/weather.ts). The picker only exists as a placeholder for a
  // school that hasn't set one yet, where spots still has the curated
  // Ceará fallback list.
  const hasPicker = spots.length > 1

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mist)' }}>
            {weather.spotLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={refreshWeather}
              disabled={refreshing}
              title="Atualizar dados do clima"
              aria-label="Atualizar dados do clima"
              className={refreshing ? 'animate-spin' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', flexShrink: 0,
                border: 'none', borderRadius: 'var(--radius-md)',
                background: 'transparent', color: 'var(--mist)',
                cursor: refreshing ? 'default' : 'pointer', padding: 0,
                transition: 'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!refreshing) { e.currentTarget.style.backgroundColor = 'var(--powder)'; e.currentTarget.style.color = 'var(--slate)' } }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--mist)' }}
            >
              <RefreshIcon size={13} />
            </button>
            {hasPicker && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              title="Trocar local monitorado"
              aria-label="Trocar local monitorado"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', flexShrink: 0,
                border: '0.5px solid var(--border)', borderRadius: '999px',
                background: open ? 'var(--powder)' : '#fff',
                color: 'var(--mist)', cursor: 'pointer',
                padding: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21.5s7-6.5 7-12A7 7 0 0 0 5 9.5c0 5.5 7 12 7 12Z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
            </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: 'var(--slate)', lineHeight: 1, flexShrink: 0 }}>
            <WeatherIcon kind={weatherIcon(weather.weatherCode)} size={26} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                Temp.
              </span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(weather.temperature)}°C
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                Vento
              </span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(weather.windSpeedKn)}kn
              </span>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--mist)' }}>
                {compassLabel(weather.windDirectionDeg)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {hasPicker && open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '180px', overflow: 'hidden',
        }}>
          {spots.map(spot => {
            const active = spot.id === weather.spotId
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => selectSpot(spot.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 14px', textAlign: 'left',
                  border: 'none', borderBottom: '0.5px solid var(--border)',
                  background: active ? 'var(--glacial-light)' : '#fff',
                  color: active ? 'var(--glacial-dark)' : 'var(--slate)',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <span>{spot.label}</span>
                {active && <span>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
