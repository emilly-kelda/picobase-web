'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MasterSchoolRow } from '@/repositories/schoolRepository'
import SchoolContractModal from './SchoolContractModal'
import SchoolManageModal from './SchoolManageModal'

function fmt(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtLastLogin(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// "Bloqueada" is the suspended label (ties to the Suspender/Bloquear action
// below) — past_due reads "Atrasada". Trial isn't part of the originally
// requested badge set, but hiding it would misrepresent schools that
// haven't started paying yet.
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  trial:      { bg: '#EEF3FC', color: '#1A4B8A', label: 'Trial' },
  active:     { bg: '#E0F8F5', color: '#007868', label: 'Ativa' },
  past_due:   { bg: '#FEF2F2', color: '#DC2626', label: 'Atrasada' },
  suspended:  { bg: '#F3F4F6', color: '#374151', label: 'Bloqueada' },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cartao: 'Cartão', pix: 'PIX', boleto: 'Boleto',
}

const PAYMENT_TERMS_LABEL: Record<string, string> = {
  mensal: 'Mensal', semestral: 'Semestral', anual: 'Anual',
}

const actionButtonStyle: React.CSSProperties = {
  padding: '5px 10px', borderRadius: '99px',
  background: '#fff', color: 'var(--slate)',
  border: '0.5px solid var(--border-strong)',
  fontSize: '11px', fontWeight: '500',
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
}

const softBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 10px', borderRadius: '99px',
  background: 'var(--powder-dark)', color: 'var(--slate)',
  fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap',
}

export default function SchoolsTable({
  schools,
  lastLoginByOwnerId,
}: {
  schools: MasterSchoolRow[]
  lastLoginByOwnerId: Record<string, string | null>
}) {
  const router = useRouter()
  const [editing, setEditing]     = useState<MasterSchoolRow | null>(null)
  const [managing, setManaging]   = useState<MasterSchoolRow | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [togglingId, setTogglingId]   = useState<string | null>(null)

  function onSaved() {
    setEditing(null)
    router.refresh()
  }

  async function resetPassword(school: MasterSchoolRow) {
    if (!school.ownerEmail) return
    if (!window.confirm(`Enviar email de redefinição de senha para ${school.ownerEmail}?`)) return
    setResettingId(school.id)
    try {
      const res = await fetch('/api/master/schools/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: school.ownerEmail }),
      })
      const data = await res.json()
      window.alert(data.ok ? 'Email de redefinição enviado.' : (data.error ?? 'Erro ao enviar email.'))
    } finally {
      setResettingId(null)
    }
  }

  async function toggleSuspend(school: MasterSchoolRow) {
    const nextStatus = school.status_assinatura === 'suspended' ? 'active' : 'suspended'
    const verb = nextStatus === 'suspended' ? 'bloquear' : 'reativar'
    if (!window.confirm(`Confirma ${verb} o acesso de ${school.name}?`)) return
    setTogglingId(school.id)
    try {
      const res = await fetch('/api/master/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: school.id, status_assinatura: nextStatus }),
      })
      if (res.ok) router.refresh()
    } finally {
      setTogglingId(null)
    }
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
      <style>{`.schools-row:hover > td { background: var(--powder); }`}</style>

      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--powder)' }}>
              {['Escola', 'Responsável', 'Email', 'Último login', 'Plano/Condição', 'Pagamento', 'Assinatura', 'Status', ''].map(h => (
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
              const status = STATUS_STYLE[s.status_assinatura] ?? STATUS_STYLE.trial
              const lastLogin = s.ownerId ? lastLoginByOwnerId[s.ownerId] ?? null : null
              return (
                <tr key={s.id} className="schools-row" style={{
                  borderBottom: i < schools.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      /{s.slug}{s.cost_center ? ` · ${s.cost_center}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>
                    {s.ownerName ?? '—'}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>
                    {s.ownerEmail ?? '—'}
                  </td>
                  <td style={{
                    padding: '16px 24px', fontSize: '12px', whiteSpace: 'nowrap',
                    color: lastLogin ? 'var(--slate)' : 'var(--border-strong)',
                    fontStyle: lastLogin ? 'normal' : 'italic',
                  }}>
                    {fmtLastLogin(lastLogin)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={softBadgeStyle}>
                      {s.payment_terms ? PAYMENT_TERMS_LABEL[s.payment_terms] ?? s.payment_terms : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={softBadgeStyle}>
                      {s.payment_method ? PAYMENT_METHOD_LABEL[s.payment_method] ?? s.payment_method : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmt(s.subscription_value)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '99px',
                      background: status.bg, color: status.color,
                      fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
                    }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button onClick={() => setEditing(s)} style={actionButtonStyle}>
                        Editar
                      </button>
                      <button onClick={() => setManaging(s)} style={actionButtonStyle}>
                        Gerenciar
                      </button>
                      <button
                        onClick={() => resetPassword(s)}
                        disabled={!s.ownerEmail || resettingId === s.id}
                        style={{ ...actionButtonStyle, opacity: !s.ownerEmail || resettingId === s.id ? 0.5 : 1 }}
                      >
                        {resettingId === s.id ? '...' : 'Senha'}
                      </button>
                      <button
                        onClick={() => toggleSuspend(s)}
                        disabled={togglingId === s.id}
                        style={{
                          ...actionButtonStyle,
                          color: s.status_assinatura === 'suspended' ? 'var(--slate)' : '#DC2626',
                          opacity: togglingId === s.id ? 0.5 : 1,
                        }}
                      >
                        {togglingId === s.id ? '...' : s.status_assinatura === 'suspended' ? 'Reativar' : 'Bloquear'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <SchoolContractModal
          school={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      {managing && (
        <SchoolManageModal
          school={managing}
          onClose={() => setManaging(null)}
        />
      )}
    </>
  )
}
