import { getSchoolBySlug, getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getSchoolOwnerWhatsapp } from '@/repositories/bookingRepository'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ school: string }>
}) {
  const { school: slug } = await params
  const school = await getSchoolBySlug(slug)
  if (!school) notFound()

  const [activities, ownerWhatsapp] = await Promise.all([
    getActivitiesForCheckin(school.id),
    getSchoolOwnerWhatsapp(school.id),
  ])

  return (
    <BookingForm
      school={school}
      activities={activities}
      ownerWhatsapp={ownerWhatsapp}
    />
  )
}
