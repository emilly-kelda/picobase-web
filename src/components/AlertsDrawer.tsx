'use client'

import { useState } from 'react'
import type { Alert } from '@/repositories/alertRepository'
import Badge from '@/components/ui/Badge'

const ALERT_LABEL: Record<Alert['type'], string> = { error: 'Erro', warning: 'Atenção', info: 'Info' }

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

export default function AlertsDrawer({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false)

  if (alerts.length === 0) return null

  return (
    <>
      {/* Floating trigger — fixed to the viewport, so it stays reachable
          regardless of scroll position or which column is under the cursor. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir alertas"
        style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 90,
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#fff', border: '0.5px solid var(--border)',
          boxShadow: 'var(--shadow-md)', color: 'var(--amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <BellIcon size={18} />
        <span style={{
          position: 'absolute', top: '-3px', right: '-3px',
          minWidth: '18px', height: '18px', padding: '0 4px',
          borderRadius: '99px', background: 'var(--signal)', color: '#fff',
          fontSize: '10px', fontWeight: '700', lineHeight: '18px', textAlign: 'center',
        }}>
          {alerts.length}
        </span>
      </button>

      {/* Overlay + sliding sheet — always mounted, driven purely by `open` via
          CSS transitions (opacity on the overlay, transform on the panel).
          Simpler than timer-based enter/exit animation and avoids any
          unmount-timing edge cases. */}
      <div
        aria-hidden={!open}
        onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, right: 0, height: '100%',
          width: '380px', maxWidth: '90vw', background: '#fff',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 20px', borderBottom: '0.5px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--amber)',
            }}>
              Atenção · {alerts.length}
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              style={{
                width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--powder)', color: 'var(--mist)',
                cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {alerts.map((alert, i) => (
              <a
                key={i}
                href={alert.link ?? '#'}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', textDecoration: 'none',
                  padding: '14px 20px',
                  borderBottom: i < alerts.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <Badge variant={alert.type === 'error' ? 'danger' : 'neutral'} className="flex-shrink-0">
                  {ALERT_LABEL[alert.type]}
                </Badge>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--slate)', lineHeight: '1.5' }}>
                  {alert.message}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--mist)', flexShrink: 0 }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
