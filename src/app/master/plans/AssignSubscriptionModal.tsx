'use client'

import { useState } from 'react'
import type { Plan, SchoolWithPlan } from '@/repositories/schoolRepository'

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)', display: 'block', marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px', color: 'var(--slate)',
  background: '#fff', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'trialing', label: 'Trial' },
  { value: 'active',   label: 'Ativa' },
  { value: 'past_due', label: 'Atrasada' },
  { value: 'canceled', label: 'Cancelada' },
  { value: 'paused',   label: 'Pausada' },
]

export default function AssignSubscriptionModal({
  school, plans, onClose, onSaved,
}: {
  school: SchoolWithPlan
  plans: Plan[]
  onClose: () => void
  onSaved: () => void
}) {
  const [planId, setPlanId]     = useState(school.plan_id ?? '')
  const [status, setStatus]     = useState(school.subscription_status ?? '')
  const [periodEnd, setPeriodEnd] = useState(school.current_period_end?.slice(0, 10) ?? '')
  const [cancelAtEnd, setCancelAtEnd] = useState(school.cancel_at_period_end)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/master/subscriptions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: school.id,
          plan_id: planId || null,
          subscription_status: status || null,
          current_period_end: periodEnd ? `${periodEnd}T23:59:59-03:00` : null,
          cancel_at_period_end: cancelAtEnd,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Erro ao atualizar assinatura.')
        setSaving(false)
        return
      }
      onSaved()
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
        zIndex: 250, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '440px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Reatribuir assinatura
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '18px' }}>
          {school.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Plano</label>
            <select style={inputStyle} value={planId} onChange={e => setPlanId(e.target.value)}>
              <option value="">Sem plano</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}{!p.is_active ? ' (inativo)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status da assinatura</label>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Sem status</option>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Fim do período atual</label>
            <input style={{ ...inputStyle, cursor: 'text' }} type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--slate)', cursor: 'pointer' }}>
            <input type="checkbox" checked={cancelAtEnd} onChange={e => setCancelAtEnd(e.target.checked)} style={{ accentColor: 'var(--glacial)', width: '14px', height: '14px' }} />
            Cancelar ao fim do período
          </label>
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

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
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
              background: saving ? 'var(--border)' : 'var(--slate)',
              color: saving ? 'var(--mist)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar assinatura'}
          </button>
        </div>
      </div>
    </div>
  )
}
