'use client'

import { useEffect, useState } from 'react'
import SeasonalityTab from './SeasonalityTab'

type MonthData = {
  month: string
  revenue: number
  commissions: number
  net: number
  lessons: number
  hours: number
}

type ModalityMonth = { sport: string; months: Record<string, number> }

type InstructorData = {
  id: string
  name: string
  lessons: number
  revenue: number
  commission: number
  hours: number
  net: number
  // null when this instructor has no weekly_capacity_hours configured yet
  // (Equipe settings) — "no data" and "configured at zero" render
  // differently, same reasoning as Metrics.occupancyPct below.
  capacityHours: number | null
}

type SportData = {
  sport: string
  lessons: number
  revenue: number
  commissions: number
  net: number
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

type Metrics = {
  ticketMedioBRL: number | null
  ticketMedioEUR: number | null
  occupancyPct: number | null
  occupancyHoursTaught: number
  occupancyCapacityHours: number
  renewalRatePct: number | null
  renewalCompletions: number
  renewalRenewed: number
  hoursLiability: number
  revenueRealized: number
  revenuePending: number
  totalCapacityPerWeek: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(n)
}

/** Friendly centered placeholder for tabs/charts with nothing to show yet —
 *  replaces bare "Nenhum dado disponível" text in three places below. */
function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '10px', padding: '48px 24px', textAlign: 'center',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
      <div style={{ fontSize: '13px', color: 'var(--mist)', maxWidth: '260px', lineHeight: '1.5' }}>
        {text}
      </div>
    </div>
  )
}

const tableWrapStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: '16px',
  overflow: 'hidden',
}

const thStyle = (align: 'left' | 'right'): React.CSSProperties => ({
  padding: '10px 16px',
  textAlign: align,
  fontSize: '10px', fontWeight: '600',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--mist)',
  borderBottom: '0.5px solid var(--border)',
})

export default function ReportsPage() {
  const [data, setData] = useState<{
    monthly:     MonthData[]
    instructors: InstructorData[]
    sports:      SportData[]
    partners:    PartnerData[]
    payments:    PaymentData
    metrics:     Metrics
    monthlyCostTotal: number
    modalityByMonth: ModalityMonth[]
    highSeasonStartMonth: number | null
    highSeasonEndMonth: number | null
  } | null>(null)
  const [tab, setTab] = useState<'seasonality' | 'instructors' | 'partners' | 'payments'>('instructors')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/owner/reports')
      .then(async r => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body.error ?? 'Erro ao carregar relatórios.')
        setData(body)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{
      padding: '64px', textAlign: 'center',
      fontSize: '13px', color: 'var(--mist)',
    }}>
      Carregando relatórios...
    </div>
  )

  if (error) return (
    <div style={{
      padding: '64px', textAlign: 'center',
      fontSize: '13px', color: 'var(--mist)',
    }}>
      {error}
    </div>
  )

  if (!data) return null

  const totalRevenue     = data.monthly.reduce((s, m) => s + m.revenue, 0)
  const totalCommissions = data.monthly.reduce((s, m) => s + m.commissions, 0)
  const totalNet          = data.monthly.reduce((s, m) => s + m.net, 0)
  const totalLessons     = data.monthly.reduce((s, m) => s + m.lessons, 0)
  // Informational only, same as Custos' "Lucro após custos operacionais" —
  // multiplies the monthly rate by how many months this report actually
  // covers (data.monthly.length), not a flat one-month subtraction, since
  // this table can span a whole season/year instead of a single month.
  const netAfterOperationalCosts = totalNet - (data.monthlyCostTotal * data.monthly.length)

  // Was two separate card systems (a 3-card hero row + a 9-card grid right
  // below it) added in two different passes — Lucro líquido and Receita
  // líquida were both just fmt(totalNet) under different labels, and Taxa
  // de ocupação appeared in both, plus again per-instructor in the
  // Instrutores tab below. Down to exactly the 4 numbers an owner needs
  // before anything else, plus one consolidated DRE line for the
  // revenue -> commissions -> costs -> profit breakdown those 4 cards used
  // to need 4 more cards just to show the arithmetic behind. Taxa de
  // renovação (also dropped from here) is still visible per-package
  // completion in the Modalidade/Instrutores tabs, not lost entirely.
  const totalCosts = data.monthlyCostTotal * data.monthly.length
  const kpiCards: { label: string; value: string; color?: string; sub?: string }[] = [
    { label: 'Faturamento Bruto', value: fmt(totalRevenue), sub: 'Total recebido de vendas' },
    {
      label: 'Lucro Operacional Real',
      value: fmt(netAfterOperationalCosts),
      color: netAfterOperationalCosts < 0 ? '#DC2626' : '#047857',
      sub: 'Após comissões e custos fixos',
    },
    {
      label: 'Horas Ministradas',
      value: `${data.metrics.occupancyHoursTaught.toFixed(0)}h`,
      sub: `${totalLessons} aula${totalLessons !== 1 ? 's' : ''}`
        + (data.metrics.ticketMedioBRL != null ? ` · Ticket médio: ${fmt(data.metrics.ticketMedioBRL)}` : ''),
    },
    {
      // Hours already paid for on active packages but not yet taught — a
      // liability in the accounting sense: the school owes these hours,
      // not cash it can still call "profit" until they're delivered.
      label: 'Passivo de Horas',
      value: `${data.metrics.hoursLiability.toFixed(0)}h`,
      sub: 'Horas vendidas a realizar',
    },
  ]

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
          Visão geral
        </h1>
      </div>

      {/* Hero KPIs — the 4 numbers an owner actually needs before anything
          else: what came in, what's actually left after paying instructors
          and fixed costs, how much water time happened, and how many hours
          are still owed on active packages. Everything below (DRE strip,
          tabs, tables) is detail in support of these four. */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '12px',
      }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
            padding: '22px 24px',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px',
            }}>
              {k.label}
            </div>
            <div style={{
              fontSize: '28px', fontWeight: '700', color: k.color ?? 'var(--slate)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>
              {k.value}
            </div>
            {k.sub && (
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '8px' }}>
                {k.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DRE sintética — the arithmetic behind "Lucro Operacional Real"
          above, spelled out as one line instead of 4 separate cards a
          reader had to mentally subtract themselves. */}
      <div style={{
        display: 'flex', alignItems: 'stretch', flexWrap: 'wrap',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
        marginBottom: '32px', overflow: 'hidden',
      }}>
        {[
          { label: 'Receita Total', value: fmt(totalRevenue) },
          { label: 'Comissões',     value: `- ${fmt(totalCommissions)}` },
          { label: 'Custos Fixos',  value: `- ${fmt(totalCosts)}` },
          {
            label: 'Lucro Líquido',
            value: `= ${fmt(netAfterOperationalCosts)}`,
            color: netAfterOperationalCosts < 0 ? '#DC2626' : '#047857',
            emphasize: true,
          },
        ].map((seg, i) => (
          <div key={seg.label} style={{
            flex: '1 1 160px', padding: '16px 20px',
            borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
            background: (seg as any).emphasize ? 'var(--powder)' : 'transparent',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '6px',
            }}>
              {seg.label}
            </div>
            <div style={{
              fontSize: '16px', fontWeight: '700',
              color: (seg as any).color ?? 'var(--slate)',
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
            }}>
              {seg.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '0.5px solid var(--border)',
        marginBottom: '28px', flexWrap: 'wrap',
      }}>
        {[
          { key: 'seasonality', label: 'Sazonalidade'               },
          { key: 'instructors', label: 'Instrutores'                },
          { key: 'partners',    label: 'Parceiros'                  },
          { key: 'payments',    label: 'Pagamentos'                 },
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
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Sazonalidade */}
      {tab === 'seasonality' && (
        <SeasonalityTab
          monthly={data.monthly}
          modalityByMonth={data.modalityByMonth}
          highSeasonStartMonth={data.highSeasonStartMonth}
          highSeasonEndMonth={data.highSeasonEndMonth}
          totalCapacityPerWeek={data.metrics.totalCapacityPerWeek}
          sports={data.sports}
        />
      )}

      {/* TAB: Instructors */}
      {tab === 'instructors' && (
        <div style={tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--powder)' }}>
                {['Instrutor', 'Aulas', 'Receita gerada', 'Comissão total', '% do total', 'Ocupação'].map((h, i) => (
                  <th key={h} style={thStyle(i === 0 ? 'left' : 'right')}>
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
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {inst.capacityHours == null ? (
                      <span style={{ fontSize: '11px', color: 'var(--mist)' }}>Sem capacidade configurada</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <div style={{
                          width: '60px', height: '4px',
                          background: 'var(--border)',
                          borderRadius: '99px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${inst.capacityHours > 0 ? Math.min(100, (inst.hours / inst.capacityHours) * 100) : 0}%`,
                            background: 'var(--glacial-dark)',
                            borderRadius: '99px',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--mist)', width: '76px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {inst.hours.toFixed(0)}h / {inst.capacityHours.toFixed(0)}h
                        </span>
                      </div>
                    )}
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
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB: Partners */}
      {tab === 'partners' && (
        <div style={tableWrapStyle}>
          {data.partners.length === 0 ? (
            <EmptyState text="Nenhuma indicação de parceiro registrada ainda. Parcerias com hotéis e agências aparecem aqui assim que gerarem uma indicação." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  {['Parceiro', 'Indicações', 'Receita gerada', 'Comissão paga', 'ROI'].map((h, i) => (
                    <th key={h} style={thStyle(i === 0 ? 'left' : 'right')}>
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
            { key: 'cartao',    label: 'Cartão',    icon: '💳', color: '#0E7490', bg: '#ECFEFF' },
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
