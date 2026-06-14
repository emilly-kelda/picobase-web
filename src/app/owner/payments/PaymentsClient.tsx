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
  pending:  { label: 'Pendente',  bg: 'var(--amber-light)',   color: 'var(--amber)'        },
  approved: { label: 'Aprovado',  bg: 'var(--glacial-light)', color: 'var(--glacial-dark)' },
  paid:     { label: 'Pago',      bg: '#E8F5E9',              color: '#2E7D32'             },
}

export default function PaymentsClient({
  payments: initialPayments,
  period,
  summary: initialSummary,
  monthOptions,
}: {
  payments: Payment[]
  period: string
  summary: Summary
  monthOptions: { value: string; label: string }[]
}) {
  const router  = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [summary,  setSummary]  = useState(initialSummary)
  const [loading,  setLoading]  = useState<string | null>(null)
  const [closing,  setClosing]  = useState(false)
  const [message,  setMessage]  = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [breakdownFor, setBreakdownFor] = useState<string | null>(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)

  const pending     = payments.filter(p => p.status === 'pending')
  const allApproved = payments.length > 0 && pending.length === 0

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
      setMessage(`✓ ${data.created} registro${data.created !== 1 ? 's' : ''} criado${data.created !== 1 ? 's' : ''}`)
      router.refresh()
    } else {
      setMessage(`Erro: ${data.error}`)
    }
    setClosing(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    setLoading(id)
    const update: Record<string, string> = { status: newStatus }
    if (newStatus === 'approved') update.approved_at = new Date().toISOString()
    if (newStatus === 'paid')     update.paid_at     = new Date().toISOString()

    await fetch('/api/owner/close-month', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: id, action: 'update_status', ...update }),
    })

    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...update } : p))
    setSummary(prev => {
      const updated = payments.map(p => p.id === id ? { ...p, ...update } : p)
      return {
        totalPending:  updated.filter(p => p.status === 'pending').reduce((s, p) => s + p.total_to_pay, 0),
        totalApproved: updated.filter(p => p.status === 'approved').reduce((s, p) => s + p.total_to_pay, 0),
        totalPaid:     updated.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_to_pay, 0),
        total:         prev.total,
      }
    })
    setLoading(null)
  }

  async function fetchBreakdown(instructorId: string) {
    setBreakdownFor(instructorId)
    setLoadingBreakdown(true)
    const res = await fetch(`/api/owner/breakdown?instructor=${instructorId}&period=${period}`)
    const data = await res.json()
    setBreakdown(data.sessions ?? [])
    setLoadingBreakdown(false)
  }

  return (
    <div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Repasses
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Folha de pagamento da equipe
          </p>
        </div>
        <form method="GET">
          <select
            name="period"
            defaultValue={period}
            onChange={e => (e.target.closest('form') as HTMLFormElement)?.submit()}
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
          background: message.startsWith('Erro') ? 'var(--signal-light)' : 'var(--glacial-light)',
          color: message.startsWith('Erro') ? 'var(--signal-dark)' : 'var(--glacial-dark)',
          fontSize: '13px', marginBottom: '20px',
        }}>
          {message}
        </div>
      )}

      {/* No payments */}
      {payments.length === 0 && (
        <div style={{
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '8px',
          }}>
            Nenhum repasse para {period}
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

      {payments.length > 0 && (
        <>
          {/* Summary card */}
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            marginBottom: '20px',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '0.5px solid var(--border)',
              fontSize: '12px', fontWeight: '500',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--mist)',
            }}>
              Folha de pagamento · {period}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { label: 'Pendente',     value: fmt(summary.totalPending),  color: 'var(--amber)'        },
                { label: 'Aprovado',     value: fmt(summary.totalApproved), color: 'var(--glacial-dark)' },
                { label: 'Pago',         value: fmt(summary.totalPaid),     color: '#2E7D32'             },
                { label: 'Total devido', value: fmt(summary.total),         color: 'var(--slate)'        },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: '16px 20px',
                  borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--mist)', marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '20px', fontWeight: '600',
                    color: item.color, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {pending.length > 0 && (
              <button
                onClick={() => pending.forEach(p => updateStatus(p.id, 'approved'))}
                disabled={loading === 'all'}
                style={{
                  padding: '9px 18px',
                  background: 'var(--slate)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                ✓ Aprovar todos
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
                    display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  ↓ BTG PIX CSV
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
                    display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  ↓ Wise CSV
                </a>
              </>
            )}
          </div>

          {/* Instructor cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.map(p => {
              const user   = p.users as any
              const st     = STATUS[p.status] ?? STATUS.pending
              const avgLesson = p.sessions_count > 0
                ? p.revenue_generated / p.sessions_count
                : 0
              const hasPix  = !!user?.pix_key
              const hasWise = !!user?.wise_email
              const hasPaymentDetails = hasPix || hasWise

              return (
                <div key={p.id} style={{
                  background: '#fff',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}>

                  {/* Card header */}
                  <div style={{
                    padding: '18px 24px',
                    borderBottom: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--glacial-light)',
                      color: 'var(--glacial-dark)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px', fontWeight: '600', flexShrink: 0,
                    }}>
                      {getInitials(user?.name ?? '?')}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px', fontWeight: '500',
                        color: 'var(--slate)', marginBottom: '2px',
                      }}>
                        {user?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                        {p.sessions_count} aulas · {fmtPct(p.commission_pct)} comissão
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px', fontWeight: '500',
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                      <div style={{
                        fontSize: '24px', fontWeight: '600',
                        color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(p.total_to_pay)}
                      </div>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    borderBottom: '0.5px solid var(--border)',
                  }}>
                    {[
                      { label: 'Receita gerada', value: fmt(p.revenue_generated) },
                      { label: 'Comissão',        value: fmt(p.commission_amount) },
                      { label: 'Bônus',           value: fmt(p.bonus)             },
                      { label: 'Média por aula',  value: fmt(avgLesson)           },
                      { label: 'Total repasse',   value: fmt(p.total_to_pay)      },
                    ].map((item, i) => (
                      <div key={item.label} style={{
                        padding: '12px 16px',
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
                          fontSize: '14px', fontWeight: '600',
                          color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row — payment details + actions */}
                  <div style={{
                    padding: '14px 24px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '16px',
                  }}>
                    {/* Payment info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {hasPix && (
                        <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                          PIX{' '}
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--slate)', fontSize: '11px',
                          }}>
                            {user.pix_key}
                          </span>
                        </div>
                      )}
                      {hasWise && (
                        <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                          Wise{' '}
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--slate)', fontSize: '11px',
                          }}>
                            {user.wise_email}
                          </span>
                        </div>
                      )}
                      {!hasPaymentDetails && (
                        <div style={{
                          fontSize: '12px', color: 'var(--signal-dark)',
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: 'var(--signal)', flexShrink: 0,
                          }} />
                          Dados de pagamento não cadastrados
                        </div>
                      )}
                      {p.paid_at && (
                        <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>
                          Pago em {fmtDate(p.paid_at)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => fetchBreakdown(user?.id)}
                        style={{
                          padding: '7px 14px',
                          background: 'var(--powder)',
                          border: '0.5px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px', color: 'var(--mist)',
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
                            background: 'var(--glacial-light)',
                            color: 'var(--glacial-dark)',
                            border: '0.5px solid var(--glacial)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px', fontWeight: '500',
                            cursor: loading === p.id ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {loading === p.id ? '...' : '✓ Aprovar'}
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
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px', fontWeight: '500',
                            cursor: loading === p.id ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {loading === p.id ? '...' : '✓ Marcar como pago'}
                        </button>
                      )}

                      {p.status === 'paid' && (
                        <div style={{
                          fontSize: '12px', color: '#2E7D32',
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}>
                          <span>✓</span>
                          <span>Pago{p.paid_at ? ` em ${fmtDate(p.paid_at)}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Session breakdown modal */}
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
            borderRadius: '24px 24px 0 0',
            width: '100%', maxHeight: '85vh',
            overflowY: 'auto', padding: '24px 24px 40px',
          }}>
            <div style={{
              width: '36px', height: '4px', background: 'var(--border)',
              borderRadius: '2px', margin: '0 auto 20px',
            }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px',
            }}>
              <div>
                <div style={{
                  fontSize: '17px', fontWeight: '600',
                  color: 'var(--slate)', marginBottom: '3px',
                }}>
                  Detalhamento de aulas
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
                  background: 'var(--powder)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  fontSize: '16px', cursor: 'pointer', color: 'var(--mist)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                ×
              </button>
            </div>

            {loadingBreakdown ? (
              <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                Carregando...
              </div>
            ) : breakdown.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
                Nenhuma aula encontrada.
              </div>
            ) : (
              <>
                <div style={{
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  marginBottom: '16px',
                }}>
                  {breakdown.map((s: any, i: number) => (
                    <div key={s.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '14px 16px',
                      borderBottom: i < breakdown.length - 1 ? '0.5px solid var(--border)' : 'none',
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
                          de {fmt(s.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'var(--powder)', borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '2px' }}>
                      {breakdown.length} aulas
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                      Receita {fmt(breakdown.reduce((s: number, r: any) => s + (r.price ?? 0), 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '2px' }}>
                      Total comissão
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
