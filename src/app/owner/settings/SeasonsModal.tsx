'use client'

import { useState } from 'react'

type Season = {
  id: string
  label: string
  start_date: string
  end_date: string
  burn_rate: number
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px', color: 'var(--slate)',
  background: '#fff', outline: 'none',
  fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '6px', display: 'block',
}

export default function SeasonsModal({
  seasons: initialSeasons,
  onClose,
  onSaved,
}: {
  seasons: Season[]
  onClose: () => void
  /** Called with just the one season that was actually persisted — never
   *  the whole local list, which may include another row's unsaved draft. */
  onSaved: (season: Season) => void
}) {
  const [seasons, setSeasons] = useState(initialSeasons)
  const [saving, setSaving]   = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function saveSeason(season: Season) {
    setSaving(season.id)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       'season',
          id:         season.id,
          label:      season.label,
          start_date: season.start_date,
          end_date:   season.end_date,
          burn_rate:  season.burn_rate,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setSaved(season.id)
        setTimeout(() => setSaved(null), 2000)
        onSaved(season)
      } else {
        setError(data.error ?? 'Não foi possível salvar a temporada.')
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '20px' }}>
          Temporadas
        </div>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {seasons.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
            Nenhuma temporada cadastrada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {seasons.map((season, i) => (
              <div key={season.id} style={{
                paddingTop: i > 0 ? '20px' : 0,
                borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nome</label>
                    <input
                      style={inputStyle}
                      value={season.label}
                      onChange={e => setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, label: e.target.value } : s))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Custo operacional mensal</label>
                    <input
                      style={inputStyle}
                      type="number"
                      value={season.burn_rate}
                      onChange={e => setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, burn_rate: Number(e.target.value) } : s))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Início</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={season.start_date}
                      onChange={e => setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, start_date: e.target.value } : s))}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fim</label>
                    <input
                      style={inputStyle}
                      type="date"
                      value={season.end_date}
                      onChange={e => setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, end_date: e.target.value } : s))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => saveSeason(season)}
                    disabled={saving === season.id}
                    style={{
                      padding: '8px 16px',
                      background: saving === season.id ? 'var(--mist)' : 'var(--slate)',
                      color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                      fontSize: '12px', fontWeight: '500',
                      cursor: saving === season.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      opacity: saving === season.id ? 0.7 : 1,
                    }}
                  >
                    {saving === season.id ? 'Salvando...' : 'Salvar temporada'}
                  </button>
                  {saved === season.id && (
                    <span style={{ fontSize: '12px', color: 'var(--glacial-dark)' }}>Salvo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
