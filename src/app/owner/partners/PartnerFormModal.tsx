'use client'

import { useState } from 'react'
import type { Partner } from '@/repositories/partnerRepository'
import SearchableSelect from '@/components/SearchableSelect'

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

const TYPE_SUGGESTIONS = ['hotel', 'agencia', 'operador', 'pousada', 'influencer']

export default function PartnerFormModal({
  editing,
  onClose,
  onSaved,
}: {
  /** null = create mode */
  editing: Partner | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]                 = useState(editing?.name ?? '')
  const [type, setType]                 = useState(editing?.type ?? '')
  const [commissionPct, setCommissionPct] = useState(editing ? Math.round((editing.commission_pct ?? 0) * 100) : 15)
  const [discountPct, setDiscountPct]   = useState(editing?.discount_pct ? Math.round(editing.discount_pct * 100) : 0)
  const [financeEmail, setFinanceEmail] = useState(editing?.finance_email ?? '')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const canSave = name.trim().length >= 2 && commissionPct >= 0 && commissionPct <= 100 && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/partners', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:            editing?.id,
          name,
          type:          type || null,
          commissionPct: commissionPct / 100,
          discountPct:   discountPct > 0 ? discountPct / 100 : null,
          financeEmail:  financeEmail || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved()
      } else {
        setError(data.error ?? 'Não foi possível salvar o parceiro.')
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
          {editing ? 'Editar parceiro' : 'Novo parceiro'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input
              style={inputStyle}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Hotel Caravela"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo</label>
            <SearchableSelect
              value={type}
              onChange={setType}
              options={TYPE_SUGGESTIONS}
              placeholder="Ex: hotel"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Comissão (%)</label>
              <input
                style={inputStyle}
                type="number"
                min={0} max={100} step={1}
                value={commissionPct}
                onChange={e => setCommissionPct(Number(e.target.value))}
              />
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                Pago pela escola ao parceiro
              </div>
            </div>
            <div>
              <label style={labelStyle}>Desconto cliente (%)</label>
              <input
                style={inputStyle}
                type="number"
                min={0} max={100} step={1}
                value={discountPct}
                onChange={e => setDiscountPct(Number(e.target.value))}
              />
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
                Mostrado a quem vem pelo link
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email financeiro</label>
            <input
              style={inputStyle}
              type="email"
              value={financeEmail}
              onChange={e => setFinanceEmail(e.target.value)}
              placeholder="financeiro@parceiro.com"
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
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar parceiro'}
          </button>
        </div>
      </div>
    </div>
  )
}
