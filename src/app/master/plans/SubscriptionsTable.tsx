'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan, SchoolWithPlan } from '@/repositories/schoolRepository'
import AssignSubscriptionModal from './AssignSubscriptionModal'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  trialing:  { bg: '#EEF3FC', color: '#1A4B8A', label: 'Trial' },
  active:    { bg: '#E0F8F5', color: '#007868', label: 'Ativa' },
  past_due:  { bg: '#FEF2F2', color: '#DC2626', label: 'Atrasada' },
  canceled:  { bg: '#F3F4F6', color: '#374151', label: 'Cancelada' },
  paused:    { bg: '#FFF7ED', color: '#C2410C', label: 'Pausada' },
}

const actionButtonStyle: React.CSSProperties = {
  padding: '5px 10px', borderRadius: '99px',
  background: '#fff', color: 'var(--slate)',
  border: '0.5px solid var(--border-strong)',
  fontSize: '11px', fontWeight: '500',
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SubscriptionsTable({ schools, plans }: { schools: SchoolWithPlan[]; plans: Plan[] }) {
  const router = useRouter()
  const [assigning, setAssigning] = useState<SchoolWithPlan | null>(null)

  function onAssigned() {
    setAssigning(null)
    router.refresh()
  }

  if (schools.length === 0) {
    return (
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)',
      }}>
        Nenhuma escola cadastrada ainda.
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--powder)' }}>
              {['Escola', 'Plano', 'Status', 'Fim do período', ''].map(h => (
                <th key={h} style={{
                  padding: '11px 24px', textAlign: 'left',
                  fontSize: '10px', fontWeight: '600',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map((s, i) => {
              const status = s.subscription_status ? STATUS_STYLE[s.subscription_status] : null
              return (
                <tr key={s.id} style={{
                  borderBottom: i < schools.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                    {s.plan_name ?? <span style={{ color: 'var(--mist)' }}>Sem plano</span>}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {status ? (
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px',
                        background: status.bg, color: status.color,
                        fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
                      }}>
                        {status.label}
                        {s.cancel_at_period_end && ' · Cancela ao fim'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--mist)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {fmtDate(s.current_period_end)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => setAssigning(s)} style={actionButtonStyle}>
                      Reatribuir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {assigning && (
        <AssignSubscriptionModal
          school={assigning}
          plans={plans}
          onClose={() => setAssigning(null)}
          onSaved={onAssigned}
        />
      )}
    </>
  )
}
