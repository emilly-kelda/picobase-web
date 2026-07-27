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
}

type GroupRow = { key: string; label: string; lessons: number; revenue: number; commissions: number; net: number }
type GroupBy = 'month' | 'instructor' | 'sport'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(n)
}

function fmtEUR(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(n)
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function groupRows(
  monthly: MonthData[],
  instructors: InstructorData[],
  sports: SportData[],
  groupBy: GroupBy
): GroupRow[] {
  if (groupBy === 'instructor') {
    return instructors.map(i => ({
      key: i.id, label: i.name, lessons: i.lessons,
      revenue: i.revenue, commissions: i.commission, net: i.net,
    }))
  }
  if (groupBy === 'sport') {
    return sports.map(s => ({
      key: s.sport, label: s.sport, lessons: s.lessons,
      revenue: s.revenue, commissions: s.commissions, net: s.net,
    }))
  }
  return monthly.map(m => ({
    key: m.month, label: fmtMonth(m.month), lessons: m.lessons,
    revenue: m.revenue, commissions: m.commissions, net: m.net,
  }))
}

const GROUP_LABELS: Record<GroupBy, string> = {
  month: 'Mês', instructor: 'Instrutor', sport: 'Modalidade',
}

/** Catmull-Rom → cubic Bézier, tension 1/6 — the standard construction for
 *  a smooth curve that actually passes through every point (not just an
 *  approximation), which is what the monthly revenue trend line needs:
 *  each control point IS a real month's figure. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

/** Bar with square bottom corners (sits flush on the chart's baseline) and
 *  rounded top ones — an SVG <rect> only takes one uniform `rx` for all 4
 *  corners, so a top-only radius needs an explicit path. h <= 0 (a month
 *  with literally 0 revenue) draws nothing rather than a degenerate rect. */
function roundedTopRectPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  if (rr <= 0) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`
  return `M ${x} ${y + rr}
    A ${rr} ${rr} 0 0 1 ${x + rr} ${y}
    H ${x + w - rr}
    A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}
    V ${y + h}
    H ${x} Z`
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

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid var(--border)',
  borderRadius: '12px',
  padding: '18px 20px',
}

const cardLabelStyle: React.CSSProperties = {
  fontSize: '10px', fontWeight: '600',
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--mist)', marginBottom: '8px',
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
  } | null>(null)
  const [tab, setTab] = useState<'faturamento' | 'modalidade' | 'instructors' | 'partners' | 'payments'>('faturamento')
  const [groupBy, setGroupBy] = useState<GroupBy>('month')
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
  const totalNet          = data.monthly.reduce((s, m) => s + m.net, 0)
  const totalLessons     = data.monthly.reduce((s, m) => s + m.lessons, 0)
  // Informational only, same as Custos' "Lucro após custos operacionais" —
  // multiplies the monthly rate by how many months this report actually
  // covers (data.monthly.length), not a flat one-month subtraction, since
  // this table can span a whole season/year instead of a single month.
  const netAfterOperationalCosts = totalNet - (data.monthlyCostTotal * data.monthly.length)
  const maxRevenue       = Math.max(...data.monthly.map(m => m.revenue), 1)
  const maxSportRevenue  = Math.max(...data.sports.map(s => s.revenue), 1)

  const rows = groupRows(data.monthly, data.instructors, data.sports, groupBy)

  // SVG chart geometry for the Faturamento tab — one coordinate space (a
  // 0..100 x 0..60 viewBox) so the stacked bars and the smooth revenue
  // trend line agree on exactly where each month sits, instead of trying
  // to eyeball an SVG overlay on top of separately-positioned flex divs.
  const CHART_BASE_Y  = 54
  const CHART_TOP_Y   = 6
  const CHART_USABLE_H = CHART_BASE_Y - CHART_TOP_Y
  const chartCols = Math.max(1, data.monthly.length)
  const barPoints = data.monthly.map((m, i) => {
    const colW    = 100 / chartCols
    const barW    = colW * 0.55
    const xCenter = i * colW + colW / 2
    const revH    = maxRevenue > 0 ? (m.revenue / maxRevenue) * CHART_USABLE_H : 0
    const commH   = maxRevenue > 0 ? (m.commissions / maxRevenue) * CHART_USABLE_H : 0
    const netH    = Math.max(0, revH - commH)
    return {
      month: m.month, xCenter, barX: xCenter - barW / 2, barW,
      commY: CHART_BASE_Y - commH, commH,
      netY:  CHART_BASE_Y - revH,  netH,
      lineY: CHART_BASE_Y - revH,
    }
  })
  const revenueTrendPath = smoothPath(barPoints.map(p => ({ x: p.xCenter, y: p.lineY })))

  const metricCards: { label: string; value: string; color: string; sub?: string }[] = [
    { label: 'Receita total',     value: fmt(totalRevenue),        color: 'var(--slate)' },
    { label: 'Comissões pagas',   value: fmt(totalCommissions),    color: '#DC2626'      },
    { label: 'Lucro líquido',     value: fmt(totalNet),            color: '#007868'      },
    {
      label: 'Lucro após custos operacionais',
      value: fmt(netAfterOperationalCosts),
      color: netAfterOperationalCosts < 0 ? '#DC2626' : '#047857',
      sub: data.monthlyCostTotal > 0 ? `${fmt(data.monthlyCostTotal)}/mês × ${data.monthly.length} meses` : undefined,
    },
    { label: 'Aulas confirmadas', value: totalLessons.toString(),  color: 'var(--slate)' },
    {
      label: 'Ticket médio',
      value: data.metrics.ticketMedioBRL != null ? fmt(data.metrics.ticketMedioBRL) : '—',
      color: 'var(--slate)',
      sub: data.metrics.ticketMedioEUR != null
        ? `${fmtEUR(data.metrics.ticketMedioEUR)} ticket médio (EUR)`
        : undefined,
    },
    {
      label: 'Taxa de ocupação',
      value: data.metrics.occupancyPct != null ? `${data.metrics.occupancyPct.toFixed(0)}%` : '—',
      color: 'var(--slate)',
      sub: data.metrics.occupancyPct != null
        ? `${data.metrics.occupancyHoursTaught.toFixed(0)}h de ${data.metrics.occupancyCapacityHours.toFixed(0)}h de capacidade`
        : 'Configure a capacidade em Equipe',
    },
    {
      label: 'Taxa de renovação',
      value: data.metrics.renewalRatePct != null ? `${data.metrics.renewalRatePct.toFixed(0)}%` : '—',
      color: 'var(--slate)',
      sub: data.metrics.renewalCompletions > 0
        ? `${data.metrics.renewalRenewed} de ${data.metrics.renewalCompletions} pacotes concluídos renovados`
        : undefined,
    },
    {
      // Passivo de Horas — hours already paid for on active packages but
      // not yet taught. A liability in the accounting sense: the school
      // owes these hours, not cash it can still call "profit" until
      // they're delivered (or the package lapses).
      label: 'Passivo de horas (pacotes ativos)',
      value: `${data.metrics.hoursLiability.toFixed(0)}h`,
      color: 'var(--slate)',
      sub: 'Horas vendidas ainda não agendadas ou consumidas',
    },
  ]

  const heroCards: { label: string; value: string; sub?: string }[] = [
    {
      label: 'Receita líquida', value: fmt(totalNet),
      // Realizado vs pendente right under the headline number — "receita"
      // on its own reads as cash in hand, which isn't true for whatever's
      // still sitting on a_receber sessions nobody's collected yet.
      sub: data.metrics.revenuePending > 0
        ? `${fmt(data.metrics.revenueRealized)} recebido · ${fmt(data.metrics.revenuePending)} pendente`
        : 'Tudo recebido, nada pendente',
    },
    { label: 'Horas na água',    value: `${data.metrics.occupancyHoursTaught.toFixed(0)}h` },
    { label: 'Taxa de ocupação', value: data.metrics.occupancyPct != null ? `${data.metrics.occupancyPct.toFixed(0)}%` : '—' },
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
          Visão geral · Todos os tempos
        </h1>
      </div>

      {/* Hero KPIs — the 3 numbers an owner actually needs before anything
          else: what's left after paying instructors, how much water time
          actually happened, and whether the team's capacity is being used.
          Everything below (the full metric grid, tabs, tables) is detail
          in support of these three, not competing with them for attention. */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px', marginBottom: '20px',
      }}>
        {heroCards.map(h => (
          <div key={h.label} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
            padding: '22px 24px',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px',
            }}>
              {h.label}
            </div>
            <div style={{
              fontSize: '34px', fontWeight: '700', color: 'var(--slate)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>
              {h.value}
            </div>
            {h.sub && (
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '8px' }}>
                {h.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Everything else — supporting detail below the hero row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px', marginBottom: '32px',
      }}>
        {metricCards.map(metric => (
          <div key={metric.label} style={cardStyle}>
            <div style={cardLabelStyle}>{metric.label}</div>
            <div style={{
              fontSize: '22px', fontWeight: '700',
              color: metric.color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {metric.value}
            </div>
            {metric.sub && (
              <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '6px' }}>
                {metric.sub}
              </div>
            )}
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
          { key: 'faturamento', label: 'Faturamento vs. Comissões' },
          { key: 'modalidade',  label: 'Desempenho por Modalidade' },
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

      {/* TAB: Faturamento vs. Comissões */}
      {tab === 'faturamento' && (
        <div>
          {/* Stacked bar chart */}
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
              <EmptyState text="Nenhum dado disponível ainda. Assim que houver aulas confirmadas, a receita mensal aparece aqui." />
            ) : (
              <>
                <svg viewBox={`0 0 100 ${CHART_BASE_Y + 2}`} preserveAspectRatio="none" style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                  <line x1={0} y1={CHART_BASE_Y} x2={100} y2={CHART_BASE_Y} stroke="var(--border)" strokeWidth={0.3} />
                  {barPoints.map(p => (
                    <g key={p.month}>
                      <title>{`${fmtMonth(p.month)}: ${fmt(data.monthly.find(m => m.month === p.month)!.revenue)} receita`}</title>
                      {/* Commission portion — flat-bottom, sits flush on the
                          baseline; only the net portion above it (or this
                          one, if net is 0) gets the rounded top. */}
                      <path d={p.netH > 0.01
                        ? `M ${p.barX} ${p.commY} H ${p.barX + p.barW} V ${CHART_BASE_Y} H ${p.barX} Z`
                        : roundedTopRectPath(p.barX, p.commY, p.barW, p.commH, 1.2)}
                        fill="var(--signal-light)" />
                      {/* Net portion */}
                      <path d={roundedTopRectPath(p.barX, p.netY, p.barW, p.netH, 1.2)} fill="var(--glacial)" opacity={0.85} />
                    </g>
                  ))}
                  {/* Smooth revenue trend — same coordinate space as the
                      bars above, so it actually traces their tops. */}
                  <path d={revenueTrendPath} fill="none" stroke="var(--glacial-dark)" strokeWidth={0.6} strokeLinecap="round" />
                  {barPoints.map(p => (
                    <circle key={`dot-${p.month}`} cx={p.xCenter} cy={p.lineY} r={0.9} fill="var(--glacial-dark)" />
                  ))}
                </svg>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {data.monthly.map(m => (
                    <div key={m.month} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--mist)' }}>
                      {m.month.slice(5)}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Legend */}
            <div style={{
              display: 'flex', gap: '20px',
              marginTop: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist)' }}>
                <div style={{ width: '12px', height: '2px', background: 'var(--glacial-dark)', borderRadius: '2px' }} />
                Receita (tendência)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist)' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--glacial)', borderRadius: '3px', opacity: 0.85 }} />
                Lucro líquido
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mist)' }}>
                <div style={{ width: '12px', height: '12px', background: 'var(--signal-light)', borderRadius: '3px' }} />
                Comissões
              </div>
            </div>
          </div>

          {/* Group-by control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--mist)' }}>Agrupar por</span>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupBy)}
              style={{
                padding: '7px 12px',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px', color: 'var(--slate)',
                background: '#fff', cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="month">Mês</option>
              <option value="instructor">Instrutor</option>
              <option value="sport">Modalidade</option>
            </select>
          </div>

          {/* Grouped table */}
          <div style={tableWrapStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  <th style={thStyle('left')}>{GROUP_LABELS[groupBy]}</th>
                  <th style={thStyle('right')}>Aulas</th>
                  <th style={thStyle('right')}>Receita</th>
                  <th style={thStyle('right')}>Comissões</th>
                  <th style={thStyle('right')}>Lucro líquido</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key} style={{
                    borderBottom: i < rows.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {r.label}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                      {r.lessons}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(r.revenue)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      − {fmt(r.commissions)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '600', color: '#007868', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(r.net)}
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

      {/* TAB: Desempenho por Modalidade */}
      {tab === 'modalidade' && (
        <div>
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
              Receita por modalidade
            </div>

            {data.sports.length === 0 ? (
              <EmptyState text="Nenhum dado disponível ainda. O desempenho por modalidade aparece assim que houver aulas confirmadas." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.sports.map(sp => {
                  const pct = (sp.revenue / maxSportRevenue) * 100
                  return (
                    <div key={sp.sport} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '130px', flexShrink: 0, fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                        {sp.sport}
                      </div>
                      <div style={{
                        flex: 1, height: '20px',
                        background: 'var(--powder)', borderRadius: '99px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: 'var(--glacial-dark)', borderRadius: '99px',
                        }} />
                      </div>
                      <div style={{
                        width: '110px', flexShrink: 0, textAlign: 'right',
                        fontSize: '13px', fontWeight: '600', color: 'var(--slate)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmt(sp.revenue)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={tableWrapStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--powder)' }}>
                  <th style={thStyle('left')}>Modalidade</th>
                  <th style={thStyle('right')}>Aulas</th>
                  <th style={thStyle('right')}>Receita</th>
                  <th style={thStyle('right')}>Comissões</th>
                  <th style={thStyle('right')}>Lucro líquido</th>
                </tr>
              </thead>
              <tbody>
                {data.sports.map((sp, i) => (
                  <tr key={sp.sport} style={{
                    borderBottom: i < data.sports.length - 1
                      ? '0.5px solid var(--border)' : 'none',
                  }}>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)' }}>
                      {sp.sport}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--mist)', textAlign: 'right' }}>
                      {sp.lessons}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--slate)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(sp.revenue)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#DC2626', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      − {fmt(sp.commissions)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: '600', color: '#007868', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(sp.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
