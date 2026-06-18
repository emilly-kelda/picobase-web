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

  const { data: checkin } = await supabase
    .from('checkins')
    .select('partner_id')
    .eq('id', checkin_id)
    .single()

  const { data: newSession, error: sessionError } = await supabase
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
      origin:           checkin?.partner_id ? 'partner' : 'direct',
      session_type:     'lesson',
      notes:            notes || null,
      partner_id:       checkin?.partner_id ?? null,
    })
    .select('id')
    .single()

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

  if (checkin?.partner_id) {
    const { data: partner } = await supabase
      .from('partners')
      .select('id, commission_pct')
      .eq('id', checkin.partner_id)
      .single()

    if (partner) {
      const { data: existing } = await supabase
        .from('partner_referrals')
        .select('id')
        .eq('checkin_id', checkin_id)
        .maybeSingle()

      if (!existing) {
        await supabase
          .from('partner_referrals')
          .insert({
            school_id:         SCHOOL_ID,
            partner_id:        checkin.partner_id,
            checkin_id,
            session_id:        newSession!.id,
            revenue:           price,
            commission_pct:    partner.commission_pct,
            commission_amount: price * (partner.commission_pct ?? 0),
            period:            (session_date ?? new Date().toISOString().slice(0, 10)).slice(0, 7),
            status:            'pending',
          })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
