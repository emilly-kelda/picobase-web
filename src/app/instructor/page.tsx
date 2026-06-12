import { getInstructorByToken } from '@/repositories/crewRepository'
import { getPendingCheckins, getTodayInstructorStats } from '@/repositories/sessionRepository'
import InstructorPWA from './InstructorPWA'

export default async function InstructorPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F0EEE9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#1A1C22', marginBottom: '8px' }}>
            Access required
          </div>
          <div style={{ fontSize: '14px', color: '#8A8C98' }}>
            Use the link provided by your school.
          </div>
        </div>
      </div>
    )
  }

  const instructor = await getInstructorByToken(token)

  if (!instructor) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F0EEE9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'system-ui, sans-serif', textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#E8471A', marginBottom: '8px' }}>
            Invalid link
          </div>
          <div style={{ fontSize: '14px', color: '#8A8C98' }}>
            Contact your school for a new access link.
          </div>
        </div>
      </div>
    )
  }

  const [checkins, stats] = await Promise.all([
    getPendingCheckins(instructor.school_id, instructor.id),
    getTodayInstructorStats(instructor.school_id, instructor.id),
  ])

  return (
    <InstructorPWA
      instructor={instructor}
      checkins={checkins}
      stats={stats}
      token={token}
    />
  )
}

