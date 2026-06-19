'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Receivable = {
  id: string
  student_name: string
  activity_name: string
  instructor: string
  session_date: string
  price: number
  currency: string
  price_original: number | null
  days_overdue: number
  at_risk: boolean
}

function fmt(n: number, currency = 'BRL') {
  if (currency === 'EUR') return `€ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
  if (currency === 'USD') return `$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function ReceivablesView({ lang = 'pt' }: { lang?: 'pt' | 'en' }) {
  const router = useRouter()
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [total,       setTotal]       = useState(0)
  const [atRiskTotal, setAtRiskTotal] = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [marking,     setMarking]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res  = await fetch('/api/owner/receivables')
    const data = await res.json()
    setReceivables(data.receivables ?? [])
    setTotal(data.total ?? 0)
    setAtRiskTotal(data.at_risk_total ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markReceived(sessionId: string) {
    setMarking(sessionId)
    await fetch('/api/owner/receivables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
    setMarking(null)
    load()
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{
        padding: '32px', textAlign: 'center',
        fontSize: '13px', color: 'var(--mist)',
      }}>
        {lang === 'pt' ? 'Carregando...' : 'Loading...'}
      </div>
    )
  }

  if (receivables.length === 0) {
    return (
      <div style={{
        background: '#E0F8F5',
        border: '0.5px solid var(--glacial)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>✓</span>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--glacial-dark)',
          }}>
            {lang === 'pt'
              ? 'Nenhum valor a receber'
              : 'No outstanding receivables'
            }
          </div>
          <div style={{
            fontSize: '12px', color: 'var(--glacial-dark)',
            opacity: 0.7,
          }}>
            {lang === 'pt'
              ? 'Todos os pagamentos foram recebidos.'
              : 'All payments have been collected.'
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: '#FEF3C7',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#92400E', marginBottom: '6px',
          }}>
            {lang === 'pt' ? 'Total a receber' : 'Total receivable'}
          </div>
          <div style={{
            fontSize: '24px', fontWeight: '700',
            color: '#92400E',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(total)}
          </div>
          <div style={{ fontSize: '11px', color: '#92400E', opacity: 0.7, marginTop: '3px' }}>
            {receivables.length} {lang === 'pt' ? 'aula' : 'lesson'}{receivables.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{
          background: atRiskTotal > 0 ? '#FEE2E2' : 'var(--powder)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: atRiskTotal > 0 ? '#991B1B' : 'var(--mist)',
            marginBottom: '6px',
          }}>
            {lang === 'pt' ? 'Mais de 7 dias' : 'Over 7 days'}
          </div>
          <div style={{
            fontSize: '24px', fontWeight: '700',
            color: atRiskTotal > 0 ? '#991B1B' : 'var(--mist)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(atRiskTotal)}
          </div>
          <div style={{
            fontSize: '11px',
            color: atRiskTotal > 0 ? '#991B1B' : 'var(--mist)',
            opacity: 0.7, marginTop: '3px',
          }}>
            {lang === 'pt' ? 'risco de não receber' : 'at risk of non-payment'}
          </div>
        </div>
      </div>

      {/* Receivables list */}
      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--powder)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)',
          }}>
            {lang === 'pt' ? 'A receber' : 'Receivables'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--mist)' }}>
            {lang === 'pt' ? 'ordenado por data' : 'sorted by date'}
          </span>
        </div>

        {receivables.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: 'flex', alignItems: 'center',
              gap: '14px', padding: '14px 20px',
              borderBottom: i < receivables.length - 1
                ? '0.5px solid var(--border)' : 'none',
              background: r.at_risk ? '#FFFAF9' : '#fff',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: r.at_risk ? '#FEE2E2' : '#FEF3C7',
              color: r.at_risk ? '#991B1B' : '#92400E',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px', fontWeight: '700',
              flexShrink: 0,
            }}>
              {r.student_name.split(' ')
                .slice(0, 2)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px', fontWeight: '500',
                color: 'var(--slate)', marginBottom: '2px',
              }}>
                {r.student_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                {r.activity_name}
                {' · '}
                {new Date(r.session_date).toLocaleDateString(
                  lang === 'pt' ? 'pt-BR' : 'en-US',
                  { day: '2-digit', month: 'short' }
                )}
                {r.at_risk && (
                  <span style={{
                    marginLeft: '8px',
                    color: '#DC2626',
                    fontWeight: '500',
                    fontSize: '11px',
                  }}>
                    ⚠ {r.days_overdue}d
                  </span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div style={{
              textAlign: 'right', flexShrink: 0,
            }}>
              <div style={{
                fontSize: '16px', fontWeight: '600',
                color: r.at_risk ? '#991B1B' : '#92400E',
                fontVariantNumeric: 'tabular-nums',
                marginBottom: '6px',
              }}>
                {r.price_original && r.currency !== 'BRL'
                  ? fmt(r.price_original, r.currency)
                  : fmt(r.price)
                }
              </div>
              <button
                onClick={() => markReceived(r.id)}
                disabled={marking === r.id}
                style={{
                  padding: '5px 14px',
                  background: marking === r.id
                    ? 'var(--border)' : 'var(--glacial)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '99px',
                  fontSize: '11px', fontWeight: '500',
                  cursor: marking === r.id ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {marking === r.id
                  ? '...'
                  : lang === 'pt' ? '✓ Recebido' : '✓ Collected'
                }
              </button>
            </div>
          </div>
        ))}

        {/* Footer total */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--powder)',
          borderTop: '0.5px solid var(--border)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: '500',
            color: 'var(--mist)',
          }}>
            {lang === 'pt' ? 'Total em aberto' : 'Total outstanding'}
          </span>
          <span style={{
            fontSize: '18px', fontWeight: '700',
            color: '#92400E',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
