import { getCosts } from '@/repositories/picobaseCostRepository'
import { getMasterMetrics } from '@/repositories/schoolRepository'
import CostsClient from './CostsClient'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export default async function MasterCostsPage() {
  const [costs, metrics] = await Promise.all([
    getCosts(),
    getMasterMetrics(),
  ])

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const netResult   = metrics.saasRevenue - totalCosts

  const metricCards = [
    { label: 'Entrada (assinaturas)', value: fmt(metrics.saasRevenue), color: 'var(--slate)' },
    { label: 'Saída (custos)',        value: fmt(totalCosts),          color: '#DC2626' },
    { label: 'Resultado líquido',     value: fmt(netResult),           color: netResult >= 0 ? '#007868' : '#DC2626' },
  ]

  // Break-even: how many active schools (at the average subscription
  // value already contracted) it takes to cover totalCosts. Needs at
  // least one active school with a subscription_value on file — without
  // that there's no per-school revenue figure to divide by.
  const avgRevenuePerSchool = metrics.activeSchools > 0 ? metrics.saasRevenue / metrics.activeSchools : 0
  const breakEvenSchools = avgRevenuePerSchool > 0 ? Math.ceil(totalCosts / avgRevenuePerSchool) : null

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Centro de Custos PicoBase
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Saúde financeira da operação — assinaturas cobradas das escolas menos custos de infraestrutura e desenvolvimento
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px', marginBottom: '28px',
      }}>
        {metricCards.map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: '500',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--mist)', marginBottom: '8px',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: '600',
              color: card.color, fontVariantNumeric: 'tabular-nums',
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <span style={{ fontSize: '22px' }}>⚖️</span>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: '500',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--mist)', marginBottom: '4px',
          }}>
            Ponto de equilíbrio
          </div>
          {breakEvenSchools !== null ? (
            <div style={{ fontSize: '14px', color: 'var(--slate)' }}>
              Você precisa de <strong>{breakEvenSchools}</strong> escola{breakEvenSchools === 1 ? '' : 's'} ativa{breakEvenSchools === 1 ? '' : 's'} para
              cobrir os custos operacionais atuais de <strong>{fmt(totalCosts)}</strong>
              {metrics.activeSchools > 0 && (
                <span style={{ color: 'var(--mist)' }}> ({metrics.activeSchools} ativa{metrics.activeSchools === 1 ? '' : 's'} hoje)</span>
              )}
              .
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--mist)' }}>
              Defina o valor de assinatura (subscription_value) de ao menos uma escola ativa para calcular o ponto de equilíbrio.
            </div>
          )}
        </div>
      </div>

      <CostsClient costs={costs} />
    </div>
  )
}
