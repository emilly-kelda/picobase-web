'use client'

import { useEffect, useState } from 'react'
import type { Alert } from '@/repositories/alertRepository'

const SEVERITY_RANK: Record<Alert['type'], number> = { error: 0, warning: 1, info: 2 }
const DOT_COLOR: Record<Alert['type'], string> = {
  error:   'var(--signal)',
  warning: 'var(--amber)',
  info:    'var(--color-pb-glacial-dark)',
}

const VISIBLE_COUNT = 4
const DISMISSED_STORAGE_KEY = 'pb-dismissed-alerts'

/** Alerts list — replaces the old AlertsDrawer floating bell, which put
 *  the exact same alerts one click away from anyone who didn't think to
 *  look for a bell in the corner. Sorted error > warning > info so a
 *  medical alert never sits below a routine "package running low" note.
 *
 *  Dismissal is per-message (each alert's own text is already specific —
 *  a student name, an amount — so it's a stable identity for "this exact
 *  situation"), persisted in localStorage rather than the database: a
 *  dismiss here means "I've seen this, stop showing it to me", not "this
 *  is resolved" — the underlying condition (e.g. a low package balance)
 *  may still be true. If the message changes at all (the amount moves,
 *  a different student), that's a new occurrence and it reappears,
 *  which is the whole point of keying on the message text itself rather
 *  than a generic per-alert-type flag. */
export default function OperationalPulse({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded]   = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
      if (raw) setDismissed(new Set(JSON.parse(raw)))
    } catch {}
    setLoaded(true)
  }, [])

  function dismiss(message: string) {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(message)
      try { localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  if (alerts.length === 0) return null

  // Nothing has been read from localStorage yet on this render (first
  // client paint, before the effect above runs) — show everything rather
  // than a flash of "all dismissed" that then pops back in once loaded.
  const active = loaded ? alerts.filter(a => !dismissed.has(a.message)) : alerts
  const sorted = [...active].sort((a, b) => SEVERITY_RANK[a.type] - SEVERITY_RANK[b.type])
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hiddenCount = sorted.length - visible.length

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--mist)',
        }}>
          Alertas
        </span>
        {sorted.length > 0 && (
          <span style={{
            minWidth: '18px', height: '18px', padding: '0 5px',
            borderRadius: '99px', background: 'var(--signal-light)', color: 'var(--signal)',
            fontSize: '10px', fontWeight: '700', lineHeight: '18px', textAlign: 'center',
          }}>
            {sorted.length}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
            Tudo em dia!
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
            Sem alertas ativos no momento.
          </div>
        </div>
      ) : (
        <div>
          {visible.map((alert, i) => (
            <div
              key={alert.message}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px',
                borderBottom: i < visible.length - 1 || hiddenCount > 0 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <a
                href={alert.link ?? '#'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  textDecoration: 'none', flex: 1, minWidth: 0,
                }}
              >
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                  background: DOT_COLOR[alert.type],
                }} />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--slate)', lineHeight: '1.5' }}>
                  {alert.message}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--mist)', flexShrink: 0 }}>→</span>
              </a>
              <button
                onClick={() => dismiss(alert.message)}
                title="Descartar"
                aria-label="Descartar alerta"
                style={{
                  width: '22px', height: '22px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', background: 'none', borderRadius: 'var(--radius-md)',
                  color: 'var(--mist)', cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--powder)'; e.currentTarget.style.color = 'var(--slate)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--mist)' }}
              >
                ×
              </button>
            </div>
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 20px', border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontSize: '12px', fontWeight: '500', color: 'var(--glacial-dark)',
              }}
            >
              Ver mais {hiddenCount} →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
