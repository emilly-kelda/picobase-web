import Link from 'next/link'
import { getAllSchoolsForMaster } from '@/repositories/schoolRepository'
import SchoolsTable from './SchoolsTable'

export default async function MasterDashboardPage() {
  const schools = await getAllSchoolsForMaster()

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
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

      <SchoolsTable schools={schools} />
    </div>
  )
}
