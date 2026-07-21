'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReceivablesView from '@/components/ReceivablesView'
import { formatCurrency } from '@/lib/currency'
import { whatsappDigitsWithCountryCode } from '@/lib/whatsapp'
import AutoRefresh from '@/components/AutoRefresh'

type Advance = {
  id: string
  amount: number
  note: string | null
  created_at: string
}

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
  advances: Advance[]
  totalAdvances: number
  netPayout: number
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
  return formatCurrency(n, { decimals: 2 })
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
  overdue:  { label: 'Atrasado',  bg: '#FEE2E2', color: '#DC2626' },
}

/** "Atrasado" isn't a stored status — there's no such column anywhere in
 *  this data model — but it's an honest derived state: a payment for a
 *  period that's already fully in the past and still isn't 'paid' really
 *  is overdue. Only overrides the badge, not the underlying status value
 *  (approve/pay actions still work exactly as before). */
function effectiveStatus(status: string, isPeriodPast: boolean) {
  if (isPeriodPast && status !== 'paid') return STATUS.overdue
  return STATUS[status] ?? STATUS.pending
}

export default function PaymentsClient({
  payments: initialPayments,
  period,
  summary: initialSummary,
  monthOptions,
  partnerCommissions,
  instructors,
  activeInstructor,
}: {
  payments: Payment[]
  period: string
  summary: Summary
  monthOptions: { value: string; label: string }[]
  partnerCommissions: PartnerRow[]
  instructors: { id: string; name: string }[]
  activeInstructor: string
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
  const [referralSheet, setReferralSheet] = useState<{
    partnerName: string
    referrals: Array<{
      student_name: string
      session_date: string
      revenue: number
      commission_amount: number
      status: string
    }>
  } | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<Record<string, { count: number; revenue: number }>>({})
  const [advanceModal, setAdvanceModal] = useState<{
    instructorId: string
    instructorName: string
    period: string
  } | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceNote, setAdvanceNote] = useState('')
  const [savingAdvance, setSavingAdvance] = useState(false)
  const [advanceHistoryFor, setAdvanceHistoryFor] = useState<{
    instructorName: string
    advances: Advance[]
  } | null>(null)
  const [tab, setTab] = useState<'team' | 'partners'>('team')
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)

  // payments/summary/partnerData start as copies of the server props so
  // in-page actions (approve, mark paid, advances) can update them
  // optimistically without a full round trip. That copy-once pattern
  // means a background AutoRefresh (router.refresh() re-fetching this
  // route's server data) would otherwise never reach the screen — the
  // new props would arrive, but nothing re-reads them into state. These
  // three keep the local copies honest whenever fresh data lands, without
  // touching the unrelated UI state (open modals, loading flags) that
  // lives in its own separate state and isn't affected by this.
  useEffect(() => { setPayments(initialPayments) }, [initialPayments])
  useEffect(() => { setSummary(initialSummary) }, [initialSummary])
  useEffect(() => { setPartnerData(partnerCommissions) }, [partnerCommissions])

  useEffect(() => {
    fetch(`/api/owner/payment-method-summary?period=${period}`)
      .then(r => r.json())
      .then(d => setPaymentSummary(d))
      .catch(() => {})
  }, [period])

  const pending = payments.filter(p => p.status === 'pending')
  const isPeriodPast = period < new Date().toISOString().slice(0, 7)

  const partnerTotalPending  = partnerData.filter(p => p.status === 'pending').reduce((s, p) => s + p.commission, 0)

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

    try {
      const res = await fetch('/api/owner/close-month', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id, action: 'update_status', ...update }),
      })
      const data = await res.json()
      // Only reflect the change locally once the write actually succeeded —
      // this used to update state unconditionally regardless of the response,
      // so a failed PATCH still showed "Aprovado" in the UI while the DB
      // stayed on 'pending' (exactly what made the BTG/Wise export 404 with
      // "no approved payments" downstream).
      if (!data.ok) {
        setMessage(`Erro ao atualizar pagamento: ${data.error ?? 'desconhecido'}`)
        return
      }
      const updated = payments.map(p => p.id === id ? { ...p, ...update } : p)
      setPayments(updated)
      setSummary({
        totalPending:  updated.filter(p => p.status === 'pending').reduce((s, p) => s + p.netPayout, 0),
        totalApproved: updated.filter(p => p.status === 'approved').reduce((s, p) => s + p.netPayout, 0),
        totalPaid:     updated.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPayout, 0),
        total:         summary.total,
      })
    } catch {
      setMessage('Erro de rede ao atualizar pagamento.')
    } finally {
      setLoading(null)
    }
  }

  async function approveAll() {
    if (pending.length === 0) return
    setLoading('all')
    try {
      const res = await fetch('/api/owner/close-month', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all', period }),
      })
      const data = await res.json()
      if (!data.ok) {
        setMessage(`Erro ao aprovar pagamentos: ${data.error ?? 'desconhecido'}`)
        return
      }
      const now = new Date().toISOString()
      const updated = payments.map(p => p.status === 'pending' ? { ...p, status: 'approved', approved_at: now } : p)
      setPayments(updated)
      setSummary({
        totalPending:  0,
        totalApproved: updated.filter(p => p.status === 'approved').reduce((s, p) => s + p.netPayout, 0),
        totalPaid:     updated.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPayout, 0),
        total:         summary.total,
      })
    } catch {
      setMessage('Erro de rede ao aprovar pagamentos.')
    } finally {
      setLoading(null)
    }
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

  async function fetchReferrals(partnerId: string, partnerName: string) {
    setReferralSheet({ partnerName, referrals: [] })
    const res  = await fetch(`/api/owner/partner-referrals?partner_id=${partnerId}&period=${period}`)
    const data = await res.json()
    setReferralSheet({ partnerName, referrals: data.referrals ?? [] })
  }

  async function fetchBreakdown(instructorId: string) {
    setBreakdownFor(instructorId)
    setLoadingBreakdown(true)
    const res  = await fetch(`/api/owner/breakdown?instructor=${instructorId}&period=${period}`)
    const data = await res.json()
    setBreakdown(data.sessions ?? [])
    setLoadingBreakdown(false)
  }

  async function submitAdvance() {
    if (!advanceModal) return
    const amount = Number(advanceAmount)
    if (!(amount > 0)) {
      setMessage('Erro: informe um valor válido para o adiantamento')
      return
    }
    setSavingAdvance(true)
    const res  = await fetch('/api/owner/instructor-advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor_id: advanceModal.instructorId,
        amount,
        period: advanceModal.period,
        note: advanceNote || null,
      }),
    })
    const data = await res.json()
    setSavingAdvance(false)
    if (!res.ok || data.error) {
      setMessage(`Erro: ${data.error ?? 'não foi possível registrar o adiantamento'}`)
      return
    }
    setAdvanceModal(null)
    setAdvanceAmount('')
    setAdvanceNote('')
    router.refresh()
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <AutoRefresh />
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
          <form method="GET" style={{ display: 'flex', gap: '10px' }}>
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
            <select
              name="instructor"
              defaultValue={activeInstructor}
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
              <option value="">Todos os instrutores</option>
              {instructors.map(ins => (
                <option key={ins.id} value={ins.id}>{ins.name}</option>
              ))}
            </select>
          </form>
        </div>
      </div>

      {/* A Receber */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '0.5px solid var(--border)',
        }}>
          A Receber
        </div>
        <ReceivablesView />
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

      {(payments.length > 0 || partnerData.length > 0) && (() => {
        const totalRevenueGenerated = payments.reduce((s, p) => s + p.revenue_generated, 0)
        const partnerTotalCommission = partnerData.reduce((s, p) => s + p.commission, 0)
        // With an instructor filter active, `payments`/totalRevenueGenerated is
        // already scoped to just that person — subtracting the school-wide
        // partner commission total from a single instructor's revenue would
        // produce a misleading (often deeply negative) "net" figure, since
        // partners aren't tied to any one instructor. Only net out partner
        // commissions in the unfiltered, whole-school view.
        const netRevenue = totalRevenueGenerated - summary.total - (activeInstructor ? 0 : partnerTotalCommission)
        const totalPendingAll = summary.totalPending + partnerTotalPending

        const PM_LABELS: Record<string, { label: string; icon: string }> = {
          pix:       { label: 'PIX',        icon: '⚡' },
          dinheiro:  { label: 'Dinheiro',   icon: '💵' },
          cartao:    { label: 'Cartão',     icon: '💳' },
          a_receber: { label: 'A receber',  icon: '⏳' },
          // Package-covered lessons (ConfirmLessonModal's simple flow) —
          // already paid for at package-sale time, not a new charge.
          pacote:    { label: 'Pacote (pré-pago)', icon: '—' },
          unknown:   { label: 'Sem registro', icon: '—' },
        }

        return (
        <>

          {/* Consolidated KPI row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: '10px', marginBottom: '20px',
          }}>
            {[
              { label: 'Total pendente geral',        value: fmt(totalPendingAll),   color: '#8A5E00' },
              { label: 'Comissões de instrutores',    value: fmt(summary.total),     color: 'var(--glacial-dark)' },
              { label: 'Comissões de parceiros',      value: fmt(partnerTotalCommission), color: 'var(--glacial-dark)' },
              { label: 'Faturamento líquido no mês',  value: fmt(netRevenue),        color: '#2E7D32' },
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

          {/* Payment method breakdown — discreet, collapsed by default */}
          {Object.keys(paymentSummary).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setShowPaymentMethods(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', padding: '0',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: '11px', fontWeight: '500',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--mist)',
                }}
              >
                <span style={{ transform: showPaymentMethods ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▸</span>
                Por forma de pagamento
              </button>
              {showPaymentMethods && (
                <div style={{
                  display: 'flex', gap: '16px', flexWrap: 'wrap',
                  marginTop: '10px', padding: '10px 14px',
                  background: 'var(--powder)', borderRadius: 'var(--radius-md)',
                }}>
                  {Object.entries(paymentSummary).map(([method, { count, revenue }]) => {
                    const pm = PM_LABELS[method] ?? { label: method, icon: '—' }
                    return (
                      <span key={method} style={{ fontSize: '12px', color: 'var(--slate)' }}>
                        {pm.icon} {pm.label} <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(revenue)}</strong>
                        <span style={{ color: 'var(--mist)' }}> ({count})</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '0', borderBottom: '0.5px solid var(--border)',
            marginBottom: '16px',
          }}>
            {([
              { key: 'team' as const,     label: `Instrutores (${payments.length})` },
              { key: 'partners' as const, label: `Parceiros (${partnerData.length})` },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '10px 18px', background: 'none', border: 'none',
                  borderBottom: tab === t.key ? '2px solid var(--glacial)' : '2px solid transparent',
                  color: tab === t.key ? 'var(--slate)' : 'var(--mist)',
                  fontSize: '13px', fontWeight: tab === t.key ? '600' : '400',
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-0.5px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Action buttons — contextual to the active tab */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {tab === 'team' && pending.length > 0 && (
              <button
                onClick={approveAll}
                disabled={loading === 'all'}
                style={{
                  padding: '8px 16px',
                  background: 'var(--slate)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '12px', fontWeight: '500',
                  cursor: loading === 'all' ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  opacity: loading === 'all' ? 0.6 : 1,
                }}
              >
                {loading === 'all' ? 'Aprovando...' : '✓ Aprovar todos'}
              </button>
            )}
            {tab === 'team' && payments.some(p => p.status === 'approved' || p.status === 'paid') && (
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
            {tab === 'partners' && partnerData.length > 0 && partnerData.every(p => p.status !== 'pending') && (
              <a href={`/api/owner/export?period=${period}&format=partners`} style={{
                padding: '8px 16px', background: '#fff', color: 'var(--slate)',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', fontSize: '12px',
                fontWeight: '500', textDecoration: 'none',
              }}>↓ Parceiros CSV</a>
            )}
          </div>

          {/* Instrutores — minimalist table */}
          {tab === 'team' && (
            <div style={{
              background: '#fff', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
              {payments.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                  Nenhuma comissão de instrutor neste período.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--powder)' }}>
                      {['Instrutor', 'Sessões', 'Receita', '%', 'A receber', 'Status', 'Ações'].map((h, i) => (
                        <th key={h} style={{
                          padding: '10px 20px', textAlign: i >= 1 && i <= 4 ? 'right' : 'left',
                          fontSize: '10px', fontWeight: '600',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => {
                      const user    = p.users as any
                      const st      = effectiveStatus(p.status, isPeriodPast)
                      const hasPix  = !!user?.pix_key
                      const hasWise = !!user?.wise_email
                      return (
                        <tr key={p.id} style={{
                          borderBottom: idx < payments.length - 1 ? '0.5px solid var(--border)' : 'none',
                        }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--glacial-light)', color: 'var(--glacial-dark)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '600', flexShrink: 0,
                              }}>
                                {getInitials(user?.name ?? '?')}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
                                  {user?.name ?? '—'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                                  {hasPix ? `PIX ${user.pix_key}` : hasWise ? `Wise ${user.wise_email}` : (
                                    <span style={{ color: 'var(--signal)' }}>Dados de pagamento em falta</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => fetchBreakdown(user?.id)}
                              title="Ver aulas deste período"
                              style={{
                                background: 'none', border: 'none', padding: '0',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                                color: 'var(--glacial-dark)', fontWeight: '600',
                                textDecoration: 'underline dotted', textUnderlineOffset: '3px',
                              }}
                            >
                              {p.sessions_count}
                            </button>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(p.revenue_generated)}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--mist)' }}>
                            {fmtPct(p.commission_pct)}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(p.netPayout)}
                            </div>
                            {p.totalAdvances > 0 && (
                              <div
                                onClick={() => setAdvanceHistoryFor({ instructorName: user?.name ?? '—', advances: p.advances })}
                                title="Ver histórico de adiantamentos"
                                style={{
                                  fontSize: '10px', color: '#DC2626', cursor: 'pointer',
                                  textDecoration: 'underline dotted', textUnderlineOffset: '2px',
                                }}
                              >
                                − {fmt(p.totalAdvances)} adiant.
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                              fontSize: '11px', fontWeight: '500',
                              background: st.bg, color: st.color, whiteSpace: 'nowrap',
                            }}>
                              {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => setAdvanceModal({
                                  instructorId: user?.id,
                                  instructorName: user?.name ?? '—',
                                  period,
                                })}
                                title="Registrar adiantamento"
                                style={{
                                  padding: '5px 10px', background: '#fff', color: 'var(--mist)',
                                  border: '0.5px solid var(--border-strong)', borderRadius: '99px',
                                  fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                + Adiant.
                              </button>
                              <button
                                onClick={() => fetchBreakdown(user?.id)}
                                style={{
                                  padding: '5px 10px', background: '#fff', color: 'var(--mist)',
                                  border: '0.5px solid var(--border-strong)', borderRadius: '99px',
                                  fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Recibo
                              </button>
                              {p.status === 'pending' && (
                                <button
                                  onClick={() => updateStatus(p.id, 'approved')}
                                  disabled={loading === p.id}
                                  style={{
                                    padding: '5px 12px', background: 'var(--glacial)', color: '#fff',
                                    border: 'none', borderRadius: '99px',
                                    fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {loading === p.id ? '...' : 'Aprovar'}
                                </button>
                              )}
                              {p.status === 'approved' && (
                                <button
                                  onClick={() => updateStatus(p.id, 'paid')}
                                  disabled={loading === p.id}
                                  style={{
                                    padding: '5px 12px', background: '#E8F5E9', color: '#2E7D32',
                                    border: '0.5px solid #A5D6A7', borderRadius: '99px',
                                    fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {loading === p.id ? '...' : 'Marcar pago'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Comissões de Parceiros — minimalist table */}
          {tab === 'partners' && (
            <div style={{
              background: '#fff', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
              {partnerData.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                  Nenhuma comissão de parceiro neste período.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--powder)' }}>
                      {['Parceiro', 'Indicações', 'Receita', 'Comissão', 'Status', 'Ações'].map((h, i) => (
                        <th key={h} style={{
                          padding: '10px 20px', textAlign: i >= 1 && i <= 3 ? 'right' : 'left',
                          fontSize: '10px', fontWeight: '600',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: 'var(--mist)', borderBottom: '0.5px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partnerData.map((p, idx) => {
                      const st   = effectiveStatus(p.status, isPeriodPast)
                      const icon = p.partner.type === 'hotel' ? '🏨'
                        : p.partner.type === 'agency' ? '✈️' : '🤝'
                      return (
                        <tr key={p.partner.id} style={{
                          borderBottom: idx < partnerData.length - 1 ? '0.5px solid var(--border)' : 'none',
                        }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                                background: '#FFF8E8', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                              }}>
                                {icon}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--slate)' }}>
                                  {p.partner.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                                  {p.partner.pix_key ? `PIX ${p.partner.pix_key}`
                                    : p.partner.wise_email ? `Wise ${p.partner.wise_email}`
                                    : <span style={{ color: 'var(--signal)' }}>Dados de pagamento em falta</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => fetchReferrals(p.partner.id, p.partner.name)}
                              style={{
                                background: 'none', border: 'none', padding: '0',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                                color: 'var(--glacial-dark)', fontWeight: '600',
                                textDecoration: 'underline dotted', textUnderlineOffset: '3px',
                              }}
                            >
                              {p.sessions}
                            </button>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(p.revenue)}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(p.commission)}
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                              fontSize: '11px', fontWeight: '500',
                              background: st.bg, color: st.color, whiteSpace: 'nowrap',
                            }}>
                              {st.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {p.status === 'pending' && (
                                <button
                                  onClick={() => approvePartner(p.referral_ids)}
                                  disabled={loading === p.referral_ids[0]}
                                  style={{
                                    padding: '5px 12px', background: 'var(--glacial)', color: '#fff',
                                    border: 'none', borderRadius: '99px',
                                    fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {loading === p.referral_ids[0] ? '...' : 'Aprovar'}
                                </button>
                              )}
                              {p.status === 'approved' && (
                                <button
                                  onClick={() => approvePartner(p.referral_ids, true)}
                                  disabled={loading === p.referral_ids[0]}
                                  style={{
                                    padding: '5px 12px', background: '#E8F5E9', color: '#2E7D32',
                                    border: '0.5px solid #A5D6A7', borderRadius: '99px',
                                    fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {loading === p.referral_ids[0] ? '...' : 'Marcar pago'}
                                </button>
                              )}
                              {p.status === 'paid' && (
                                <span style={{ fontSize: '11px', color: '#2E7D32' }}>✓ Pago</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
        )
      })()}

      {/* Referral detail bottom sheet */}
      {referralSheet && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setReferralSheet(null) }}
        >
          <div style={{
            background: '#fff', width: '100%', maxHeight: '70vh',
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '99px' }} />
            </div>
            <div style={{
              padding: '0 24px 16px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '3px' }}>
                  {referralSheet.partnerName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                  {referralSheet.referrals.length} indicaç{referralSheet.referrals.length === 1 ? 'ão' : 'ões'} · {period}
                </div>
              </div>
              <button
                onClick={() => setReferralSheet(null)}
                style={{
                  background: 'var(--powder)', border: 'none', borderRadius: '99px',
                  width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', color: 'var(--mist)',
                }}
              >×</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {referralSheet.referrals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '14px', color: 'var(--mist)' }}>
                  Nenhuma indicação encontrada para este período.
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                    padding: '10px 24px', background: 'var(--powder)',
                    borderBottom: '0.5px solid var(--border)',
                  }}>
                    {['Aluno', 'Data', 'Receita', 'Comissão'].map((h, i) => (
                      <div key={h} style={{
                        fontSize: '10px', fontWeight: '600',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--mist)', textAlign: i > 0 ? 'right' : 'left',
                      }}>{h}</div>
                    ))}
                  </div>

                  {referralSheet.referrals.map((r, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                      padding: '13px 24px', alignItems: 'center',
                      borderBottom: i < referralSheet.referrals.length - 1 ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--slate)' }}>
                        {r.student_name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                        {r.session_date !== '—'
                          ? new Date(r.session_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                          : '—'}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(r.revenue)}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--glacial-dark)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(r.commission_amount)}
                      </div>
                    </div>
                  ))}

                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                    padding: '13px 24px', background: 'var(--powder)',
                    borderTop: '0.5px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                    <div />
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(referralSheet.referrals.reduce((s, r) => s + r.revenue, 0))}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--glacial-dark)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(referralSheet.referrals.reduce((s, r) => s + r.commission_amount, 0))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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
            {(() => {
              const breakdownPayment = payments.find(p => (p.users as any)?.id === breakdownFor)
              const bpUser = breakdownPayment?.users as any
              const totalAdvances = breakdownPayment?.totalAdvances ?? 0
              const netPayout = breakdownPayment?.netPayout ?? 0

              const whatsappMessage = breakdownPayment
                ? `Olá ${bpUser?.name ?? ''}! Segue o resumo do fechamento de ${period}: ` +
                  `${breakdownPayment.sessions_count} aula${breakdownPayment.sessions_count !== 1 ? 's' : ''}, ` +
                  `comissão de ${fmt(breakdownPayment.commission_amount)}` +
                  `${breakdownPayment.bonus > 0 ? ` + bônus de ${fmt(breakdownPayment.bonus)}` : ''}` +
                  `${totalAdvances > 0 ? `, com desconto de ${fmt(totalAdvances)} em adiantamentos` : ''}. ` +
                  `Total líquido a receber: ${fmt(netPayout)}.`
                : ''

              return (
                <>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '16px', gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--slate)', marginBottom: '2px' }}>
                        Aulas · {period}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        {bpUser?.name ?? '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {breakdownPayment && (
                        <>
                          <a
                            href={`/api/owner/receipt/${breakdownPayment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 12px', background: '#fff', color: 'var(--slate)',
                              border: '0.5px solid var(--border-strong)', borderRadius: '99px',
                              fontSize: '11px', fontWeight: '500', textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ↓ Exportar PDF
                          </a>
                          <a
                            href={bpUser?.whatsapp
                              ? `https://api.whatsapp.com/send?phone=${whatsappDigitsWithCountryCode(bpUser.whatsapp)}&text=${encodeURIComponent(whatsappMessage)}`
                              : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={bpUser?.whatsapp ? undefined : 'Instrutor sem WhatsApp cadastrado'}
                            aria-disabled={!bpUser?.whatsapp}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(37,211,102,0.1)', color: '#128C4A',
                              border: 'none', borderRadius: '99px',
                              fontSize: '11px', fontWeight: '500', textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              opacity: bpUser?.whatsapp ? 1 : 0.4,
                              pointerEvents: bpUser?.whatsapp ? 'auto' : 'none',
                              cursor: bpUser?.whatsapp ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Enviar WhatsApp
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => setBreakdownFor(null)}
                        style={{
                          background: 'var(--powder)', border: 'none',
                          borderRadius: '50%', width: '30px', height: '30px',
                          fontSize: '14px', cursor: 'pointer', color: 'var(--mist)',
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
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
                      {totalAdvances > 0 && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '10px 16px', borderTop: '0.5px solid var(--border)',
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>Adiantamentos</span>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#DC2626' }}>
                            − {fmt(totalAdvances)}
                          </span>
                        </div>
                      )}
                      {breakdownPayment && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 16px', background: 'var(--powder)',
                          borderTop: '0.5px solid var(--border)',
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Total a receber
                          </span>
                          <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(netPayout)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Advance ("adiantamento") modal */}
      {advanceModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setAdvanceModal(null) }}
        >
          <div style={{
            background: '#fff', width: '100%', maxWidth: '480px', margin: '0 auto',
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            padding: '20px 24px 28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '99px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)' }}>
                Adiantamento — {advanceModal.instructorName}
              </div>
              <button
                onClick={() => setAdvanceModal(null)}
                style={{
                  background: 'var(--powder)', border: 'none', borderRadius: '99px',
                  width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', color: 'var(--mist)',
                }}
              >×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Valor
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', color: 'var(--mist)' }}>R$</span>
                <input
                  type="number" min={0} step={10}
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, padding: '10px 12px',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '18px', fontWeight: '600',
                    color: 'var(--slate)', fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--mist)', marginBottom: '8px',
              }}>
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={advanceNote}
                onChange={e => setAdvanceNote(e.target.value)}
                placeholder="Ex: adiantamento para viagem"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '0.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px', color: 'var(--slate)',
                  fontFamily: 'var(--font-sans)', outline: 'none',
                }}
              />
            </div>

            <button
              onClick={submitAdvance}
              disabled={savingAdvance}
              style={{
                width: '100%', padding: '12px',
                background: 'var(--slate)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: '14px', fontWeight: '500',
                cursor: savingAdvance ? 'not-allowed' : 'pointer',
                opacity: savingAdvance ? 0.6 : 1,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {savingAdvance ? 'Salvando...' : 'Registrar adiantamento'}
            </button>
          </div>
        </div>
      )}

      {/* Advance history — read-only list, opened by clicking the red
          "− R$X adiant." total in the table (distinct from the modal
          above, which is the add-new-advance form). */}
      {advanceHistoryFor && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setAdvanceHistoryFor(null) }}
        >
          <div style={{
            background: '#fff', width: '100%', maxWidth: '480px', margin: '0 auto',
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            padding: '20px 24px 28px', maxHeight: '70vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '99px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '2px' }}>
                  Adiantamentos — {advanceHistoryFor.instructorName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)' }}>{period}</div>
              </div>
              <button
                onClick={() => setAdvanceHistoryFor(null)}
                style={{
                  background: 'var(--powder)', border: 'none', borderRadius: '99px',
                  width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', color: 'var(--mist)', flexShrink: 0,
                }}
              >×</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {advanceHistoryFor.advances.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                  Nenhum adiantamento registrado.
                </div>
              ) : (
                advanceHistoryFor.advances.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '10px 0', borderBottom: '0.5px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--slate)', fontWeight: '500' }}>
                        {fmtDate(a.created_at)}
                      </div>
                      {a.note && (
                        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
                          {a.note}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      − {fmt(a.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {advanceHistoryFor.advances.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: '12px', marginTop: '4px', borderTop: '0.5px solid var(--border)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total
                </span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                  − {fmt(advanceHistoryFor.advances.reduce((s, a) => s + (a.amount ?? 0), 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
