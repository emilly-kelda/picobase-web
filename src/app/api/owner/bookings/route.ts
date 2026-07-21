import { createServiceClient } from '@/lib/supabase-server'
import { createBooking, updateBookingStatus } from '@/repositories/bookingRepository'
import { ensureActiveCheckinForToday } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Reception-created bookings — distinct from the public, unauthenticated
 *  /api/book (used by /book/[school]'s self-service intake form). This one
 *  is built around AddBookingModal.tsx's "search an existing customer"
 *  flow: when student_id is set, name/whatsapp are re-derived from the
 *  actual students row server-side rather than trusting whatever the
 *  client displayed, same "never trust client data for what gets
 *  persisted" posture used elsewhere in this app. Manual entry (the
 *  "cadastrar novo cliente manualmente" fallback, for a customer with no
 *  students row yet) is still accepted via student_name/whatsapp. */
export async function POST(request: Request) {
  const body = await request.json()
  const { student_id, activity_id, preferred_date, preferred_time, notes } = body

  let studentName = body.student_name?.trim()
  let whatsapp    = body.whatsapp?.trim()

  const supabase = createServiceClient()

  if (student_id) {
    const { data: student, error } = await supabase
      .from('students')
      .select('name, whatsapp')
      .eq('id', student_id)
      .eq('school_id', SCHOOL_ID)
      .single()
    if (error || !student) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }
    studentName = student.name
    whatsapp    = student.whatsapp ?? ''
  }

  if (!studentName || !whatsapp) {
    return NextResponse.json(
      { error: 'Selecione um cliente cadastrado ou informe nome e WhatsApp.' },
      { status: 400 }
    )
  }

  try {
    await createBooking({
      school_id:      SCHOOL_ID,
      student_id:     student_id ?? null,
      student_name:   studentName,
      whatsapp,
      activity_id:    activity_id || null,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
      notes:          notes?.trim() || null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // A reservation for today is, functionally, a walk-in about to happen —
  // gets them into Aguardando Vento right away instead of only appearing once
  // someone later confirms/schedules them. A booking with no date, or a
  // future one, isn't touched: this only fires when preferred_date is
  // literally today, not "no preference yet" or "next week".
  const today = new Date().toISOString().slice(0, 10)
  if (preferred_date === today) {
    try {
      await ensureActiveCheckinForToday(SCHOOL_ID, studentName, { activityId: activity_id })
    } catch (err) {
      console.error('ensureActiveCheckinForToday failed for', studentName, err)
    }
  }

  return NextResponse.json({ ok: true })
}

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
