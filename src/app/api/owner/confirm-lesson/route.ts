import { createServiceClient } from '@/lib/supabase-server'
import { computeCommissionAmount, getVariableCostForStudent } from '@/lib/commission'
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
    session_date,
    payment_method,
    level,
    currency,
    price_original,
  } = body

  const supabase = createServiceClient()

  const { data: checkin } = await supabase
    .from('checkins')
    .select('student_name, partner_id, scheduled_lesson_id')
    .eq('id', checkin_id)
    .single()

  // Re-derive from the instructor's saved rate rather than trusting whatever
  // commission_pct the client last loaded — that value never reflects fixed
  // hourly-rate instructors, and can go stale between page load and confirm.
  const { data: instructor } = await supabase
    .from('users')
    .select('commission_pct, commission_mode, fixed_per_hour')
    .eq('id', instructor_id)
    .single()

  // Packages with a variable cost (e.g. Downwind boat/fuel) reduce the
  // commission base — the school still collects the full price, but the
  // instructor's cut is computed on what's left after that cost.
  const variableCost      = await getVariableCostForStudent(supabase, SCHOOL_ID, checkin?.student_name)
  const costDeduction     = variableCost.variableCostAmount
  const netRevenue        = Math.max(0, price - costDeduction)

  const commission_pct    = instructor?.commission_pct ?? null
  const commission_amount = computeCommissionAmount(
    instructor ?? { commission_pct: null },
    netRevenue,
    duration_min
  )

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
      payment_method:   payment_method ?? null,
      level:            level || null,
      currency:         currency ?? 'BRL',
      price_original:   price_original ?? price,
      variable_cost_deduction: costDeduction > 0 ? costDeduction : null,
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

  if (checkin?.scheduled_lesson_id) {
    await supabase
      .from('scheduled_lessons')
      .update({ status: 'confirmed' })
      .eq('id', checkin.scheduled_lesson_id)
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
