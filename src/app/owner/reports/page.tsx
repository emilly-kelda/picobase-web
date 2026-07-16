'use client'

import { useEffect, useState } from 'react'

type MonthData = {
  month: string
  revenue: number
  commissions: number
  net: number
  lessons: number
}

type InstructorData = {
  id: string
  name: string
  lessons: number
  revenue: number
  commission: number
}

type PartnerData = {
  id: string
  name: string
  type: string
  referrals: number
  revenue: number
  commission: number
}

type PaymentData = Record<string, { count: number; total: number }>

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(n)
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function ReportsPage() {
  const [data, setData] = useState<{
    monthly:     MonthData[]
    instructors: InstructorData[]
    partners:    PartnerData[]
    payments:    PaymentData
  } | null>(null)
  const [tab, setTab] = useState<'revenue' | 'instructors' | 'partners' | 'payments'>('revenue')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/owner/reports')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{
      padding: '64px', textAlign: 'center',
      fontSize: '13px', color: 'var(--mist)',
    }}>
      Carregando relatórios...
    </div>
  )

  if (!data) return null

  const totalRevenue     = data.monthly.reduce((s, m) => s + m.revenue, 0)
  const totalCommissions = data.monthly.reduce((s, m) => s + m.commissions, 0)
  const totalNet         = data.monthly.reduce((s, m) => s + m.net, 0)
  const totalLessons     = data.monthly.reduce((s, m) => s + m.lessons, 0)
  const maxRevenue       = Math.max(...data.monthly.map(m => m.revenue), 1)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontSize: '10px', fontWeight: '600',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--mist)', marginBottom: '8px',
        }}>
          Relatórios financeiros
        </div>
        <h1 style={{
          fontSize: '28px', fontWeight: '800',
          color: 'var(--slate)', letterSpacing: '-0.02em',
        }}>
          Visão geral · Todos os tempos
        </h1>
      </div>

      {/* Summary metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '32px',
      }}>
        {[
          { label: 'Receita total',    value: fmt(totalRevenue),     color: 'var(--slate)' },
          { label: 'Comissões pagas',  value: fmt(totalCommissions), color: '#DC2626'      },
          { label: 'Lucro líquido',    value: fmt(totalNet),         color: '#007868'      },
          { label: 'Aulas confirmadas', value: totalLessons.toString(), color: 'var(--slate)' },
        ].map(metric => (
          <div key={metric.label} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: '12px',
            padding: '18px 20px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '8px',
            }}>
              {metric.label}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: '700',
              color: metric.color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '0.5px solid var(--border)',
        marginBottom: '28px',
      }}>
        {[
          { key: 'revenue',      label: 'Receita mensal' },
          { key: 'instructors',  label: 'Instrutores'    },
          { key: 'partners',     label: 'Parceiros'      },
          { key: 'payments',     label: 'Pagamentos'     },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: tab === t.key
                ? '2px solid var(--glacial)' : '2px solid transparent',
              color: tab === t.key ? 'var(--slate)' : 'var(--mist)',
              fontSize: '13px',
              fontWeight: tab === t.key ? '600' : '400',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '-0.5px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Revenue by month */}
      {tab === 'revenue' && (
        <div>
          {/* Bar chart */}
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '20px',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: '600',
              color: 'var(--mist)', marginBottom: '24px',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Receita por mês
            </div>

            {data.monthly.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mist)', fontSize: '13px' }}>
                Nenhum dado disponível ainda.
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '180px',
                paddingBottom: '32px',
                position: 'relative',
                borderBottom: '0.5px solid var(--border)',
              }}>
                {data.monthly.map(m => {
                  const heightPct = (m.revenue / maxRevenue) * 100
                  const netPct    = (m.net / maxRevenue) * 100
                  return (
                    <div
                      key={m.month}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        position: 'relative',
                      }}
                      title={`${fmtMonth(m.month)}: ${fmt(m.revenue)} receita · ${fmt(m.net)} líquido`}
                    >
                      {/* Revenue bar */}
                      <div style={{
                        width: '100%',
                        position: 'relative',
                        height: `${heightPct}%`,
                        minHeight: m.revenue > 0 ? '4px' : '0',
                      }}>
                        {/* Commission portion (red overlay) */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0,
                          height: `${heightPct > 0 ? ((m.commissions / m.revenue) * 100) : 0}%`,
                          background: '#FEE2E2',
                          borderRadius: '4px 4px 0 0',
                        }} />
                        {/* Net portion (teal) */}
                        <div style={{
                          position: 'absolute',
                          bottom: `${heightPct > 0 ? ((m.commissions / m.revenue) * 100) : 0}%`,
                          left: 0, right: 0,
                          height: `${heightPct > 0 ? (netPct / heightPct) * 100 : 0}%`,
                          background: 'var(--glacial)',
                          borderRadius: '4px 4px 0 0',
                          opacity: 0.8,
                        }} />
                      </div>
                      {/* Month label */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-28px',
                        fontSize: '10px',
                        color: 'var(--mist)',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}>
                        {m.month.slice(5)} {/* MM */}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div style={{
              display: 'flex', gap: '20px',
              marginTop: '40px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist)' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--glacial)', borderRadius: '3px', opacity: 0.8 }} />
                Lucro líquido
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist)' }}>
                <div style={{ width: '12px', height: '12px', background: '#FEE2E2', borderRadius: '3px' }} />
                Comissões
              </div>
            </div>
          </div>

          {/* Monthly table */}
          <div style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  {['Mês', 'Aulas', 'Receita', 'Comissões', 'Lucro líquido'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '10px', fontWeight: '600',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--mist)',
                      borderBottom: '0.5px solid var(--border)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m, i) => (
                  <tr key={m.month} style={{
                    borderBottom: i < data.monthly.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {fmtMonth(m.month)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                      {m.lessons}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(m.revenue)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      − {fmt(m.commissions)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '600', color: '#007868', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(m.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--powder)', borderTop: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '13px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--slate)', textAlign: 'right' }}>{totalLessons}</td>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalRevenue)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>− {fmt(totalCommissions)}</td>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: '#007868', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalNet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Instructors */}
      {tab === 'instructors' && (
        <div style={{
          background: '#fff',
          border: '0.5px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--powder)' }}>
                {['Instrutor', 'Aulas', 'Receita gerada', 'Comissão total', '% do total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: i === 0 ? 'left' : 'right',
                    fontSize: '10px', fontWeight: '600',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--mist)',
                    borderBottom: '0.5px solid var(--border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.instructors.map((inst, i) => (
                <tr key={inst.id} style={{
                  borderBottom: i < data.instructors.length - 1
                    ? '0.5px solid var(--border)' : 'none',
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {inst.name}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                    {inst.lessons}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(inst.revenue)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(inst.commission)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <div style={{
                        width: '60px', height: '4px',
                        background: 'var(--border)',
                        borderRadius: '99px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${totalCommissions > 0 ? (inst.commission / totalCommissions) * 100 : 0}%`,
                          background: '#DC2626',
                          borderRadius: '99px',
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--mist)', width: '36px', textAlign: 'right' }}>
                        {totalCommissions > 0
                          ? `${((inst.commission / totalCommissions) * 100).toFixed(0)}%`
                          : '—'
                        }
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--powder)', borderTop: '0.5px solid var(--border)' }}>
                <td style={{ padding: '13px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--mist)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</td>
                <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '700', color: 'var(--slate)', textAlign: 'right' }}>
                  {data.instructors.reduce((s, i) => s + i.lessons, 0)}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(data.instructors.reduce((s, i) => s + i.revenue, 0))}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: '700', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(totalCommissions)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB: Partners */}
      {tab === 'partners' && (
        <div style={{
          background: '#fff',
          border: '0.5px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {data.partners.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
              Nenhuma indicação de parceiro registrada ainda.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  {['Parceiro', 'Indicações', 'Receita gerada', 'Comissão paga', 'ROI'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: '10px', fontWeight: '600',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--mist)',
                      borderBottom: '0.5px solid var(--border)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.partners.map((p, i) => {
                  const roi = p.commission > 0
                    ? ((p.revenue - p.commission) / p.commission) * 100
                    : null
                  const icon = p.type === 'hotel' ? '🏨'
                    : p.type === 'agency' ? '✈' : '🤝'
                  return (
                    <tr key={p.id} style={{
                      borderBottom: i < data.partners.length - 1
                        ? '0.5px solid var(--border)' : 'none',
                    }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{icon}</span>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                        {p.referrals}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(p.revenue)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(p.commission)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {roi !== null ? (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '99px',
                            background: roi >= 0 ? '#E0F8F5' : '#FEE2E2',
                            color: roi >= 0 ? '#007868' : '#DC2626',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB: Payment methods */}
      {tab === 'payments' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          {[
            { key: 'pix',       label: 'PIX',       icon: '⚡', color: '#007868', bg: '#E0F8F5' },
            { key: 'dinheiro',  label: 'Dinheiro',  icon: '💵', color: '#1A4B8A', bg: '#EEF3FC' },
            { key: 'cartao',    label: 'Cartão',    icon: '💳', color: '#4B1AA8', bg: '#EDE9FE' },
            { key: 'a_receber', label: 'A receber', icon: '⏳', color: '#92400E', bg: '#FEF3C7' },
          ].map(method => {
            const d = data.payments[method.key] ?? { count: 0, total: 0 }
            const totalPayments = Object.values(data.payments)
              .reduce((s, v) => s + v.total, 0)
            const pct = totalPayments > 0
              ? ((d.total / totalPayments) * 100).toFixed(1)
              : '0'
            return (
              <div key={method.key} style={{
                background: d.total > 0 ? method.bg : 'var(--powder)',
                border: '0.5px solid var(--border)',
                borderRadius: '16px',
                padding: '28px',
                opacity: d.total > 0 ? 1 : 0.4,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px', marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  <span style={{
                    fontSize: '14px', fontWeight: '600',
                    color: d.total > 0 ? method.color : 'var(--mist)',
                  }}>
                    {method.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: '800',
                  color: d.total > 0 ? method.color : 'var(--mist)',
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: '6px',
                }}>
                  {fmt(d.total)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
                  {d.count} aula{d.count !== 1 ? 's' : ''} · {pct}% do total
                </div>
                <div style={{
                  height: '4px', background: 'rgba(0,0,0,0.08)',
                  borderRadius: '99px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: method.color,
                    borderRadius: '99px',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
