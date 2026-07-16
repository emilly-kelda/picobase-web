import { getPendingBookings } from '@/repositories/bookingRepository'
import BookingsClient from './BookingsClient'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export default async function BookingsPage() {
  const bookings = await getPendingBookings(SCHOOL_ID)

  const normalized = bookings.map(b => ({
    ...b,
    activities: Array.isArray(b.activities) ? (b.activities[0] ?? null) : (b.activities ?? null),
  }))

  return <BookingsClient bookings={normalized as any} />
}
