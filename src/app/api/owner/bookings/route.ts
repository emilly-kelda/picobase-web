import { updateBookingStatus } from '@/repositories/bookingRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const { id, status } = await request.json()

  if (!id || (status !== 'confirmed' && status !== 'declined')) {
    return NextResponse.json({ error: 'id e um status válido são obrigatórios' }, { status: 400 })
  }

  try {
    await updateBookingStatus(id, status, SCHOOL_ID)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // TODO(notify_payment_and_waiver): once a message-dispatch service
  // (Z-API, Evolution API, or similar) is wired up, check
  // schools.notify_payment_and_waiver here before sending — if true and
  // status === 'confirmed', send the student their payment receipt plus
  // the waiver link (schools.waiver_type === 'file' ? waiver_file_*_url :
  // the /checkin/[school] waiver step). No dispatch exists yet; this is
  // the correct trigger point for it.

  return NextResponse.json({ ok: true })
}
