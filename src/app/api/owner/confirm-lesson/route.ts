import { createServiceClient } from '@/lib/supabase-server'
import { computeCommissionAmount, getVariableCostForStudent } from '@/lib/commission'
import { convertToBRL } from '@/lib/fx'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    checkin_id,
    // Group-confirmed lessons have no checkin — the owner schedules and
    // confirms the group directly, so the link to scheduled_lessons has to
    // travel some other way. This carries it explicitly.
    scheduled_lesson_id,
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

  const { data: checkin } = checkin_id
    ? await supabase
        .from('checkins')
        .select('student_name, partner_id, scheduled_lesson_id')
        .eq('id', checkin_id)
        .single()
    : { data: null }

  // Re-derive from the instructor's saved rate rather than trusting whatever
  // commission_pct the client last loaded — that value never reflects fixed
  // hourly-rate instructors, and can go stale between page load and confirm.
  const { data: instructor } = await supabase
    .from('users')
    .select('role, commission_pct, commission_mode, fixed_per_hour')
    .eq('id', instructor_id)
    .single()

  // The owner doesn't pay themselves a commission when they teach a lesson —
  // the session is still recorded (price, duration) for revenue/stats, but
  // the payout side is always zero.
  const isOwner = instructor?.role === 'owner'

  // Commissions (instructor and partner) are always paid in BRL, regardless
  // of what currency the student was actually charged in. price_original is
  // the trustworthy raw amount the owner entered — never trust a client-sent
  // `price` for this, since a stale/bugged client could send the nominal
  // figure unconverted (this is exactly the bug this conversion fixes).
  let priceBRL: number
  try {
    priceBRL = await convertToBRL(price_original ?? price, (currency ?? 'BRL') as 'BRL' | 'USD' | 'EUR')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao converter moeda'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Packages with a variable cost (e.g. Downwind boat/fuel) reduce the
  // commission base — the school still collects the full price, but the
  // instructor's cut is computed on what's left after that cost. The cost
  // itself is always a BRL figure, so it's subtracted after conversion.
  const variableCost      = await getVariableCostForStudent(supabase, SCHOOL_ID, checkin?.student_name)
  const costDeduction     = variableCost.variableCostAmount
  const netRevenue        = Math.max(0, priceBRL - costDeduction)

  const commission_pct    = isOwner ? 0 : (instructor?.commission_pct ?? null)
  const commission_amount = isOwner ? 0 : computeCommissionAmount(
    instructor ?? { commission_pct: null },
    netRevenue,
    duration_min
  )

  const { data: newSession, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      school_id:        SCHOOL_ID,
      checkin_id:       checkin_id ?? null,
      instructor_id,
      activity_id:      activity_id || null,
      session_date:     session_date ?? new Date().toISOString().slice(0, 10),
      duration_min,
      price:            priceBRL,
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

  if (checkin_id) {
    const { error: checkinError } = await supabase
      .from('checkins')
      .update({ status: 'session_confirmed' })
      .eq('id', checkin_id)

    if (checkinError) {
      return NextResponse.json({ error: checkinError.message }, { status: 500 })
    }
  }

  // A checkin-derived link takes priority, but group confirms have no
  // checkin and pass the scheduled_lessons row id directly instead.
  const linkedScheduledLessonId = checkin?.scheduled_lesson_id ?? scheduled_lesson_id ?? null
  if (linkedScheduledLessonId) {
    await supabase
      .from('scheduled_lessons')
      .update({ status: 'confirmed' })
      .eq('id', linkedScheduledLessonId)
  }

  // Auto-debit package credits — if this student has an unexhausted package,
  // this lesson's duration comes off its remaining balance automatically,
  // same "most recent unexhausted sale" resolution getPackageBalancesForCheckins
  // already uses for the badges. Only wired for the checkin flow (checkin_id
  // is how we know the student's name here) — group confirms have no student
  // name in scope on this route, same "checkin flow only" boundary the
  // partner-commission auto-wiring already draws.
  if (checkin?.student_name) {
    const { data: packageSales } = await supabase
      .from('package_sales')
      .select('id, minutes_purchased, minutes_used')
      .eq('school_id', SCHOOL_ID)
      .ilike('student_name', checkin.student_name)
      .order('sold_at', { ascending: false })

    const activeSale = (packageSales ?? []).find(
      s => (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0) > 0
    )
    if (activeSale) {
      await supabase
        .from('package_sales')
        .update({ minutes_used: (activeSale.minutes_used ?? 0) + duration_min })
        .eq('id', activeSale.id)
    }
  }

  if (checkin?.partner_id) {
    const { data: partner } = await supabase
      .from('partners')
      .select('id, commission_pct')
      .eq('id', checkin.partner_id)
      .single()

    // Writes to `referrals` — the table every partner-commission read in the
    // app actually queries (crewRepository.getPartnerCommissions, reports,
    // exports, api/partner/[id]). This used to write to `partner_referrals`,
    // a table nothing else reads, so partner commissions from confirmed
    // lessons never actually showed up anywhere. No duplicate-checkin guard
    // here (referrals has no confirmed checkin_id column to key off, and the
    // sessions insert two steps up has no such guard either — matching the
    // route's existing idempotency posture rather than inventing a new one).
    if (partner) {
      await supabase
        .from('referrals')
        .insert({
          school_id:         SCHOOL_ID,
          partner_id:        checkin.partner_id,
          session_price:     priceBRL,
          commission_pct:    partner.commission_pct,
          commission_amount: priceBRL * (partner.commission_pct ?? 0),
          period:            (session_date ?? new Date().toISOString().slice(0, 10)).slice(0, 7),
          status:            'pending',
        })
    }
  }

  return NextResponse.json({ ok: true })
}
