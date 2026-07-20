import { formatCurrency } from '@/lib/currency'

type Payment = {
  id: string
  revenue_generated: number
  users: { name: string } | null
}

type Summary = {
  total: number
  totalPaid: number
  totalPending: number
}

function fmt(n: number | null | undefined) {
  return formatCurrency(n, { decimals: 2 })
}

/** "Participação na Receita" (per-instructor revenue bars) + "Resumo do
 *  Mês" (total revenue, commissions, margin, paid, pending) — moved here
 *  from Payments (PaymentsClient.tsx used to render these inline, gated
 *  on its own Instrutores/Parceiros tab toggle, which doesn't exist
 *  wherever this is used now). No hooks — everything shown is derived
 *  from `payments`/`summary` alone, so this works from a server component
 *  (Custos) or a client one (Payments) equally. */
export default function PaymentsSummaryCards({
  payments,
  summary,
}: {
  payments: Payment[]
  summary: Summary
}) {
  if (payments.length === 0) return null

  const totalRevenueGenerated = payments.reduce((s, p) => s + p.revenue_generated, 0)
  const marginAfterInstructors = totalRevenueGenerated > 0
    ? ((totalRevenueGenerated - summary.total) / totalRevenueGenerated) * 100
    : null
  const byRevenue = [...payments].sort((a, b) => b.revenue_generated - a.revenue_generated)
  const maxRevenue = byRevenue[0]?.revenue_generated ?? 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Participação na Receita */}
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '16px',
        }}>
          Participação na Receita
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {byRevenue.map(p => {
            const user = p.users as any
            const pct = maxRevenue > 0 ? (p.revenue_generated / maxRevenue) * 100 : 0
            return (
              <div key={p.id}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '12px', marginBottom: '4px',
                }}>
                  <span style={{ color: 'var(--slate)', fontWeight: '500' }}>{user?.name ?? '—'}</span>
                  <span style={{ color: 'var(--mist)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(p.revenue_generated)}
                  </span>
                </div>
                <div style={{
                  height: '6px', background: 'var(--powder)',
                  borderRadius: '99px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: 'var(--glacial)', borderRadius: '99px',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumo do Mês */}
      <div style={{
        background: '#fff', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--mist)', marginBottom: '16px',
        }}>
          Resumo do Mês
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Receita total gerada',   value: fmt(totalRevenueGenerated) },
            { label: 'Total comissões',        value: fmt(summary.total) },
            { label: 'Margem após instrutores', value: marginAfterInstructors != null ? `${marginAfterInstructors.toFixed(1)}%` : '—' },
            { label: 'Já pagos',               value: fmt(summary.totalPaid), color: '#2E7D32' },
            { label: 'Pendentes',              value: fmt(summary.totalPending), color: '#8A5E00' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '13px', paddingBottom: '10px',
              borderBottom: '0.5px solid var(--border)',
            }}>
              <span style={{ color: 'var(--mist)' }}>{row.label}</span>
              <span style={{
                fontWeight: '600', fontVariantNumeric: 'tabular-nums',
                color: row.color ?? 'var(--slate)',
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
