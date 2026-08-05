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

  function onSaved() {
    setEditing(null)
    router.refresh()
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
              <button
                key={plan.id}
                onClick={() => setEditing(plan)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  background: '#fff',
                  border: `0.5px solid ${plan.is_active ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
                  padding: '18px 20px', opacity: plan.is_active ? 1 : 0.55,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
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
              </button>
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
