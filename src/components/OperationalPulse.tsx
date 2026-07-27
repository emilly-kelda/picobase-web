'use client'

import { useState } from 'react'
import type { Alert } from '@/repositories/alertRepository'

const SEVERITY_RANK: Record<Alert['type'], number> = { error: 0, warning: 1, info: 2 }
const DOT_COLOR: Record<Alert['type'], string> = {
  error:   'var(--signal)',
  warning: 'var(--amber)',
  info:    'var(--color-pb-glacial-dark)',
}

const VISIBLE_COUNT = 4

/** Top-of-dashboard "what needs a decision today" strip — replaces the old
 *  AlertsDrawer floating bell, which put the exact same alerts one click
 *  away from anyone who didn't think to look for a bell in the corner.
 *  Same `alerts` data (getAlerts), just promoted from "hidden until
 *  clicked" to "the first thing on the page", per the redesign ask to lead
 *  with what needs attention instead of static metrics. Sorted
 *  error > warning > info so a medical alert never sits below a routine
 *  "package running low" note. Returns null when there's nothing to act
 *  on — an empty-state banner every single day would be its own kind of
 *  noise. */
export default function OperationalPulse({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded] = useState(false)

  if (alerts.length === 0) return null

  const sorted = [...alerts].sort((a, b) => SEVERITY_RANK[a.type] - SEVERITY_RANK[b.type])
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hiddenCount = sorted.length - visible.length

  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: '24px',
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
          Pulso Operacional
        </span>
        <span style={{
          minWidth: '18px', height: '18px', padding: '0 5px',
          borderRadius: '99px', background: 'var(--signal-light)', color: 'var(--signal)',
          fontSize: '10px', fontWeight: '700', lineHeight: '18px', textAlign: 'center',
        }}>
          {alerts.length}
        </span>
      </div>

      <div>
        {visible.map((alert, i) => (
          <a
            key={i}
            href={alert.link ?? '#'}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              textDecoration: 'none', padding: '12px 20px',
              borderBottom: i < visible.length - 1 || hiddenCount > 0 ? '0.5px solid var(--border)' : 'none',
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
    </div>
  )
}
