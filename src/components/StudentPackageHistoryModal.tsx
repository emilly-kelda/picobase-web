'use client'

import { useEffect, useState } from 'react'

type HistorySession = {
  id: string
  session_date: string
  duration_min: number
  activities: { name: string } | null
  users: { name: string } | null
}

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export default function StudentPackageHistoryModal({
  studentName,
  packageSaleId,
  onClose,
}: {
  studentName: string
  packageSaleId: string
  onClose: () => void
}) {
  const [sessions, setSessions] = useState<HistorySession[] | null>(null)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/owner/package-history/${packageSaleId}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (data.ok) setSessions(data.sessions)
        else setError(data.error ?? 'Erro ao carregar histórico.')
      })
      .catch(() => { if (!cancelled) setError('Erro de rede ao carregar histórico.') })
    return () => { cancelled = true }
  }, [packageSaleId])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--slate)' }}>
            Histórico do Pacote — {studentName}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '18px', color: 'var(--mist)', padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {error ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--signal)' }}>
              {error}
            </div>
          ) : sessions === null ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Carregando...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Nenhuma aula registrada neste pacote ainda.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  {['Data', 'Atividade', 'Instrutor', 'Duração'].map(h => (
                    <th key={h} style={{
                      padding: '10px 24px', textAlign: 'left',
                      fontSize: '10px', fontWeight: '600',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} style={{
                    borderBottom: i < sessions.length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                      {fmtDate(s.session_date)}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                      {s.activities?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)' }}>
                      {s.users?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 24px', fontSize: '13px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                      {fmtDuration(s.duration_min)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
