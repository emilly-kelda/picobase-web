'use client'

import { useState } from 'react'
import type { InfraStatus } from '@/repositories/infraStatusRepository'

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let val = bytes / 1024
  let i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(1)} ${units[i]}`
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '12px',
}

function connectionColor(ratio: number) {
  if (ratio >= 0.85) return '#DC2626'
  if (ratio >= 0.6) return '#F0C674'
  return '#007868'
}

export default function StatusClient({ initialStatus }: { initialStatus: InfraStatus }) {
  const [status, setStatus]   = useState(initialStatus)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt]   = useState(new Date())

  async function refresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/master/infra-status')
      const data = await res.json()
      if (data.status) {
        setStatus(data.status)
        setUpdatedAt(new Date())
      }
    } catch {
      // keep last known status on network failure
    } finally {
      setRefreshing(false)
    }
  }

  const connRatio = status.maxConnections > 0 ? status.activeConnections / status.maxConnections : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
          Atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{
            padding: '7px 14px',
            background: refreshing ? 'var(--border)' : 'var(--slate)',
            color: refreshing ? 'var(--mist)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '12px', fontWeight: '500',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {refreshing ? 'Atualizando...' : '↻ Atualizar'}
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
      }}>
        {/* Storage */}
        <div style={cardStyle}>
          <div style={labelStyle}>Uso de armazenamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtBytes(status.storageBytes)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mist)' }}>Arquivos (Storage)</div>
            </div>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtBytes(status.dbSizeBytes)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mist)' }}>Banco de dados</div>
            </div>
          </div>
        </div>

        {/* Active connections */}
        <div style={cardStyle}>
          <div style={labelStyle}>Conexões ativas no banco</div>
          <div style={{
            fontSize: '20px', fontWeight: '600', color: 'var(--slate)',
            fontVariantNumeric: 'tabular-nums', marginBottom: '10px',
          }}>
            {status.activeConnections} <span style={{ fontSize: '13px', color: 'var(--mist)', fontWeight: '400' }}>/ {status.maxConnections}</span>
          </div>
          <div style={{
            height: '6px', background: 'var(--powder)',
            borderRadius: '99px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, connRatio * 100))}%`,
              background: connectionColor(connRatio),
              borderRadius: '99px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* API status */}
        <div style={cardStyle}>
          <div style={labelStyle}>Status da API</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              width: '9px', height: '9px', borderRadius: '99px',
              background: status.apiOk ? '#007868' : '#DC2626',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--slate)' }}>
              {status.apiOk ? 'Operacional' : 'Indisponível'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
            Latência: {status.apiLatencyMs} ms
          </div>
        </div>
      </div>
    </div>
  )
}
