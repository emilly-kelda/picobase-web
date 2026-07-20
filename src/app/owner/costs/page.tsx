import { cookies } from 'next/headers'
import { getCosts, getKnownCategories, getMonthlyCostTotal } from '@/repositories/costRepository'
import { getRunwayData, getRunwayProjection } from '@/repositories/runwayRepository'
import { getPayments } from '@/repositories/crewRepository'
import CostsClient from './CostsClient'
import MonthPeriodSelect from './MonthPeriodSelect'
import RunwayCalculator from '@/components/RunwayCalculator'
import RunwaySummary from '@/components/RunwaySummary'
import PaymentsSummaryCards from '@/components/PaymentsSummaryCards'
import { formatCurrency } from '@/lib/currency'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number) {
  return formatCurrency(n, { decimals: 0 })
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const cookieStore = await cookies()
  const seasonId = cookieStore.get('active_season_id')?.value
  const { period } = await searchParams

  const [
    { costs, total, pageSize }, knownCategories, monthlyCostTotal, runway, projection,
    { payments, period: resolvedPeriod, summary: paymentsSummary },
  ] = await Promise.all([
    getCosts(SCHOOL_ID, 0),
    getKnownCategories(SCHOOL_ID),
    getMonthlyCostTotal(SCHOOL_ID),
    getRunwayData(SCHOOL_ID, seasonId),
    // Same seasonId as getRunwayData above — it used to always read the
    // most-recent-by-start_date season regardless of the active-season
    // cookie, so switching seasons here changed season_revenue/
    // crew_commissions without changing totalPartnerCommissions, mixing two
    // different "current season" windows in one card (see AUDITORIA_DASHBOARD.md).
    getRunwayProjection(SCHOOL_ID, seasonId),
    // Participação na Receita / Resumo do Mês (moved here from Payments) —
    // scoped by calendar month, not the season cookie above. payments has
    // no season-date-range concept, so this stays its own independent
    // period filter, same as it worked on /owner/payments.
    getPayments(SCHOOL_ID, period),
  ])

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  const normalizedPayments = payments.map(p => ({
    ...p,
    users: Array.isArray(p.users) ? (p.users[0] ?? null) : (p.users ?? null),
  }))

  const totalPartnerCommissions = projection?.totalPartnerCommissions ?? 0
  // Real figure, can be negative — this is what "Lucro líquido" displays.
  // runwayMonths/gapToTarget below use a floored-at-0 version instead (same
  // split as runwayRepository.getRunwayProjection's own
  // rawNetProfit/adjustedNetProfit): "-2 months of runway" isn't a
  // meaningful number, but clamping the number shown as net profit hid a
  // real loss behind "R$ 0,00".
  const rawNetProfit = ((runway as any).season_profit ?? 0) - totalPartnerCommissions
  const adjustedNetProfit = Math.max(0, rawNetProfit)

  // Same fallback rule as Spot used to apply before this card moved
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
      <style>{`
        .costs-runway-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .costs-runway-grid { grid-template-columns: 1fr; }
        }
      `}</style>

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
            mensais + anuais/12 · alimenta o indicador de Custo operacional mensal no Spot
          </span>
        </div>
      )}

      <CostsClient
        initialCosts={costs}
        initialTotal={total}
        pageSize={pageSize}
        knownCategories={knownCategories}
      />

      {/* ── Participação na Receita + Resumo do Mês ───────────────────────
          Moved here from /owner/payments — same underlying data (getPayments),
          same calendar-month period picker (independent of the season
          cookie the rest of this page uses; payments has no season-range
          concept), just relocated next to the rest of the school's cost
          picture instead of living on the payout-approval page. */}
      <div style={{ marginTop: '40px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
              Participação na Receita &amp; Resumo do Mês
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
              Comissões de instrutores por período — mesmo cálculo de /owner/payments.
            </p>
          </div>
          <MonthPeriodSelect period={resolvedPeriod} monthOptions={monthOptions} />
        </div>
        <PaymentsSummaryCards payments={normalizedPayments as any} summary={paymentsSummary} />
      </div>

      {/* ── Reserva de Baixa Temporada + Simulador de Cenários ────────────
          Side by side instead of stacked full-width rows — the blue card
          (real numbers, moved from Spot so Aguardando Vento/Aulas
          Agendadas get the full column height there) and the interactive
          "what if" sliders are the same topic at two different zoom
          levels, so there's no reason for the simulator to eat a whole
          row below it. 1:2 split — the card is a fixed-size summary, the
          simulator has more to lay out (two sliders + result panel). */}
      <div className="costs-runway-grid" style={{ marginTop: '40px' }}>
        <div>
          <RunwaySummary
            runwayMonths={runwayMonths}
            seasonRevenue={(runway as any).season_revenue ?? 0}
            commissions={((runway as any).crew_commissions ?? 0) + totalPartnerCommissions}
            netProfit={rawNetProfit}
            monthlyBurn={monthlyBurn}
            gapToTarget={gapToTarget}
            projectedRunway={projection?.projectedRunway}
            daysLeft={projection?.daysLeft}
          />
        </div>

        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--slate)', marginBottom: '4px' }}>
              Simulador de Cenários / Baixa Temporada
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
              Ajuste os valores para simular hipóteses — os números ao lado são os reais.
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
    </div>
  )
}
