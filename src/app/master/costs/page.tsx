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

      <CostsClient costs={costs} />
    </div>
  )
}
