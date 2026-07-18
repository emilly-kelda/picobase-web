import { getSchoolBySlug, getActivitiesForCheckin } from '@/repositories/checkinRepository'
import { getSchoolOwnerWhatsapp } from '@/repositories/bookingRepository'
import { getPartnerByReferralCode } from '@/repositories/partnerRepository'
import { cookies } from 'next/headers'
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

  const refCode = (await cookies()).get('pb_ref')?.value

  const [activities, ownerWhatsapp, referredPartner] = await Promise.all([
    getActivitiesForCheckin(school.id),
    getSchoolOwnerWhatsapp(school.id),
    refCode ? getPartnerByReferralCode(refCode, school.id) : Promise.resolve(null),
  ])

  return (
    <BookingForm
      school={school}
      activities={activities}
      ownerWhatsapp={ownerWhatsapp}
      referredPartner={referredPartner}
    />
  )
}
