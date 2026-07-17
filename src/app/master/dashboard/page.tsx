import Link from 'next/link'
import { getAllSchoolsForMaster, getMasterMetrics } from '@/repositories/schoolRepository'
import SchoolsTable from './SchoolsTable'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

export default async function MasterDashboardPage() {
  const [schools, metrics] = await Promise.all([
    getAllSchoolsForMaster(),
    getMasterMetrics(),
  ])

  const metricCards = [
    { label: 'Faturamento SaaS',      value: fmt(metrics.saasRevenue),     sub: 'assinaturas cadastradas' },
    { label: 'Escolas ativas',        value: String(metrics.activeSchools), sub: `de ${schools.length} cadastrada${schools.length !== 1 ? 's' : ''}` },
    { label: 'Volume do ecossistema', value: fmt(metrics.ecosystemVolume), sub: 'receita das escolas, acumulada' },
  ]

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: '500',
            color: 'var(--slate)', marginBottom: '4px',
          }}>
            Escolas
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
            {schools.length} escola{schools.length !== 1 ? 's' : ''} cadastrada{schools.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/master/schools/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px',
            background: 'var(--slate)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: '13px', fontWeight: '500',
            textDecoration: 'none', fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
          }}
        >
          + Nova Escola
        </Link>
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
              color: 'var(--slate)', fontVariantNumeric: 'tabular-nums',
              marginBottom: '4px',
            }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <SchoolsTable schools={schools} />
    </div>
  )
}
