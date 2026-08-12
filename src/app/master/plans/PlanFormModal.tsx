'use client'

import { useState } from 'react'
import type { Plan } from '@/repositories/schoolRepository'

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
  outline: 'none', boxSizing: 'border-box',
}

const FEATURE_OPTIONS: { key: string; label: string }[] = [
  { key: 'certificates', label: 'Certificados' },
  { key: 'reports',      label: 'Relatórios avançados' },
  { key: 'multi_sport',  label: 'Múltiplos esportes' },
  { key: 'api_access',   label: 'Acesso à API' },
]

function centsToReais(cents: number) {
  return cents ? String(cents / 100) : ''
}

export default function PlanFormModal({
  plan, onClose, onSaved,
}: {
  plan: Plan | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName]           = useState(plan?.name ?? '')
  const [slug, setSlug]           = useState(plan?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!plan)
  const [priceMonthly, setPriceMonthly] = useState(centsToReais(plan?.price_monthly_cents ?? 0))
  const [priceYearly, setPriceYearly]   = useState(centsToReais(plan?.price_yearly_cents ?? 0))
  const [maxStudents, setMaxStudents]   = useState(plan?.max_students != null ? String(plan.max_students) : '')
  const [maxStorage, setMaxStorage]     = useState(plan?.max_storage_gb != null ? String(plan.max_storage_gb) : '')
  const [features, setFeatures]         = useState<Record<string, boolean>>(plan?.features ?? {})
  const [isActive, setIsActive]         = useState(plan?.is_active ?? true)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [error, setError]               = useState<string | null>(null)

  function onNameChange(val: string) {
    setName(val)
    if (!slugTouched) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function toggleFeature(key: string) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function save() {
    if (!name.trim() || !slug.trim()) {
      setError('Nome e slug são obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/master/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan?.id,
          name: name.trim(),
          slug: slug.trim(),
          price_monthly_cents: Math.round(Number(priceMonthly || 0) * 100),
          price_yearly_cents:  Math.round(Number(priceYearly || 0) * 100),
          max_students:   maxStudents === '' ? null : Number(maxStudents),
          max_storage_gb: maxStorage === '' ? null : Number(maxStorage),
          features,
          is_active: isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Erro ao salvar plano.')
        setSaving(false)
        return
      }
      onSaved()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setSaving(false)
    }
  }

  async function deletePlan() {
    if (!plan) return
    if (!window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/master/plans?id=${plan.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Erro ao excluir plano.')
        setDeleting(false)
        return
      }
      onSaved()
    } catch {
      setError('Erro de rede. Tente novamente.')
      setDeleting(false)
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
        width: '100%', maxWidth: '480px',
        padding: '28px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--slate)', marginBottom: '18px' }}>
          {plan ? 'Editar plano' : 'Novo plano'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input style={inputStyle} value={name} onChange={e => onNameChange(e.target.value)} placeholder="Ex: Pro" autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Slug *</label>
            <input
              style={inputStyle}
              value={slug}
              onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')) }}
              placeholder="pro"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Preço mensal (R$)</label>
              <input style={inputStyle} type="number" min={0} step={1} value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Preço anual (R$)</label>
              <input style={inputStyle} type="number" min={0} step={1} value={priceYearly} onChange={e => setPriceYearly(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Máx. de alunos</label>
              <input style={inputStyle} type="number" min={0} value={maxStudents} onChange={e => setMaxStudents(e.target.value)} placeholder="Ilimitado" />
            </div>
            <div>
              <label style={labelStyle}>Armazenamento (GB)</label>
              <input style={inputStyle} type="number" min={0} value={maxStorage} onChange={e => setMaxStorage(e.target.value)} placeholder="Ilimitado" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Recursos incluídos</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FEATURE_OPTIONS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--slate)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!features[f.key]} onChange={() => toggleFeature(f.key)} style={{ accentColor: 'var(--glacial)', width: '14px', height: '14px' }} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--slate)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: 'var(--glacial)', width: '14px', height: '14px' }} />
            Plano ativo (disponível para atribuição)
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

        {plan && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '22px' }}>
            <button
              type="button"
              onClick={deletePlan}
              disabled={saving || deleting}
              style={{
                padding: '8px 4px',
                background: 'none', color: '#DC2626',
                border: 'none',
                fontSize: '13px', fontWeight: '500',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.5 : 1,
                fontFamily: 'var(--font-sans)', textDecoration: 'underline',
              }}
            >
              {deleting ? 'Excluindo...' : 'Excluir plano'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: plan ? '10px' : '22px' }}>
          <button
            onClick={onClose}
            disabled={saving || deleting}
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
            disabled={saving || deleting}
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
            {saving ? 'Salvando...' : 'Salvar plano'}
          </button>
        </div>
      </div>
    </div>
  )
}
