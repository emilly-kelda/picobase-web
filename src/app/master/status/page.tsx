import { getInfraStatus } from '@/repositories/infraStatusRepository'
import StatusClient from './StatusClient'

export default async function MasterStatusPage() {
  const status = await getInfraStatus()

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Status da Infraestrutura
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          Saúde do banco de dados e da API do Supabase, em tempo real
        </p>
      </div>

      <StatusClient initialStatus={status} />
    </div>
  )
}
