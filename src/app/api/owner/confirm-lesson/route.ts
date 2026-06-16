import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    checkin_id,
    instructor_id,
    activity_id,
    duration_min,
    price,
    notes,
    commission_pct,
    session_date,
  } = body

  const supabase = createServiceClient()
  const commission_amount = price * commission_pct

  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      school_id:        SCHOOL_ID,
      checkin_id,
      instructor_id,
      activity_id:      activity_id || null,
      session_date:     session_date ?? new Date().toISOString().slice(0, 10),
      duration_min,
      price,
      commission_pct,
      commission_amount,
      origin:           'direct',
      session_type:     'lesson',
      notes:            notes || null,
    })

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  const { error: checkinError } = await supabase
    .from('checkins')
    .update({ status: 'session_confirmed' })
    .eq('id', checkin_id)

  if (checkinError) {
    return NextResponse.json({ error: checkinError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
