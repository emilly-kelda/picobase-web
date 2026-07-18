'use client'

import { useState } from 'react'
import BurnRateCalculator from '@/components/BurnRateCalculator'

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

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
  }).format(n)
}

export default function FinancialSettingsModal({
  burnRate,
  onClose,
  onSaved,
}: {
  burnRate: number | null
  onClose: () => void
  onSaved: (burnRate: number) => void
}) {
  const [value, setValue] = useState(burnRate ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', burn_rate: value }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved(value)
      } else {
        setError(data.error ?? 'Não foi possível salvar.')
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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '20px' }}>
          Financeiro
        </div>

        <label style={labelStyle}>
          Custo operacional mensal
          <span style={{ marginLeft: '6px', color: 'var(--glacial)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
            {value ? fmt(value) : '—'}
          </span>
        </label>
        <input
          style={inputStyle}
          type="number"
          value={value}
          placeholder="5000"
          onChange={e => setValue(Number(e.target.value))}
        />
        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px', marginBottom: '4px' }}>
          Custos fixos mensais na baixa temporada. Usado para calcular a Reserva de Baixa Temporada.
        </div>

        <BurnRateCalculator
          onApply={total => setValue(total)}
        />

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'var(--signal-light)', color: 'var(--signal-dark)',
            borderRadius: 'var(--radius-md)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
            disabled={saving}
            style={{
              flex: 2, padding: '11px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
