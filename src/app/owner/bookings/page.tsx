import { getPendingBookings, getSchoolSlug } from '@/repositories/bookingRepository'
import { getActivitiesForCheckin } from '@/repositories/checkinRepository'
import BookingsClient from './BookingsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function BookingsPage() {
  const [bookings, activities, schoolSlug] = await Promise.all([
    getPendingBookings(SCHOOL_ID),
    getActivitiesForCheckin(SCHOOL_ID),
    getSchoolSlug(SCHOOL_ID),
  ])

  const normalized = bookings.map(b => ({
    ...b,
    activities: Array.isArray(b.activities) ? (b.activities[0] ?? null) : (b.activities ?? null),
  }))

  return (
    <BookingsClient
      bookings={normalized as any}
      activities={activities}
      schoolSlug={schoolSlug}
    />
  )
}
