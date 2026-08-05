import { getAllPlans, getSchoolsWithPlans } from '@/repositories/schoolRepository'
import PlansOverview from './PlansOverview'
import SubscriptionsTable from './SubscriptionsTable'

export default async function MasterPlansPage() {
  const [plans, schools] = await Promise.all([
    getAllPlans(),
    getSchoolsWithPlans(),
  ])

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--slate)', marginBottom: '4px' }}>
          Planos e Assinaturas
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PlansOverview plans={plans} />

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--slate)', marginBottom: '12px' }}>
          Assinaturas por escola
        </h2>
        <SubscriptionsTable schools={schools} plans={plans} />
      </div>
    </div>
  )
}
