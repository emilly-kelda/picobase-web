import { getCosts, getKnownCategories, getMonthlyCostTotal } from '@/repositories/costRepository'
import CostsClient from './CostsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export default async function CostsPage() {
  const [{ costs, total, pageSize }, knownCategories, monthlyCostTotal] = await Promise.all([
    getCosts(SCHOOL_ID, 0),
    getKnownCategories(SCHOOL_ID),
    getMonthlyCostTotal(SCHOOL_ID),
  ])

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
            Custo mensal recorrente
          </span>
          <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(monthlyCostTotal)}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '4px' }}>
            mensais + anuais/12 · alimenta Base Camp e o Runway Calculator
          </span>
        </div>
      )}

      <CostsClient
        initialCosts={costs}
        initialTotal={total}
        pageSize={pageSize}
        knownCategories={knownCategories}
      />
    </div>
  )
}
