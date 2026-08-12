'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/repositories/schoolRepository'
import PlanFormModal from './PlanFormModal'

function fmtCents(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cents / 100)
}

const FEATURE_LABELS: Record<string, string> = {
  certificates:  'Certificados',
  reports:       'Relatórios avançados',
  multi_sport:   'Múltiplos esportes',
  api_access:    'Acesso à API',
}

export default function PlansOverview({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Plan | 'new' | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function onSaved() {
    setEditing(null)
    router.refresh()
  }

  async function quickDelete(e: React.MouseEvent, plan: Plan) {
    e.stopPropagation()
    if (!window.confirm(`Excluir o plano "${plan.name}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(plan.id)
    try {
      const res = await fetch(`/api/master/plans?id=${plan.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        window.alert(data.error ?? 'Erro ao excluir plano.')
        return
      }
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button
          onClick={() => setEditing('new')}
          style={{
            padding: '9px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--slate)', color: '#fff', border: 'none',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          + Novo Plano
        </button>
      </div>

      {plans.length === 0 ? (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
          padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
        }}>
          Nenhum plano cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {plans.map(plan => {
            const activeFeatures = Object.entries(plan.features ?? {}).filter(([, v]) => v)
            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(plan)}
                onKeyDown={e => { if (e.key === 'Enter') setEditing(plan) }}
                style={{
                  position: 'relative',
                  textAlign: 'left', cursor: 'pointer',
                  background: '#fff',
                  border: `0.5px solid ${plan.is_active ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
                  padding: '18px 20px', opacity: plan.is_active ? 1 : 0.55,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <button
                  type="button"
                  onClick={e => quickDelete(e, plan)}
                  disabled={deletingId === plan.id}
                  title="Excluir plano"
                  aria-label={`Excluir plano ${plan.name}`}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '24px', height: '24px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: '99px', border: 'none', background: 'transparent',
                    color: 'var(--mist)', cursor: deletingId === plan.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === plan.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--signal-light)'; e.currentTarget.style.color = '#DC2626' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--mist)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', paddingRight: '20px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)' }}>
                    {plan.name}
                  </div>
                  {!plan.is_active && (
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px',
                      borderRadius: '99px', background: 'var(--powder-dark)', color: 'var(--mist)',
                    }}>
                      Inativo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--slate)', marginBottom: '2px' }}>
                  {fmtCents(plan.price_monthly_cents)}
                  <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--mist)' }}>/mês</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '14px' }}>
                  {fmtCents(plan.price_yearly_cents)}/ano
                </div>

                <div style={{ fontSize: '12px', color: 'var(--slate)', marginBottom: '4px' }}>
                  {plan.max_students === null ? 'Alunos ilimitados' : `Até ${plan.max_students} alunos`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate)', marginBottom: activeFeatures.length > 0 ? '10px' : 0 }}>
                  {plan.max_storage_gb === null ? 'Armazenamento ilimitado' : `${plan.max_storage_gb} GB de armazenamento`}
                </div>

                {activeFeatures.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {activeFeatures.map(([key]) => (
                      <span key={key} style={{
                        fontSize: '10px', fontWeight: '500', padding: '2px 8px',
                        borderRadius: '99px', background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
                      }}>
                        {FEATURE_LABELS[key] ?? key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <PlanFormModal
          plan={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
