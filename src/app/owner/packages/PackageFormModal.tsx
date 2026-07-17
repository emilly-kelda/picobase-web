'use client'

import { useState } from 'react'

export type PackageType = {
  id: string
  name: string
  sport: string | null
  totalMinutes: number
  price: number
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  color: 'var(--slate)',
  background: '#fff',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--mist)',
  display: 'block',
  marginBottom: '6px',
}

function fmtH(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

export default function PackageFormModal({
  editing,
  knownSports,
  onClose,
  onSaved,
}: {
  /** null = create mode */
  editing: PackageType | null
  /** distinct sport values already in use, for the <datalist> suggestions —
   *  packages.sport is free text, not a foreign key, so this is a hint, not
   *  a hard constraint. */
  knownSports: string[]
  onClose: () => void
  onSaved: () => void
}) {
  // total_minutes is stored as a single number on packages, but owners think
  // in "N aulas de M minutos" — split into two dynamic number inputs (no
  // fixed <select>, per school rules varying) and derive total_minutes from
  // their product rather than asking for it directly.
  const initialSessions = editing && editing.totalMinutes > 0
    ? Math.round(editing.totalMinutes / 60) || 1
    : 10
  const initialSessionMinutes = editing && initialSessions > 0
    ? Math.round(editing.totalMinutes / initialSessions)
    : 60

  const [name, setName]                   = useState(editing?.name ?? '')
  const [sport, setSport]                 = useState(editing?.sport ?? '')
  const [sessionCount, setSessionCount]   = useState(initialSessions)
  const [sessionMinutes, setSessionMinutes] = useState(initialSessionMinutes)
  const [price, setPrice]                 = useState(editing?.price ?? 0)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const totalMinutes = Math.max(0, sessionCount) * Math.max(0, sessionMinutes)

  const canSave = name.trim().length >= 2
    && sessionCount > 0 && sessionMinutes > 0
    && price >= 0
    && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/packages', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:            editing?.id,
          name,
          sport:         sport || null,
          total_minutes: totalMinutes,
          base_price:    price,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved()
      } else {
        setError(data.error ?? 'Não foi possível salvar o pacote.')
        setSaving(false)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '440px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '20px' }}>
          {editing ? 'Editar pacote' : 'Novo pacote'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome do pacote *</label>
            <input
              style={inputStyle}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Kitesurf 10h"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Esporte</label>
            <input
              style={inputStyle}
              type="text"
              list="package-sports"
              value={sport}
              onChange={e => setSport(e.target.value)}
              placeholder="Ex: Kitesurf"
            />
            <datalist id="package-sports">
              {knownSports.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nº de aulas</label>
              <input
                style={inputStyle}
                type="number"
                min={1} step={1}
                value={sessionCount}
                onChange={e => setSessionCount(Number(e.target.value))}
              />
            </div>
            <div>
              <label style={labelStyle}>Min. por aula</label>
              <input
                style={inputStyle}
                type="number"
                min={1} step={5}
                value={sessionMinutes}
                onChange={e => setSessionMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{
            padding: '8px 12px', background: 'var(--powder)',
            borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--mist)',
          }}>
            Total: <strong style={{ color: 'var(--slate)' }}>{fmtH(totalMinutes)}</strong>
          </div>

          <div>
            <label style={labelStyle}>Preço (R$) *</label>
            <input
              style={inputStyle}
              type="number"
              min={0} step={10}
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
            />
            {editing && (
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '6px' }}>
                Preços em EUR/USD podem ser editados direto no card, após salvar.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px',
              background: '#fff', color: 'var(--mist)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px',
              background: canSave ? 'var(--slate)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--mist)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar pacote'}
          </button>
        </div>
      </div>
    </div>
  )
}
