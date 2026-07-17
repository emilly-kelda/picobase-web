'use client'

import { useState } from 'react'
import type { OperationalCost } from '@/repositories/costRepository'

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

const COST_TYPES = [
  { value: 'fixo',     label: 'Fixo' },
  { value: 'variavel', label: 'Variável' },
]

const RECURRENCES = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual',  label: 'Anual' },
  { value: 'unico',  label: 'Evento único' },
]

export default function AddCostModal({
  editing,
  knownCategories,
  onClose,
  onSaved,
}: {
  /** null = create mode */
  editing: OperationalCost | null
  knownCategories: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [description, setDescription] = useState(editing?.description ?? '')
  const [amount, setAmount]           = useState(editing?.amount ?? 0)
  const [costType, setCostType]       = useState(editing?.cost_type ?? 'fixo')
  const [recurrence, setRecurrence]   = useState(editing?.recurrence ?? 'mensal')
  const [dueDate, setDueDate]         = useState(editing?.due_date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory]       = useState(editing?.category ?? '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const canSave = description.trim().length >= 2 && amount > 0 && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/costs', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:          editing?.id,
          description,
          amount,
          costType,
          recurrence,
          dueDate,
          category: category || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        onSaved()
      } else {
        setError(data.error ?? 'Não foi possível salvar o custo.')
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
          {editing ? 'Editar custo' : 'Novo custo'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Descrição *</label>
            <input
              style={inputStyle}
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Aluguel da sede, Honorários contador"
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Valor (R$) *</label>
            <input
              style={inputStyle}
              type="number"
              min={0} step={10}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo de custo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COST_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setCostType(t.value)}
                  style={{
                    flex: 1, padding: '9px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${costType === t.value ? 'var(--glacial)' : 'var(--border)'}`,
                    background: costType === t.value ? 'var(--glacial-light)' : '#fff',
                    color: costType === t.value ? 'var(--glacial-dark)' : 'var(--mist)',
                    fontSize: '13px',
                    fontWeight: costType === t.value ? '600' : '400',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Recorrência</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
              >
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Vencimento</label>
              <input
                style={inputStyle}
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Centro de custo / Categoria</label>
            <input
              style={inputStyle}
              type="text"
              list="cost-categories"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Administrativo, Estrutura"
            />
            <datalist id="cost-categories">
              {knownCategories.map(c => <option key={c} value={c} />)}
            </datalist>
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
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar custo'}
          </button>
        </div>
      </div>
    </div>
  )
}
