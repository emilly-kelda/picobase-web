import { createServiceClient } from '@/lib/supabase-server'
import { computeCommissionAmount } from '@/lib/commission'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()

  const {
    checkin_id,
    instructor_id,
    school_id,
    activity_id,
    duration_min,
    price,
    notes,
  } = body

  // Re-derive from the instructor's saved rate — same reasoning as
  // /api/owner/confirm-lesson: a client-supplied commission_pct never
  // reflects fixed hourly-rate instructors and can go stale.
  const { data: instructor } = await supabase
    .from('users')
    .select('commission_pct, commission_mode, fixed_per_hour')
    .eq('id', instructor_id)
    .single()

  const commission_pct    = instructor?.commission_pct ?? null
  const commission_amount = computeCommissionAmount(
    instructor ?? { commission_pct: null },
    price,
    duration_min
  )
  const today = new Date().toISOString().slice(0, 10)

  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      school_id,
      checkin_id,
      instructor_id,
      activity_id:       activity_id || null,
      session_date:      today,
      duration_min,
      price,
      commission_pct,
      commission_amount,
      origin:            'direct',
      session_type:      'lesson',
      notes:             notes || null,
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


