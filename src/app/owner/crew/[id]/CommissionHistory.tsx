'use client'

import { useEffect, useState } from 'react'

type HistoryRow = {
  id: string
  changed_at: string
  old_mode: string | null
  old_pct: number | null
  old_hourly: number | null
  new_mode: string | null
  new_pct: number | null
  new_hourly: number | null
}

function formatRate(mode: string | null, pct: number | null, hourly: number | null) {
  if (mode === 'fixed_per_hour' && hourly) return `R$ ${hourly}/h`
  if (pct) return `${Math.round(pct * 100)}%`
  return '—'
}

export default function CommissionHistory({
  instructorId,
}: {
  instructorId: string
}) {
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [open, setOpen]       = useState(false)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    fetch(`/api/owner/crew/commission-history?instructor_id=${instructorId}`)
      .then(r => r.json())
      .then(d => { setHistory(d.history ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [open, loaded, instructorId])

  return (
    <div style={{ marginTop: '16px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none',
          cursor: 'pointer', padding: '0',
          fontSize: '12px', color: 'var(--mist)',
          textDecoration: 'underline dotted',
          textUnderlineOffset: '3px',
          fontFamily: 'inherit',
          marginBottom: open ? '12px' : '0',
          display: 'block',
        }}
      >
        {open ? '▲ Fechar histórico' : '▼ Ver histórico de comissão'}
      </button>

      {open && (
        <div style={{
          background: 'var(--powder)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '0.5px solid var(--border)',
        }}>
          {!loaded ? (
            <div style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--mist)' }}>
              Carregando...
            </div>
          ) : history.length === 0 ? (
            <div style={{
              padding: '16px 20px',
              fontSize: '12px', color: 'var(--mist)',
            }}>
              Nenhuma alteração registrada ainda.
            </div>
          ) : (
            <>
              {/* Header note */}
              <div style={{
                padding: '10px 16px',
                background: '#E0F8F5',
                borderBottom: '0.5px solid var(--border)',
                fontSize: '11px',
                color: 'var(--glacial-dark)',
              }}>
                Aulas já confirmadas mantêm a comissão do momento da confirmação.
              </div>

              {history.map((h, i) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < history.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                    background: '#fff',
                  }}
                >
                  {/* Arrow */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', flex: 1,
                    fontSize: '13px',
                  }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '99px',
                      background: 'var(--powder)',
                      color: 'var(--mist)',
                      fontWeight: '500',
                      textDecoration: 'line-through',
                    }}>
                      {formatRate(h.old_mode, h.old_pct, h.old_hourly)}
                    </span>
                    <span style={{ color: 'var(--mist)' }}>→</span>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '99px',
                      background: 'var(--glacial-light, #E0F8F5)',
                      color: 'var(--glacial-dark)',
                      fontWeight: '600',
                    }}>
                      {formatRate(h.new_mode, h.new_pct, h.new_hourly)}
                    </span>
                  </div>

                  {/* Date */}
                  <div style={{
                    fontSize: '11px', color: 'var(--mist)',
                    flexShrink: 0, textAlign: 'right',
                  }}>
                    {new Date(h.changed_at).toLocaleDateString(
                      'pt-BR',
                      { day: '2-digit', month: 'short', year: 'numeric' }
                    )}
                    <br />
                    {new Date(h.changed_at).toLocaleTimeString(
                      'pt-BR',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
