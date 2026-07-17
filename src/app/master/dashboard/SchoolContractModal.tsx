'use client'

import { useState } from 'react'
import type { MasterSchoolRow } from '@/repositories/schoolRepository'
import { CONTRACT_STATUSES, PAYMENT_METHODS, PAYMENT_TERMS } from '@/lib/schoolContract'

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

export default function SchoolContractModal({
  school,
  onClose,
  onSaved,
}: {
  school: MasterSchoolRow
  onClose: () => void
  onSaved: () => void
}) {
  const [status, setStatus]                     = useState(school.status_assinatura)
  const [paymentMethod, setPaymentMethod]        = useState(school.payment_method ?? '')
  const [paymentTerms, setPaymentTerms]          = useState(school.payment_terms ?? '')
  const [subscriptionValue, setSubscriptionValue] = useState(
    school.subscription_value != null ? String(school.subscription_value) : ''
  )
  const [costCenter, setCostCenter]              = useState(school.cost_center ?? '')
  const [saving, setSaving]                      = useState(false)
  const [error, setError]                        = useState<string | null>(null)

  const canSave = !!status && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/master/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:                  school.id,
          status_assinatura:   status,
          payment_method:      paymentMethod || null,
          payment_terms:       paymentTerms || null,
          subscription_value:  subscriptionValue ? Number(subscriptionValue) : null,
          cost_center:         costCenter || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved()
      } else {
        setError(data.error ?? 'Não foi possível salvar o contrato.')
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
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Gerenciar contrato
        </div>
        <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '20px' }}>
          {school.name}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Status *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {CONTRACT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Método de pagamento</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="">Selecione...</option>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Condição</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
              >
                <option value="">Selecione...</option>
                {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Valor da assinatura (R$)</label>
            <input
              style={inputStyle}
              type="number"
              min={0} step={10}
              value={subscriptionValue}
              onChange={e => setSubscriptionValue(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Centro de custo</label>
            <input
              style={inputStyle}
              type="text"
              value={costCenter}
              onChange={e => setCostCenter(e.target.value)}
            />
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
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
