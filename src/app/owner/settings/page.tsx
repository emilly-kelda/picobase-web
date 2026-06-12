import { getSchool, getSeasons } from '@/repositories/runwayRepository'
import SettingsClient from './SettingsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function SettingsPage() {
  const [school, seasons] = await Promise.all([
    getSchool(SCHOOL_ID),
    getSeasons(SCHOOL_ID),
  ])

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '500',
          color: 'var(--slate)', marginBottom: '4px',
        }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--mist)' }}>
          School configuration and season management
        </p>
      </div>
      <SettingsClient school={school} seasons={seasons} />
    </div>
  )
}

