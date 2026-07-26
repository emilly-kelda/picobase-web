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

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function FinancialSettingsModal({
  burnRate,
  reserveTargetMonths,
  highSeasonStartMonth,
  highSeasonEndMonth,
  onClose,
  onSaved,
}: {
  burnRate: number | null
  reserveTargetMonths: number | null
  highSeasonStartMonth: number | null
  highSeasonEndMonth: number | null
  onClose: () => void
  onSaved: (patch: {
    burn_rate: number
    reserve_target_months: number
    high_season_start_month: number | null
    high_season_end_month: number | null
  }) => void
}) {
  const [value, setValue] = useState(burnRate ?? 0)
  const [targetMonths, setTargetMonths] = useState(reserveTargetMonths ?? 6)
  const [highStart, setHighStart] = useState(highSeasonStartMonth ?? '')
  const [highEnd, setHighEnd]     = useState(highSeasonEndMonth ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    const patch = {
      burn_rate:                value,
      reserve_target_months:    targetMonths > 0 ? targetMonths : 6,
      high_season_start_month:  highStart === '' ? null : Number(highStart),
      high_season_end_month:    highEnd === '' ? null : Number(highEnd),
    }
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school', ...patch }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved(patch)
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

        <div style={{ height: '0.5px', background: 'var(--border)', margin: '20px 0' }} />

        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)', marginBottom: '14px' }}>
          Metas Financeiras &amp; Sazonalidade
        </div>

        <label style={labelStyle} title="Quantos meses de custo operacional a escola quer ter guardados como reserva de baixa temporada. Usado no cálculo do Off-Season Runway (Custos).">
          Meta de Reserva de Caixa (Meses)
        </label>
        <input
          style={inputStyle}
          type="number"
          min={1}
          value={targetMonths}
          placeholder="6"
          onChange={e => setTargetMonths(Number(e.target.value))}
        />
        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px', marginBottom: '16px' }}>
          Quantos meses de custo operacional a reserva deve cobrir — substitui os "6 meses" fixos do cálculo de runway.
        </div>

        <label style={labelStyle}>Alta Temporada (meses de vento forte)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={highStart}
            onChange={e => setHighStart(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Início...</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={highEnd}
            onChange={e => setHighEnd(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Fim...</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
          Opcional — usado para projeções de sazonalidade futuras.
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
