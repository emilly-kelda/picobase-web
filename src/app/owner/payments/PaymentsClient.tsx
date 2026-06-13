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
  users: { id: string; name: string; pix_key: string | null; wise_email: string | null } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'var(--amber-light)',   color: 'var(--amber)',        label: 'Pending'  },
  approved: { bg: 'var(--glacial-light)', color: 'var(--glacial-dark)', label: 'Approved' },
  paid:     { bg: 'var(--powder)',        color: 'var(--mist)',         label: 'Paid'     },
}

export default function PaymentsClient({
  payments: initialPayments,
  period,
  monthOptions,
}: {
  payments: Payment[]
  period: string
  monthOptions: { value: string; label: string }[]
}) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [loading, setLoading] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [breakdown, setBreakdown]               = useState<any[]>([])
  const [breakdownFor, setBreakdownFor]         = useState<string | null>(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const pending    = payments.filter(p => p.status === 'pending')
  const approved   = payments.filter(p => p.status === 'approved')
  const allApproved = payments.length > 0 && pending.length === 0

  const totalPending  = pending.reduce((s, p) => s + p.total_to_pay, 0)
  const totalApproved = approved.reduce((s, p) => s + p.total_to_pay, 0)

  async function closeMonth() {
    setClosing(true)
    setMessage(null)
    const res = await fetch('/api/owner/close-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    const data = await res.json()
    if (data.ok) {
      setMessage(`Created ${data.created} payment record${data.created !== 1 ? 's' : ''}`)
      router.refresh()
    } else {
      setMessage(`Error: ${data.error}`)
    }
    setClosing(false)
  }

  async function approvePayment(id: string) {
    setLoading(id)
    await fetch('/api/owner/close-month', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: id, action: 'approve' }),
    })
    setPayments(prev =>
      prev.map(p => p.id === id
        ? { ...p, status: 'approved', approved_at: new Date().toISOString() }
        : p
      )
    )
    setLoading(null)
  }

  async function approveAll() {
    setLoading('all')
    for (const p of pending) {
      await approvePayment(p.id)
    }
    setLoading(null)
  }

  async function fetchBreakdown(instructorId: string) {
    setBreakdownFor(instructorId)
    setLoadingBreakdown(true)
    const res = await fetch(
      `/api/owner/breakdown?instructor=${instructorId}&period=${period}`
    )
    const data = await res.json()
    setBreakdown(data.sessions ?? [])
    setLoadingBreakdown(false)
  }

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Payments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Crew payroll &mdash; close the month
          </p>
        </div>

        {/* Period selector */}
        <form method="GET">
          <select
            name="period"
            defaultValue={period}
            onChange={e => {
              const form = e.target.closest('form') as HTMLFormElement
              form?.submit()
            }}
            style={{
              padding: '9px 14px',
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

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: message.startsWith('Error')
            ? 'var(--signal-light)' : 'var(--glacial-light)',
          color: message.startsWith('Error')
            ? 'var(--signal-dark)' : 'var(--glacial-dark)',
          fontSize: '13px', marginBottom: '20px',
        }}>
          {message}
        </div>
      )}

      {/* No payments yet */}
      {payments.length === 0 && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--slate)', marginBottom: '8px', fontWeight: '500' }}>
            No payment records for {period}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '24px' }}>
            Calculate commissions from all confirmed sessions this period.
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
            {closing ? 'Calculating...' : `Close ${period} ?`}
          </button>
        </div>
      )}

      {/* Payments exist */}
      {payments.length > 0 && (
        <>
          {/* Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px', marginBottom: '20px',
          }}>
            <div style={{
              background: '#fff', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                Pending approval
              </span>
              <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--amber)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(totalPending)}
              </span>
            </div>
            <div style={{
              background: '#fff', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mist)' }}>
                Approved
              </span>
              <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--glacial-dark)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(totalApproved)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: '10px',
            marginBottom: '20px', flexWrap: 'wrap',
          }}>
            {!allApproved && (
              <button
                onClick={approveAll}
                disabled={loading === 'all'}
                style={{
                  padding: '9px 18px',
                  background: 'var(--slate)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', fontWeight: '500',
                  cursor: loading === 'all' ? 'not-allowed' : 'pointer',
                  opacity: loading === 'all' ? 0.6 : 1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Approve all
              </button>
            )}
            {allApproved && (
              <>
                <a
                  href={`/api/owner/export?period=${period}&format=pix`}
                  style={{
                    padding: '9px 18px',
                    background: 'var(--glacial)', color: '#fff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px', fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  BTG PIX CSV
                </a>
                <a
                  href={`/api/owner/export?period=${period}&format=wise`}
                  style={{
                    padding: '9px 18px',
                    background: '#fff', color: 'var(--slate)',
                    border: '0.5px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px', fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  Wise CSV
                </a>
              </>
            )}
          </div>

          {/* Payment cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.map(p => {
              const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending
              const user = p.users as any
              return (
                <div key={p.id} style={{
                  background: '#fff',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                }}>
                  <div
                    onClick={() => fetchBreakdown(user?.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '15px', fontWeight: '500',
                        color: 'var(--slate)', marginBottom: '4px',
                      }}>
                        {user?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        {p.sessions_count} sessions &middot; {fmtPct(p.commission_pct)} commission
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--glacial)',
                        flexShrink: 0,
                      }}>
                        View sessions &rarr;
                      </span>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                      <div style={{
                        fontSize: '22px', fontWeight: '600',
                        color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(p.total_to_pay)}
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display: 'flex', gap: '24px',
                    padding: '12px 0',
                    borderTop: '0.5px solid var(--border)',
                    borderBottom: user?.pix_key || p.status === 'pending'
                      ? '0.5px solid var(--border)' : 'none',
                    marginBottom: user?.pix_key || p.status === 'pending' ? '12px' : '0',
                  }}>
                    {[
                      { label: 'Revenue',    value: fmt(p.revenue_generated) },
                      { label: 'Commission', value: fmt(p.commission_amount) },
                      { label: 'Bonus',      value: fmt(p.bonus)             },
                      { label: 'Total',      value: fmt(p.total_to_pay)      },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: '10px', color: 'var(--mist)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PIX key + approve button */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    {user?.pix_key ? (
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        PIX <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate)' }}>{user.pix_key}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>No payment details</div>
                    )}

                    {p.status === 'pending' && (
                      <button
                        onClick={() => approvePayment(p.id)}
                        disabled={loading === p.id}
                        style={{
                          padding: '7px 16px',
                          background: 'var(--glacial-light)',
                          color: 'var(--glacial-dark)',
                          border: '0.5px solid var(--glacial)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px', fontWeight: '500',
                          cursor: loading === p.id ? 'not-allowed' : 'pointer',
                          opacity: loading === p.id ? 0.6 : 1,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {loading === p.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Breakdown modal */}
      {breakdownFor && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 100,
          }}
          onClick={e => { if (e.target === e.currentTarget) setBreakdownFor(null) }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px 24px 40px',
          }}>
            {/* Handle */}
            <div style={{
              width: '36px', height: '4px',
              background: 'var(--border)',
              borderRadius: '2px',
              margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{
                  fontSize: '17px', fontWeight: '600',
                  color: 'var(--slate)', marginBottom: '3px',
                }}>
                  Session breakdown
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                  {(payments.find(p => (p.users as any)?.id === breakdownFor)?.users as any)?.name ?? '—'}
                  {' · '}
                  {period}
                </div>
              </div>
              <button
                onClick={() => setBreakdownFor(null)}
                style={{
                  background: 'var(--powder)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px', height: '32px',
                  fontSize: '18px', cursor: 'pointer',
                  color: 'var(--mist)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                &times;
              </button>
            </div>

            {loadingBreakdown ? (
              <div style={{
                padding: '40px', textAlign: 'center',
                fontSize: '13px', color: 'var(--mist)',
              }}>
                Loading...
              </div>
            ) : breakdown.length === 0 ? (
              <div style={{
                padding: '40px', textAlign: 'center',
                fontSize: '13px', color: 'var(--mist)',
              }}>
                No sessions found for this period.
              </div>
            ) : (
              <>
                {/* Sessions list */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  gap: '0',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}>
                  {breakdown.map((s: any, i: number) => (
                    <div key={s.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderBottom: i < breakdown.length - 1
                        ? '0.5px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? '#fff' : 'var(--powder)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: '500',
                          color: 'var(--slate)', marginBottom: '2px',
                        }}>
                          {s.checkins?.student_name ?? '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                          {s.activities?.name ?? '—'}
                          {' · '}
                          {s.duration_min}min
                          {' · '}
                          {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short',
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: '13px', fontWeight: '500',
                          color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {fmt(s.commission_amount)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                          of {fmt(s.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{
                  background: 'var(--powder)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '2px' }}>
                      {breakdown.length} sessions
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                      Revenue {fmt(breakdown.reduce((s: number, r: any) => s + (r.price ?? 0), 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '2px' }}>
                      Total commission
                    </div>
                    <div style={{
                      fontSize: '20px', fontWeight: '600',
                      color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmt(breakdown.reduce((s: number, r: any) => s + (r.commission_amount ?? 0), 0))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
