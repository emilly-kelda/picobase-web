'use client'

import { useEffect, useRef, useState } from 'react'
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

// Caps how wide a school name/owner/email can push the column before
// eliding — a handful of long values used to be exactly what forced the
// whole table into horizontal scroll on ordinary desktop widths.
const truncateStyle: React.CSSProperties = {
  maxWidth: '200px', overflow: 'hidden',
  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '8px 14px', background: 'none', border: 'none',
  fontSize: '12px', color: 'var(--slate)', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
}

/** Compact row actions — a primary "Acessar" button plus a "⋯" trigger for
 *  everything else (Editar/Gerenciar/Redefinir senha/Bloquear). Replaces
 *  what used to be five buttons in a wrapping flex row, which pushed each
 *  row to 2-3 lines tall and widened the actions column enough to force
 *  horizontal scroll on the whole table. */
function ActionsMenu({
  school, accessing, resetting, toggling,
  onAccess, onEdit, onManage, onResetPassword, onToggleSuspend,
}: {
  school: MasterSchoolRow
  accessing: boolean
  resetting: boolean
  toggling: boolean
  onAccess: () => void
  onEdit: () => void
  onManage: () => void
  onResetPassword: () => void
  onToggleSuspend: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
      <button
        onClick={onAccess}
        disabled={accessing}
        style={{ ...actionButtonStyle, opacity: accessing ? 0.5 : 1 }}
      >
        {accessing ? '...' : 'Acessar'}
      </button>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Mais ações"
        style={{
          width: '26px', height: '26px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '99px', background: open ? 'var(--powder)' : '#fff',
          border: '0.5px solid var(--border-strong)', cursor: 'pointer', padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.6" fill="var(--slate)" />
          <circle cx="12" cy="12" r="1.6" fill="var(--slate)" />
          <circle cx="19" cy="12" r="1.6" fill="var(--slate)" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20,
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '170px', overflow: 'hidden', padding: '4px 0',
        }}>
          <button onClick={() => { setOpen(false); onEdit() }} style={menuItemStyle}>
            Editar
          </button>
          <button onClick={() => { setOpen(false); onManage() }} style={menuItemStyle}>
            Gerenciar
          </button>
          <button
            onClick={() => { setOpen(false); onResetPassword() }}
            disabled={!school.ownerEmail || resetting}
            style={{ ...menuItemStyle, opacity: !school.ownerEmail || resetting ? 0.5 : 1, cursor: !school.ownerEmail || resetting ? 'not-allowed' : 'pointer' }}
          >
            {resetting ? 'Enviando...' : 'Redefinir senha'}
          </button>
          <button
            onClick={() => { setOpen(false); onToggleSuspend() }}
            disabled={toggling}
            style={{
              ...menuItemStyle,
              color: school.status_assinatura === 'suspended' ? 'var(--slate)' : '#DC2626',
              opacity: toggling ? 0.5 : 1, cursor: toggling ? 'not-allowed' : 'pointer',
            }}
          >
            {toggling ? '...' : school.status_assinatura === 'suspended' ? 'Reativar' : 'Bloquear'}
          </button>
        </div>
      )}
    </div>
  )
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
  const [accessingId, setAccessingId] = useState<string | null>(null)

  function onSaved() {
    setEditing(null)
    router.refresh()
  }

  async function accessPanel(school: MasterSchoolRow) {
    setAccessingId(school.id)
    try {
      const res = await fetch('/api/master/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: school.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        window.alert(data.error ?? 'Não foi possível acessar o painel desta escola.')
        setAccessingId(null)
        return
      }
      window.location.assign('/owner')
    } catch {
      window.alert('Erro de rede. Tente novamente.')
      setAccessingId(null)
    }
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
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--slate)', ...truncateStyle }} title={s.name}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)', ...truncateStyle }}>
                      /{s.slug}{s.cost_center ? ` · ${s.cost_center}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--slate)', ...truncateStyle }} title={s.ownerName ?? undefined}>
                    {s.ownerName ?? '—'}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--mist)', ...truncateStyle }} title={s.ownerEmail ?? undefined}>
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
                    <ActionsMenu
                      school={s}
                      accessing={accessingId === s.id}
                      resetting={resettingId === s.id}
                      toggling={togglingId === s.id}
                      onAccess={() => accessPanel(s)}
                      onEdit={() => setEditing(s)}
                      onManage={() => setManaging(s)}
                      onResetPassword={() => resetPassword(s)}
                      onToggleSuspend={() => toggleSuspend(s)}
                    />
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
