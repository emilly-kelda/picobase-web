import { getCrewMembers } from '@/repositories/crewRepository'
import CrewClient from '@/components/CrewClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function CrewPage() {
  const crew = await getCrewMembers(SCHOOL_ID)
  return <CrewClient initialCrew={crew} />
}
