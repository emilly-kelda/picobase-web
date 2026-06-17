'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Payment = {
  id: string
  period: string
  sessions_count: number
  revenue_generated: number
  commission_pct: number
  commission_amount: number
  bonus: number
  total_to_pay: number
  status: string
  approved_at: string | null
  paid_at: string | null
  users: {
    id: string
    name: string
    email: string | null
    whatsapp: string | null
    pix_key: string | null
    wise_email: string | null
    commission_pct: number | null
  } | null
}

type PartnerRow = {
  partner: {
    id: string
    name: string
    pix_key: string | null
    wise_email: string | null
    finance_email: string | null
    type: string | null
    commission_pct: number | null
  }
  sessions: number
  revenue: number
  commission: number
  status: string
  referral_ids: string[]
}

type Summary = {
  totalPending: number
  totalApproved: number
  totalPaid: number
  total: number
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—'
  return `${Math.round(n * 100)}%`
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: 'Pendente',  bg: '#FFF8E8', color: '#8A5E00' },
  approved: { label: 'Aprovado',  bg: '#E0F8F5', color: '#007868' },
  paid:     { label: 'Pago',      bg: '#E8F5E9', color: '#2E7D32' },
}

export default function PaymentsClient({
  payments: initialPayments,
  period,
  summary: initialSummary,
  monthOptions,
  partnerCommissions,
}: {
  payments: Payment[]
  period: string
  summary: Summary
  monthOptions: { value: string; label: string }[]
  partnerCommissions: PartnerRow[]
}) {
  const router  = useRouter()
  const [payments,    setPayments]    = useState(initialPayments)
  const [summary,     setSummary]     = useState(initialSummary)
  const [partnerData, setPartnerData] = useState(partnerCommissions)
  const [loading,     setLoading]     = useState<string | null>(null)
  const [closing,     setClosing]     = useState(false)
  const [message,     setMessage]     = useState<string | null>(null)
  const [breakdown,   setBreakdown]   = useState<any[]>([])
  const [breakdownFor, setBreakdownFor] = useState<string | null>(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const pending = payments.filter(p => p.status === 'pending')

  const partnerTotalPending  = partnerData.filter(p => p.status === 'pending').reduce((s, p) => s + p.commission, 0)
  const partnerTotalApproved = partnerData.filter(p => p.status === 'approved').reduce((s, p) => s + p.commission, 0)
  const partnerTotalPaid     = partnerData.filter(p => p.status === 'paid').reduce((s, p) => s + p.commission, 0)

  async function closeMonth() {
    setClosing(true)
    setMessage(null)
    const res  = await fetch('/api/owner/close-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    const data = await res.json()
    setMessage(data.ok
      ? `✓ ${data.created} registro${data.created !== 1 ? 's' : ''} criado${data.created !== 1 ? 's' : ''}`
      : `Erro: ${data.error}`
    )
    setClosing(false)
    router.refresh()
  }

  async function updateStatus(id: string, newStatus: string) {
    setLoading(id)
    const update: any = { status: newStatus }
    if (newStatus === 'approved') update.approved_at = new Date().toISOString()
    if (newStatus === 'paid')     update.paid_at     = new Date().toISOString()

    await fetch('/api/owner/close-month', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: id, action: 'update_status', ...update }),
    })

    const updated = payments.map(p => p.id === id ? { ...p, ...update } : p)
    setPayments(updated)
    setSummary({
      totalPending:  updated.filter(p => p.status === 'pending').reduce((s, p) => s + p.total_to_pay, 0),
      totalApproved: updated.filter(p => p.status === 'approved').reduce((s, p) => s + p.total_to_pay, 0),
      totalPaid:     updated.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_to_pay, 0),
      total:         summary.total,
    })
    setLoading(null)
  }

  async function approvePartner(referralIds: string[], markAsPaid = false) {
    setLoading(referralIds[0])
    await fetch('/api/owner/partner-commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_ids: referralIds, mark_as_paid: markAsPaid }),
    })
    setPartnerData(prev => prev.map(p =>
      p.referral_ids.some(id => referralIds.includes(id))
        ? { ...p, status: markAsPaid ? 'paid' : 'approved' }
        : p
    ))
    setLoading(null)
  }

  async function fetchBreakdown(instructorId: string) {
    setBreakdownFor(instructorId)
    setLoadingBreakdown(true)
    const res  = await fetch(`/api/owner/breakdown?instructor=${instructorId}&period=${period}`)
    const data = await res.json()
    setBreakdown(data.sessions ?? [])
    setLoadingBreakdown(false)
  }

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Pagamentos
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Pagamento de instrutores e parceiros
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Re-run button: always visible so newly-added instructors are picked up
              even after close_month was already run for this period. Safe because
              the underlying close_month SQL function uses UPSERT — see migration
              20260617000001_fix_close_month_idempotent.sql. */}
          <button
            onClick={closeMonth}
            disabled={closing}
            title="Recalculate commissions from all confirmed sessions in this period"
            style={{
              padding: '8px 14px',
              background: 'var(--powder)',
              border: '0.5px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--slate)',
              cursor: closing ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: closing ? 0.6 : 1,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {closing ? 'Calculando...' : '↻ Recalcular período'}
          </button>
          <form method="GET">
            <select
              name="period"
              defaultValue={period}
              onChange={e => (e.target.closest('form') as HTMLFormElement)?.submit()}
              style={{
                padding: '8px 14px',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px', color: 'var(--slate)',
                background: '#fff', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            >
              {monthOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </form>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: message.startsWith('Erro') ? 'var(--signal-light)' : 'var(--glacial-light)',
          color: message.startsWith('Erro') ? 'var(--signal-dark)' : 'var(--glacial-dark)',
          fontSize: '13px', marginBottom: '20px',
        }}>
          {message}
        </div>
      )}

      {/* Empty state */}
      {payments.length === 0 && partnerData.length === 0 && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '8px',
          }}>
            Nenhum pagamento para {period}
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--mist)',
            marginBottom: '24px', lineHeight: '1.6',
          }}>
            Calcule as comissões de todas as aulas confirmadas neste período.
          </div>
          <button
            onClick={closeMonth}
            disabled={closing}
            style={{
              padding: '10px 24px',
              background: 'var(--slate)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '13px', fontWeight: '500',
              cursor: closing ? 'not-allowed' : 'pointer',
              opacity: closing ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {closing ? 'Calculando...' : `Fechar ${period} →`}
          </button>
        </div>
      )}

      {(payments.length > 0 || partnerData.length > 0) && (
        <>

          {/* Instructor summary row */}
          {payments.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: '10px', marginBottom: '16px',
            }}>
              {[
                { label: 'Pendente',     value: fmt(summary.totalPending),  color: '#8A5E00' },
                { label: 'Aprovado',     value: fmt(summary.totalApproved), color: 'var(--glacial-dark)' },
                { label: 'Pago',         value: fmt(summary.totalPaid),     color: '#2E7D32' },
                { label: 'Total equipe', value: fmt(summary.total),         color: 'var(--slate)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#fff', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '18px', fontWeight: '600',
                    color: item.color, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Partner summary row */}
          {partnerData.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: '10px', marginBottom: '20px',
            }}>
              {[
                { label: 'Parceiros pendente',  value: fmt(partnerTotalPending),  color: '#8A5E00' },
                { label: 'Parceiros aprovado',  value: fmt(partnerTotalApproved), color: 'var(--glacial-dark)' },
                { label: 'Parceiros pago',      value: fmt(partnerTotalPaid),     color: '#2E7D32' },
                { label: 'Total parceiros',     value: fmt(partnerData.reduce((s, p) => s + p.commission, 0)), color: 'var(--slate)' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--powder)', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '18px', fontWeight: '600',
                    color: item.color, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {pending.length > 0 && (
              <button
                onClick={() => pending.forEach(p => updateStatus(p.id, 'approved'))}
                style={{
                  padding: '8px 16px',
                  background: 'var(--slate)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                ✓ Aprovar todos
              </button>
            )}
            {payments.some(p => p.status === 'approved' || p.status === 'paid') && (
              <>
                <a href={`/api/owner/export?period=${period}&format=pix`} style={{
                  padding: '8px 16px', background: 'var(--glacial)', color: '#fff',
                  borderRadius: 'var(--radius-md)', fontSize: '12px',
                  fontWeight: '500', textDecoration: 'none',
                }}>↓ BTG PIX CSV</a>
                <a href={`/api/owner/export?period=${period}&format=wise`} style={{
                  padding: '8px 16px', background: '#fff', color: 'var(--slate)',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)', fontSize: '12px',
                  fontWeight: '500', textDecoration: 'none',
                }}>↓ Wise CSV</a>
              </>
            )}
            {partnerData.length > 0 && partnerData.every(p => p.status !== 'pending') && (
              <a href={`/api/owner/export?period=${period}&format=partners`} style={{
                padding: '8px 16px', background: '#fff', color: 'var(--slate)',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', fontSize: '12px',
                fontWeight: '500', textDecoration: 'none',
              }}>↓ Parceiros CSV</a>
            )}
          </div>

          {/* Main list */}
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>

            {/* List header */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--mist)',
              }}>
                Equipe · {period}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                {payments.length} instrutor{payments.length !== 1 ? 'es' : ''}
                {partnerData.length > 0 && ` · ${partnerData.length} parceiro${partnerData.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Instructor rows */}
            {payments.map((p, idx) => {
              const user      = p.users as any
              const st        = STATUS[p.status] ?? STATUS.pending
              const avgLesson = p.sessions_count > 0 ? p.revenue_generated / p.sessions_count : 0
              const hasPix    = !!user?.pix_key
              const hasWise   = !!user?.wise_email

              return (
                <div key={p.id} style={{
                  borderBottom: idx < payments.length - 1 || partnerData.length > 0
                    ? '0.5px solid var(--border)' : 'none',
                }}>
                  {/* Main row */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '14px', padding: '16px 20px',
                    borderBottom: '0.5px solid var(--border)',
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '600', flexShrink: 0,
                    }}>
                      {getInitials(user?.name ?? '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)', marginBottom: '3px' }}>
                        {user?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        {p.sessions_count} {p.sessions_count === 1 ? 'aula' : 'aulas'}
                        {' · '}{fmtPct(p.commission_pct)} comissão
                        {hasPix && ` · PIX ${user.pix_key}`}
                        {!hasPix && hasWise && ` · Wise ${user.wise_email}`}
                        {!hasPix && !hasWise && (
                          <span style={{ color: 'var(--signal)' }}>{' · '}Dados de pagamento em falta</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: '20px', fontWeight: '600', color: 'var(--slate)',
                        marginBottom: '5px', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(p.total_to_pay)}
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: '99px',
                        fontSize: '11px', fontWeight: '500',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Metrics — always visible */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    background: 'var(--powder)', borderBottom: '0.5px solid var(--border)',
                  }}>
                    {[
                      { label: 'Receita gerada', value: fmt(p.revenue_generated) },
                      { label: 'Comissão',       value: fmt(p.commission_amount) },
                      { label: 'Média/aula',     value: fmt(avgLesson)           },
                    ].map((item, i) => (
                      <div key={item.label} style={{
                        padding: '12px 20px',
                        borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
                      }}>
                        <div style={{
                          fontSize: '10px', fontWeight: '500',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: 'var(--mist)', marginBottom: '4px',
                        }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: '15px', fontWeight: '600',
                          color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions row */}
                  <div style={{
                    padding: '12px 20px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', background: '#fff',
                  }}>
                    <div>
                      {p.paid_at && (
                        <span style={{ fontSize: '12px', color: '#2E7D32' }}>
                          ✓ Pago em {fmtDate(p.paid_at)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => fetchBreakdown(user?.id)}
                        style={{
                          padding: '7px 14px',
                          background: '#fff', color: 'var(--mist)',
                          border: '0.5px solid var(--border)',
                          borderRadius: '99px', fontSize: '12px',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Ver aulas →
                      </button>
                      {p.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(p.id, 'approved')}
                          disabled={loading === p.id}
                          style={{
                            padding: '7px 16px',
                            background: 'var(--glacial)', color: '#fff',
                            border: 'none', borderRadius: '99px',
                            fontSize: '12px', fontWeight: '500',
                            cursor: 'pointer', fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {loading === p.id ? '...' : `Aprovar ${fmt(p.total_to_pay)}`}
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(p.id, 'paid')}
                          disabled={loading === p.id}
                          style={{
                            padding: '7px 16px',
                            background: '#E8F5E9', color: '#2E7D32',
                            border: '0.5px solid #A5D6A7',
                            borderRadius: '99px', fontSize: '12px',
                            fontWeight: '500', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {loading === p.id ? '...' : 'Marcar como pago'}
                        </button>
                      )}
                      {p.status === 'paid' && (
                        <span style={{ fontSize: '12px', color: '#2E7D32' }}>
                          ✓ Pago{p.paid_at ? ` em ${fmtDate(p.paid_at)}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Partner rows */}
            {partnerData.length > 0 && (
              <>
                <div style={{
                  padding: '10px 20px',
                  background: 'var(--powder)',
                  borderTop: '0.5px solid var(--border)',
                  borderBottom: '0.5px solid var(--border)',
                  fontSize: '10px', fontWeight: '500',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--mist)',
                }}>
                  Parceiros
                </div>

                {partnerData.map((p, idx) => {
                  const st             = STATUS[p.status] ?? STATUS.pending
                  const icon           = p.partner.type === 'hotel' ? '🏨'
                    : p.partner.type === 'agency' ? '✈️' : '🤝'
                  const avgPerReferral = p.sessions > 0 ? p.revenue / p.sessions : 0

                  return (
                    <div key={p.partner.id} style={{
                      borderBottom: idx < partnerData.length - 1
                        ? '0.5px solid var(--border)' : 'none',
                    }}>
                      {/* Main row */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '14px', padding: '16px 20px',
                        borderBottom: '0.5px solid var(--border)',
                      }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '8px',
                          background: '#FFF8E8',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                        }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)', marginBottom: '3px' }}>
                            {p.partner.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                            {p.sessions} {p.sessions === 1 ? 'indicação' : 'indicações'}
                            {p.partner.commission_pct && ` · ${Math.round(p.partner.commission_pct * 100)}% comissão`}
                            {p.partner.pix_key && ` · PIX ${p.partner.pix_key}`}
                            {!p.partner.pix_key && p.partner.wise_email && ` · Wise ${p.partner.wise_email}`}
                            {!p.partner.pix_key && !p.partner.wise_email && !p.partner.finance_email && (
                              <span style={{ color: 'var(--signal)' }}>{' · '}Dados de pagamento em falta</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontSize: '20px', fontWeight: '600', color: 'var(--slate)',
                            marginBottom: '5px', fontVariantNumeric: 'tabular-nums',
                          }}>
                            {fmt(p.commission)}
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: '99px',
                            fontSize: '11px', fontWeight: '500',
                            background: st.bg, color: st.color,
                          }}>
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Metrics — always visible */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        background: 'var(--powder)', borderBottom: '0.5px solid var(--border)',
                      }}>
                        {[
                          { label: 'Receita gerada',  value: fmt(p.revenue)       },
                          { label: 'Comissão',        value: fmt(p.commission)    },
                          { label: 'Média/indicação', value: fmt(avgPerReferral)  },
                        ].map((item, i) => (
                          <div key={item.label} style={{
                            padding: '12px 20px',
                            borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
                          }}>
                            <div style={{
                              fontSize: '10px', fontWeight: '500',
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: 'var(--mist)', marginBottom: '4px',
                            }}>
                              {item.label}
                            </div>
                            <div style={{
                              fontSize: '15px', fontWeight: '600',
                              color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                            }}>
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{
                        padding: '12px 20px',
                        display: 'flex', justifyContent: 'flex-end',
                        alignItems: 'center', gap: '8px', background: '#fff',
                      }}>
                        {p.status === 'pending' && (
                          <button
                            onClick={() => approvePartner(p.referral_ids)}
                            disabled={loading === p.referral_ids[0]}
                            style={{
                              padding: '7px 16px',
                              background: 'var(--glacial)', color: '#fff',
                              border: 'none', borderRadius: '99px',
                              fontSize: '12px', fontWeight: '500',
                              cursor: 'pointer', fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {loading === p.referral_ids[0] ? '...' : `Aprovar ${fmt(p.commission)}`}
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button
                            onClick={() => approvePartner(p.referral_ids, true)}
                            disabled={loading === p.referral_ids[0]}
                            style={{
                              padding: '7px 16px',
                              background: '#E8F5E9', color: '#2E7D32',
                              border: '0.5px solid #A5D6A7',
                              borderRadius: '99px', fontSize: '12px',
                              fontWeight: '500', cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {loading === p.referral_ids[0] ? '...' : 'Marcar como pago'}
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <span style={{ fontSize: '12px', color: '#2E7D32' }}>✓ Pago</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* Breakdown bottom sheet */}
      {breakdownFor && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
            zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) setBreakdownFor(null) }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            width: '100%', maxHeight: '80vh',
            overflowY: 'auto', padding: '20px 24px 40px',
          }}>
            <div style={{
              width: '32px', height: '4px', background: 'var(--border)',
              borderRadius: '2px', margin: '0 auto 20px',
            }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
                  Aulas · {period}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  {(payments.find(p => (p.users as any)?.id === breakdownFor)?.users as any)?.name ?? '—'}
                </div>
              </div>
              <button
                onClick={() => setBreakdownFor(null)}
                style={{
                  background: 'var(--powder)', border: 'none',
                  borderRadius: '50%', width: '30px', height: '30px',
                  fontSize: '14px', cursor: 'pointer', color: 'var(--mist)',
                }}
              >
                ×
              </button>
            </div>

            {loadingBreakdown ? (
              <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                Carregando...
              </div>
            ) : (
              <div style={{
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                {breakdown.map((s: any, i: number) => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '12px 16px',
                    borderBottom: i < breakdown.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? '#fff' : 'var(--powder)',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
                        {s.checkins?.student_name ?? '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                        {s.activities?.name ?? '—'} · {s.duration_min}min ·{' '}
                        {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(s.commission_amount)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                        de {fmt(s.price)}
                      </div>
                    </div>
                  </div>
                ))}
                {breakdown.length > 0 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--powder)',
                    borderTop: '0.5px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
                      {breakdown.length} aulas · receita {fmt(breakdown.reduce((s: number, r: any) => s + (r.price ?? 0), 0))}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(breakdown.reduce((s: number, r: any) => s + r.commission_amount, 0))}
                    </span>
                  </div>
                )}
                {breakdown.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                    Nenhuma aula encontrada.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
