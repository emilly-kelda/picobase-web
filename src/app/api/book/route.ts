import { getSchoolBySlug } from '@/repositories/checkinRepository'
import { createBooking } from '@/repositories/bookingRepository'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    school_slug,
    student_name,
    whatsapp,
    activity_id,
    preferred_date,
    preferred_time,
    notes,
  } = body

  if (!school_slug || !student_name?.trim() || !whatsapp?.trim()) {
    return NextResponse.json({ error: 'school_slug, student_name e whatsapp são obrigatórios' }, { status: 400 })
  }

  const school = await getSchoolBySlug(school_slug)
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  try {
    await createBooking({
      school_id:      school.id,
      student_name:   student_name.trim(),
      whatsapp:       whatsapp.trim(),
      activity_id:    activity_id ?? null,
      preferred_date: preferred_date ?? null,
      preferred_time: preferred_time ?? null,
      notes:          notes?.trim() ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
