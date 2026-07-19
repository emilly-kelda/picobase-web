import { cookies } from 'next/headers'
import { getCosts, getKnownCategories, getMonthlyCostTotal } from '@/repositories/costRepository'
import { getRunwayData, getRunwayProjection } from '@/repositories/runwayRepository'
import CostsClient from './CostsClient'
import RunwayCalculator from '@/components/RunwayCalculator'
import RunwaySummary from '@/components/RunwaySummary'
import { formatCurrency } from '@/lib/currency'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number) {
  return formatCurrency(n, { decimals: 0 })
}

export default async function CostsPage() {
  const cookieStore = await cookies()
  const seasonId = cookieStore.get('active_season_id')?.value

  const [{ costs, total, pageSize }, knownCategories, monthlyCostTotal, runway, projection] = await Promise.all([
    getCosts(SCHOOL_ID, 0),
    getKnownCategories(SCHOOL_ID),
    getMonthlyCostTotal(SCHOOL_ID),
    getRunwayData(SCHOOL_ID, seasonId),
    getRunwayProjection(SCHOOL_ID),
  ])

  const totalPartnerCommissions = projection?.totalPartnerCommissions ?? 0
  const adjustedNetProfit = Math.max(0, ((runway as any).season_profit ?? 0) - totalPartnerCommissions)

  // Same fallback rule as Base Camp used to apply before this card moved
  // here: real itemized costs (this page's own list) take priority over the
  // season's manually-set burn_rate once any recurring entry exists, so the
  // two never disagree.
  const monthlyBurn  = monthlyCostTotal > 0 ? monthlyCostTotal : ((runway as any).burn_rate ?? 0)
  const runwayMonths = monthlyBurn > 0
    ? adjustedNetProfit / monthlyBurn
    : ((runway as any).winter_runway_months ?? 0)
  const gapToTarget  = Math.max(0, 6 * monthlyBurn - adjustedNetProfit)

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Custos
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Despesas fixas e variáveis da operação
        </p>
      </div>

      {monthlyCostTotal > 0 && (
        <div style={{
          display: 'inline-flex', flexDirection: 'column',
          background: '#fff', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <span style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '6px',
          }}>
            Custo operacional mensal
          </span>
          <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(monthlyCostTotal)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
            mensais + anuais/12 · alimenta o indicador de Custo operacional mensal no Base Camp
          </span>
        </div>
      )}

      <CostsClient
        initialCosts={costs}
        initialTotal={total}
        pageSize={pageSize}
        knownCategories={knownCategories}
      />

      {/* ── Reserva de Baixa Temporada ────────────────────────────────────
          Moved from Base Camp so the dashboard's Sala de Espera / Aulas
          Agendadas columns get the full height for counter operations —
          this is a financial deep-dive, not a walk-in workflow. */}
      <div style={{ marginTop: '40px', maxWidth: '420px' }}>
        <RunwaySummary
          runwayMonths={runwayMonths}
          seasonRevenue={(runway as any).season_revenue ?? 0}
          commissions={((runway as any).crew_commissions ?? 0) + totalPartnerCommissions}
          netProfit={adjustedNetProfit}
          monthlyBurn={monthlyBurn}
          gapToTarget={gapToTarget}
          projectedRunway={projection?.projectedRunway}
          daysLeft={projection?.daysLeft}
        />
      </div>

      {/* ── Simulador de Cenários / Baixa Temporada ──────────────────────
          The interactive sliders used to live on Base Camp — moved here so
          the dashboard stays a read-only summary of real numbers, and
          "what if" scenario-testing lives with the rest of cost planning. */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
            Simulador de Cenários / Baixa Temporada
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            Ajuste os valores para simular hipóteses — os números acima são os reais.
          </p>
        </div>
        <RunwayCalculator
          seasonProfit={adjustedNetProfit}
          burnRate={monthlyCostTotal}
          daysLeft={projection?.daysLeft}
          projectedRunway={projection?.projectedRunway}
          gap={projection?.gap}
        />
      </div>
    </div>
  )
}
