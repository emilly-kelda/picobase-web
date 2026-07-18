import { getSchoolBySlug, getActivitiesForCheckin, getInstructorsForCheckin, getPartnersForCheckin } from '@/repositories/checkinRepository'
import { getPartnerByReferralCode } from '@/repositories/partnerRepository'
import { cookies } from 'next/headers'
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

  const refCode = (await cookies()).get('pb_ref')?.value

  const [activities, instructors, partners, referredPartner] = await Promise.all([
    getActivitiesForCheckin(school.id),
    getInstructorsForCheckin(school.id),
    getPartnersForCheckin(school.id),
    // Resolved server-side against this school specifically — a ref cookie
    // set while browsing a different school's link can't attribute here.
    refCode ? getPartnerByReferralCode(refCode, school.id) : Promise.resolve(null),
  ])

  return (
    <CheckinForm
      school={school}
      activities={activities}
      instructors={instructors}
      partners={partners}
      referredPartner={referredPartner}
    />
  )
}