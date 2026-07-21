import { createServiceClient } from '@/lib/supabase-server'
import { computeCommissionAmount, getVariableCostForStudent } from '@/lib/commission'
import { convertToBRL } from '@/lib/fx'
import { checkSchedulingConflicts, checkPackageCapacity } from '@/repositories/scheduledLessonRepository'
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

  // A checkin-derived link takes priority, but group confirms — and now
  // Aulas Agendadas' individual "Confirmar / Iniciar Aula" — have no
  // checkin and pass the scheduled_lessons row id directly instead.
  const linkedScheduledLessonId = checkin?.scheduled_lesson_id ?? scheduled_lesson_id ?? null

  // Needed as a student-name/package_sale_id fallback when there's no
  // checkin (unchanged from before), and now also to re-validate
  // instructor/student clash + package capacity against the lesson's own
  // original scheduled_at — instructor_id and duration_min can both be
  // edited right here in the confirm modal (ScheduledLessons.tsx's
  // "Confirmar Aula", and PendingLessons.tsx's own confirm form), so a
  // swap could introduce a conflict that was never checked when the
  // lesson was first scheduled. scheduledLesson.package_sale_id, if set,
  // is whichever specific sale was linked at schedule time (either picked
  // explicitly in the "+ Agendar" autocomplete, or carried over from the
  // originating checkin by schedule-from-checkin) — preferred over the
  // general FIFO-by-name lookup when it still has balance.
  const { data: scheduledLesson } = linkedScheduledLessonId
    ? await supabase
        .from('scheduled_lessons')
        .select('student_name, package_sale_id, scheduled_at, duration_min')
        .eq('id', linkedScheduledLessonId)
        .single()
    : { data: null }

  const studentName = checkin?.student_name ?? scheduledLesson?.student_name ?? null

  // Set only when the capacity check below actually runs (i.e. this lesson
  // had a package explicitly linked at scheduling time) — the auto-debit
  // step further down reuses this exact resolution instead of re-deriving
  // its own, so the sale that got validated and the sale that gets
  // debited are guaranteed to be the same row.
  let resolvedPackageSaleId: string | null = null

  if (scheduledLesson) {
    const effectiveDuration = duration_min || scheduledLesson.duration_min || 60
    const { instructorConflict, studentConflict } = await checkSchedulingConflicts(SCHOOL_ID, {
      instructorId:    instructor_id || null,
      studentName:     studentName ?? '',
      scheduledAt:     scheduledLesson.scheduled_at,
      durationMin:     effectiveDuration,
      excludeLessonId: linkedScheduledLessonId,
    })
    if (studentConflict) {
      return NextResponse.json(
        { error: 'Não é possível confirmar: este aluno já possui uma aula marcada para este mesmo horário.' },
        { status: 409 }
      )
    }
    if (instructorConflict) {
      return NextResponse.json(
        { error: 'O instrutor selecionado já possui uma aula agendada para este horário.' },
        { status: 409 }
      )
    }

    if (scheduledLesson.package_sale_id) {
      const capacity = await checkPackageCapacity(SCHOOL_ID, {
        studentName:     studentName ?? '',
        packageSaleId:   scheduledLesson.package_sale_id,
        durationMin:     effectiveDuration,
        excludeLessonId: linkedScheduledLessonId,
      })
      if (!capacity.ok) {
        return NextResponse.json(
          { error: 'Saldo de créditos insuficiente. O aluno precisa de adquirir um novo pacote para agendar.' },
          { status: 409 }
        )
      }
      resolvedPackageSaleId = capacity.resolvedSaleId
    }
  }

  // Re-derive from the instructor's saved rate rather than trusting whatever
  // commission_pct the client last loaded — that value never reflects fixed
  // hourly-rate instructors, and can go stale between page load and confirm.
  const [{ data: instructor }, { data: schoolRow }] = await Promise.all([
    supabase
      .from('users')
      .select('role, commission_pct, commission_mode, fixed_per_hour')
      .eq('id', instructor_id)
      .single(),
    // payout_model: 'fixed' is a school-wide override that ignores every
    // instructor's own commission_pct/fixed_per_hour entirely, paying the
    // same flat fixed_payout_value (already BRL — no currency conversion
    // applies to it, unlike the percentage path below) for any lesson.
    supabase
      .from('schools')
      .select('payout_model, fixed_payout_value')
      .eq('id', SCHOOL_ID)
      .single(),
  ])
  const usesFixedPayout = schoolRow?.payout_model === 'fixed'

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
  const variableCost      = await getVariableCostForStudent(supabase, SCHOOL_ID, studentName)
  const costDeduction     = variableCost.variableCostAmount
  const netRevenue        = Math.max(0, priceBRL - costDeduction)

  const commission_pct    = isOwner ? 0 : (usesFixedPayout ? null : (instructor?.commission_pct ?? null))
  const commission_amount = isOwner
    ? 0
    : usesFixedPayout
      ? (schoolRow?.fixed_payout_value ?? 0)
      : computeCommissionAmount(
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

  // TODO(notify_post_class_feedback): this is where a lesson becomes
  // "completed" (the sessions row above), but the message fires 1h AFTER
  // this moment, not now — same nuance as notify_student_before_class in
  // api/owner/schedule: this route runs at confirm time, not an hour
  // later, so it can't dispatch inline. Once a message-dispatch service
  // exists, its time-based job (cron/queue worker) should check
  // schools.notify_post_class_feedback and, for sessions where
  // created_at + 1h has passed, send the student a congratulations +
  // skill-progress summary via WhatsApp. No such job exists yet.

  if (checkin_id) {
    // stage kept in sync with status here rather than as a separate call —
    // picobase_chameleon_button_dossie.md's Fase 3 "onFinishAndCharge: ...
    // ao confirmar o checkout, stage vira concluido", this is that
    // transition (na_agua/whatever it was -> concluido, regardless of
    // which stage it started this confirm from).
    const { error: checkinError } = await supabase
      .from('checkins')
      .update({ status: 'session_confirmed', stage: 'concluido' })
      .eq('id', checkin_id)

    if (checkinError) {
      return NextResponse.json({ error: checkinError.message }, { status: 500 })
    }
  }

  if (linkedScheduledLessonId) {
    await supabase
      .from('scheduled_lessons')
      .update({ status: 'confirmed' })
      .eq('id', linkedScheduledLessonId)
  }

  // Auto-debit package credits — if this student has an unexhausted package,
  // this lesson's duration comes off its remaining balance automatically.
  // FIFO: the oldest sale that still has balance is debited first, same
  // resolution getPackageBalancesForCheckins now uses for the badges (see
  // AUDITORIA_DASHBOARD.md item 4 — this used to order sold_at descending,
  // debiting the newest package first instead). Works from studentName now
  // (checkin- or scheduled_lesson-derived), not just checkin?.student_name —
  // group confirms and Aulas Agendadas' individual confirm both have no
  // checkin in scope, and used to silently skip this block entirely.
  if (studentName) {
    const { data: packageSales } = await supabase
      .from('package_sales')
      .select('id, minutes_purchased, minutes_used')
      .eq('school_id', SCHOOL_ID)
      .ilike('student_name', studentName)
      .order('sold_at', { ascending: true })

    // When a package was explicitly linked at scheduling time, the
    // capacity check above already resolved exactly which sale has room
    // (the linked one, or its FIFO fallback) — reuse that resolution
    // rather than re-deriving it here with a *different*, looser rule
    // ("any balance > 0" instead of "enough balance for this lesson's
    // duration"), which could debit a sale into a negative balance the
    // capacity check would have rejected. No link at all (walk-in/avulsa,
    // never went through a capacity check) keeps the original opportunistic
    // FIFO-any-active-sale lookup.
    const activeSale = scheduledLesson?.package_sale_id
      ? (resolvedPackageSaleId ? (packageSales ?? []).find(s => s.id === resolvedPackageSaleId) : undefined)
      : (packageSales ?? []).find(s => (s.minutes_purchased ?? 0) - (s.minutes_used ?? 0) > 0)

    if (activeSale) {
      const newMinutesUsed = (activeSale.minutes_used ?? 0) + duration_min
      await supabase
        .from('package_sales')
        .update({ minutes_used: newMinutesUsed })
        .eq('id', activeSale.id)

      // TODO(notify_package_low): once a message-dispatch service (Z-API,
      // Evolution API, or similar) is wired up, check
      // schools.notify_package_low here before sending — if true and the
      // remaining balance (activeSale.minutes_purchased - newMinutesUsed)
      // just dropped to <= 60 minutes, notify the student via WhatsApp
      // suggesting a renewal. No dispatch exists yet; this is the correct
      // trigger point for it (right after the balance is actually updated).
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
