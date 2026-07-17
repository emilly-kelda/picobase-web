import { createServiceClient } from '@/lib/supabase-server'

export async function createBooking(payload: {
  school_id: string
  student_name: string
  whatsapp: string
  activity_id: string | null
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('bookings')
    .insert({ ...payload, status: 'pending' })
  if (error) throw error
  return { ok: true }
}

export async function getPendingBookingsCount(schoolId: string) {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'pending')
  return count ?? 0
}

export async function getPendingBookings(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id, student_name, whatsapp, preferred_date, preferred_time, notes, created_at, activities(name)')
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateBookingStatus(id: string, status: 'confirmed' | 'declined', schoolId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

/** The success screen on /book/[school] links students straight to WhatsApp —
 *  bookings has no school contact column, so this reuses the school's owner
 *  row (users.whatsapp), the same number instructors/partners already see the
 *  owner by elsewhere in the app. */
export async function getSchoolOwnerWhatsapp(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('whatsapp')
    .eq('school_id', schoolId)
    .eq('role', 'owner')
    .maybeSingle()
  return data?.whatsapp ?? null
}

/** /api/book takes a school_slug, not a school_id (it's built for the public,
 *  unauthenticated /book/[school] page) — the owner-side "Add Booking" modal
 *  reuses that same endpoint rather than duplicating the insert, so it needs
 *  the slug for its own already-known SCHOOL_ID. */
export async function getSchoolSlug(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('schools')
    .select('slug')
    .eq('id', schoolId)
    .single()
  return data?.slug ?? null
}
