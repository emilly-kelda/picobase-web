'use client'

import { useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

type MonthData = { month: string; revenue: number; commissions: number; net: number; lessons: number; hours: number }
type ModalityMonth = { sport: string; months: Record<string, number> }
type SportData = { sport: string; lessons: number; revenue: number; commissions: number; net: number }

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function fmtCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(Math.round(n))
}

const kpiCardStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '0.5px solid var(--border)',
  borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
  padding: '22px 24px',
}
const kpiLabelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '10px',
}
const kpiValueStyle: React.CSSProperties = {
  fontSize: '26px', fontWeight: '700', color: 'var(--slate)',
  letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
}
const tableWrapStyle: React.CSSProperties = {
  background: '#fff', border: '0.5px solid var(--border)',
  borderRadius: '16px', overflow: 'hidden',
}
const thStyle = (align: 'left' | 'right'): React.CSSProperties => ({
  padding: '10px 16px', textAlign: align,
  fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--mist)',
  borderBottom: '0.5px solid var(--border)',
})

/** Sazonalidade tab — month-by-month lesson/revenue trend and a sport ×
 *  month demand heatmap, layered on top of the same `monthly`/
 *  `modalityByMonth` data the rest of this page already fetches (see
 *  reportRepository.ts). The only genuinely new backend work was adding
 *  `hours` to the existing monthly aggregation and a sport × month pass
 *  (modalityByMonth) — everything here (year filter, peak month, season
 *  window %) is derived client-side from that. */
export default function SeasonalityTab({
  monthly,
  modalityByMonth,
  highSeasonStartMonth,
  highSeasonEndMonth,
  totalCapacityPerWeek,
  sports,
}: {
  monthly: MonthData[]
  modalityByMonth: ModalityMonth[]
  highSeasonStartMonth: number | null
  highSeasonEndMonth: number | null
  totalCapacityPerWeek: number
  sports: SportData[]
}) {
  const years = useMemo(() => {
    const set = new Set(monthly.map(m => Number(m.month.slice(0, 4))))
    return Array.from(set).sort((a, b) => b - a)
  }, [monthly])

  const [year, setYear] = useState(years[0] ?? new Date().getFullYear())

  const yearMonths = monthly.filter(m => Number(m.month.slice(0, 4)) === year)
  const prevYearMonths = monthly.filter(m => Number(m.month.slice(0, 4)) === year - 1)

  const totalLessons = yearMonths.reduce((s, m) => s + m.lessons, 0)
  const prevTotalLessons = prevYearMonths.reduce((s, m) => s + m.lessons, 0)
  const lessonsChangePct = prevTotalLessons > 0
    ? ((totalLessons - prevTotalLessons) / prevTotalLessons) * 100
    : null

  const totalRevenue = yearMonths.reduce((s, m) => s + m.revenue, 0)
  const ticketMedioPorAula = totalLessons > 0 ? totalRevenue / totalLessons : 0

  const peak = yearMonths.reduce<MonthData | null>((best, m) =>
    !best || m.lessons > best.lessons ? m : best, null)
  const peakMonthLabel = peak ? MONTH_LABELS[Number(peak.month.slice(5, 7)) - 1] : '—'

  const yearHours = yearMonths.reduce((s, m) => s + m.hours, 0)
  const avgOccupancyPct = totalCapacityPerWeek > 0
    ? (yearHours / (totalCapacityPerWeek * 52)) * 100
    : null

  const chartData = MONTH_LABELS.map((label, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    const m = yearMonths.find(row => row.month === key)
    return { month: label, Aulas: m?.lessons ?? 0, Receita: m?.revenue ?? 0 }
  })

  // Each sport's own row is normalized to its own peak month within the
  // selected year, not a global max — a quiet sport's seasonal pattern
  // would otherwise wash out to near-zero intensity everywhere next to a
  // much higher-volume one.
  const heatmapRows = modalityByMonth.map(row => {
    const values = Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return row.months[key] ?? 0
    })
    const max = Math.max(1, ...values)
    return { sport: row.sport, values, max }
  }).filter(row => row.values.some(v => v > 0))

  // Window can wrap year-end (e.g. Dez–Mar = months [12,1,2,3]).
  const seasonWindowMonths = (() => {
    if (!highSeasonStartMonth || !highSeasonEndMonth) return null
    const result: number[] = []
    let m = highSeasonStartMonth
    for (let i = 0; i < 12; i++) {
      result.push(m)
      if (m === highSeasonEndMonth) break
      m = m === 12 ? 1 : m + 1
    }
    return result
  })()
  const seasonWindowLabel = seasonWindowMonths
    ? `${MONTH_LABELS[highSeasonStartMonth! - 1]} — ${MONTH_LABELS[highSeasonEndMonth! - 1]}`
    : null
  const seasonWindowPct = seasonWindowMonths && totalLessons > 0
    ? (yearMonths
        .filter(m => seasonWindowMonths.includes(Number(m.month.slice(5, 7))))
        .reduce((s, m) => s + m.lessons, 0) / totalLessons) * 100
    : null

  const kpiCards = [
    {
      label: 'Aulas no ano',
      value: String(totalLessons),
      sub: lessonsChangePct !== null
        ? `${lessonsChangePct >= 0 ? '▲' : '▼'} ${Math.abs(lessonsChangePct).toFixed(0)}% vs. ${year - 1}`
        : `Sem dados de ${year - 1}`,
      subColor: lessonsChangePct !== null ? (lessonsChangePct >= 0 ? '#047857' : '#DC2626') : 'var(--mist)',
    },
    {
      label: 'Receita no ano',
      value: fmt(totalRevenue),
      sub: `Ticket médio: ${fmt(ticketMedioPorAula)}/aula`,
      subColor: 'var(--mist)',
    },
    {
      label: 'Mês de pico',
      value: peak ? peakMonthLabel : '—',
      sub: peak ? `${peak.lessons} aula${peak.lessons !== 1 ? 's' : ''}` : 'Sem dados no período',
      subColor: 'var(--mist)',
    },
    {
      label: 'Ocupação média',
      value: avgOccupancyPct !== null ? `${avgOccupancyPct.toFixed(0)}%` : '—',
      sub: avgOccupancyPct !== null ? 'Horas ministradas vs. capacidade' : 'Configure a capacidade da equipe',
      subColor: 'var(--mist)',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          style={{
            padding: '7px 12px', border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--slate)',
            background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
          }}
        >
          {(years.length > 0 ? years : [year]).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '20px',
      }}>
        {kpiCards.map(card => (
          <div key={card.label} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{card.label}</div>
            <div style={kpiValueStyle}>{card.value}</div>
            <div style={{ fontSize: '11px', color: card.subColor, marginTop: '8px' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Season summary banner */}
      {seasonWindowLabel && (
        <div style={{
          background: 'var(--glacial-light)', border: '0.5px solid var(--glacial)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--glacial-dark)', marginBottom: '4px' }}>
              Resumo da temporada
            </div>
            <div style={{ fontSize: '14px', color: 'var(--slate)' }}>
              Pico do ano: <strong>{seasonWindowLabel}</strong>
              {seasonWindowPct !== null && <> — {seasonWindowPct.toFixed(0)}% das aulas de {year}</>}
            </div>
          </div>
        </div>
      )}

      {/* Monthly lessons vs revenue chart */}
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: '16px', padding: '28px', marginBottom: '20px',
      }}>
        <div style={{
          fontSize: '12px', fontWeight: '600', color: 'var(--mist)',
          marginBottom: '20px', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Aulas e receita por mês — {year}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--mist)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="lessons" tick={{ fontSize: 11, fill: 'var(--mist)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11, fill: 'var(--mist)' }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
            <Tooltip
              formatter={(value, name) => name === 'Receita' ? fmt(Number(value)) : value}
              contentStyle={{ borderRadius: 8, border: '0.5px solid var(--border)', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="lessons" dataKey="Aulas" fill="var(--glacial)" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            <Line yAxisId="revenue" type="monotone" dataKey="Receita" stroke="var(--glacial-dark)" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Modality occupancy heatmap */}
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: '16px', padding: '28px',
      }}>
        <div style={{
          fontSize: '12px', fontWeight: '600', color: 'var(--mist)',
          marginBottom: '20px', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Demanda por modalidade — {year}
        </div>
        {heatmapRows.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '13px', color: 'var(--mist)' }}>
            Nenhuma aula registrada em {year}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '11px', color: 'var(--mist)', fontWeight: '500', padding: '0 8px 6px 0' }}>
                    Modalidade
                  </th>
                  {MONTH_INITIALS.map((m, i) => (
                    <th key={i} style={{ fontSize: '11px', color: 'var(--mist)', fontWeight: '500', width: '32px' }}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapRows.map(row => (
                  <tr key={row.sport}>
                    <td style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: '500', whiteSpace: 'nowrap', padding: '0 8px 0 0' }}>
                      {row.sport}
                    </td>
                    {row.values.map((v, i) => {
                      const intensity = v / row.max
                      return (
                        <td key={i} style={{ textAlign: 'center' }}>
                          <div
                            title={`${v} aula${v !== 1 ? 's' : ''}`}
                            style={{
                              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: v === 0 ? 'var(--powder)' : `rgba(0, 121, 104, ${0.15 + intensity * 0.7})`,
                              color: intensity > 0.55 ? '#fff' : 'var(--slate)',
                              fontSize: '10px', fontWeight: '600', fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {v > 0 ? v : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modality financial breakdown */}
      <div style={{ marginTop: '20px' }}>
        <div style={{
          fontSize: '12px', fontWeight: '600', color: 'var(--mist)',
          marginBottom: '12px', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Desempenho financeiro por modalidade
        </div>
        {sports.length === 0 ? (
          <div style={{
            background: '#fff', border: '0.5px solid var(--border)',
            borderRadius: '16px', padding: '48px 24px', textAlign: 'center',
            fontSize: '13px', color: 'var(--mist)',
          }}>
            Nenhum dado disponível ainda. O desempenho por modalidade aparece assim que houver aulas confirmadas.
          </div>
        ) : (
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
                {sports.map((sp, i) => (
                  <tr key={sp.sport} style={{
                    borderBottom: i < sports.length - 1
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
        )}
      </div>
    </div>
  )
}
