import { getSchoolBySlug, getActivitiesForCheckin, getInstructorsForCheckin, getPartnersForCheckin } from '@/repositories/checkinRepository'
import { notFound } from 'next/navigation'
import CheckinForm from './CheckinForm'

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ school: string }>
}) {
  const { school: slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const [activities, instructors, partners] = await Promise.all([
    getActivitiesForCheckin(school.id),
    getInstructorsForCheckin(school.id),
    getPartnersForCheckin(school.id),
  ])

  return (
    <CheckinForm
      school={school}
      activities={activities}
      instructors={instructors}
      partners={partners}
    />
  )
}