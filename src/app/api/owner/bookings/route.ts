import { updateBookingStatus } from '@/repositories/bookingRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const { id, status } = await request.json()

  if (!id || (status !== 'confirmed' && status !== 'declined')) {
    return NextResponse.json({ error: 'id and a valid status are required' }, { status: 400 })
  }

  try {
    await updateBookingStatus(id, status, SCHOOL_ID)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
