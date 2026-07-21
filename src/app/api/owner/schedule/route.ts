import { createServiceClient } from '@/lib/supabase-server'
import { checkSchedulingConflicts, checkPackageCapacity, ensureActiveCheckinForToday } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

const STUDENT_CLASH_ERROR = 'Não é possível agendar: este aluno já possui uma aula marcada para este mesmo horário.'
const INSTRUCTOR_CLASH_ERROR = 'O instrutor selecionado já possui uma aula agendada para este horário.'
const INSUFFICIENT_CREDIT_ERROR = 'Saldo de créditos insuficiente. O aluno precisa de adquirir um novo pacote para agendar.'

// TODO(notify_student_before_class): the reminder needs to fire 2h before
// scheduled_at, which is almost never when this route runs (lessons are
// usually scheduled days ahead) — so this isn't the trigger point. Once a
// message-dispatch service (Z-API, Evolution API, or similar) exists, it
// needs its own time-based job (cron/queue worker) that polls
// scheduled_lessons where scheduled_at is ~2h out and status = 'scheduled',
// checks schools.notify_student_before_class, and only then sends the
// WhatsApp reminder with wind/sea conditions. No such job exists yet.

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()

  if (body.mode === 'group') {
    const students: string[] = body.students ?? []
    const validStudents = students.map((s: string) => s.trim()).filter(Boolean)

    if (validStudents.length < 2) {
      return NextResponse.json(
        { error: 'Grupo precisa de pelo menos 2 alunos' },
        { status: 400 }
      )
    }

    // Instructor is assigned per student later, at confirm time (see
    // confirmGroup in ScheduledLessons.tsx) — nothing to clash-check on that
    // side here. Students, though, can still be double-booked into this new
    // group slot while already sitting in an unrelated lesson elsewhere.
    const studentConflicts = await Promise.all(
      validStudents.map(async (name: string) => {
        const { studentConflict } = await checkSchedulingConflicts(SCHOOL_ID, {
          instructorId: null,
          studentName:  name,
          scheduledAt:  body.scheduled_at,
          durationMin:  body.duration_min ?? 60,
        })
        return studentConflict ? name : null
      })
    )
    const clashingStudent = studentConflicts.find(Boolean)
    if (clashingStudent) {
      return NextResponse.json(
        { error: `Não é possível agendar: ${clashingStudent} já possui uma aula marcada para este mesmo horário.` },
        { status: 409 }
      )
    }

    const { data: group, error: groupError } = await supabase
      .from('lesson_groups')
      .insert({
        school_id:    SCHOOL_ID,
        activity_id:  body.activity_id ?? null,
        scheduled_at: body.scheduled_at,
        duration_min: body.duration_min ?? 60,
        notes:        body.notes ?? null,
      })
      .select('id')
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: groupError?.message ?? 'Failed to create group' },
        { status: 500 }
      )
    }

    // Instructors are assigned per student at confirm time, not here — every
    // row in a freshly-scheduled group starts with instructor_id: null.
    const rows = validStudents.map((name: string) => ({
      school_id:       SCHOOL_ID,
      student_name:    name,
      activity_id:     body.activity_id ?? null,
      instructor_id:   null,
      scheduled_at:    body.scheduled_at,
      duration_min:    body.duration_min ?? 60,
      notes:           body.notes ?? null,
      status:          'scheduled',
      group_id:        group.id,
      level:           body.level ?? null,
      package_sale_id: null,
    }))

    const { error: lessonsError } = await supabase
      .from('scheduled_lessons')
      .insert(rows)

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, group_id: group.id })
  }

  // RescheduleModal creates the replacement lesson before deleting the
  // missed one it's replacing (safer order — if creation fails, nothing's
  // lost) and passes that old lesson's id back so it doesn't get
  // double-counted against itself here: same package_sale_id carried
  // forward, same duration, so without this both checks would see the
  // not-yet-deleted original as still "using" that time/capacity.
  const rescheduleFromId: string | undefined = body.reschedule_from_id || undefined

  const { instructorConflict, studentConflict } = await checkSchedulingConflicts(SCHOOL_ID, {
    instructorId:    body.instructor_id || null,
    studentName:     body.student_name,
    scheduledAt:     body.scheduled_at,
    durationMin:     body.duration_min || 60,
    excludeLessonId: rescheduleFromId,
  })
  if (studentConflict) {
    return NextResponse.json({ error: STUDENT_CLASH_ERROR }, { status: 409 })
  }
  if (instructorConflict) {
    return NextResponse.json({ error: INSTRUCTOR_CLASH_ERROR }, { status: 409 })
  }

  if (body.package_sale_id) {
    const capacity = await checkPackageCapacity(SCHOOL_ID, {
      packageSaleId:   body.package_sale_id,
      durationMin:     body.duration_min || 60,
      excludeLessonId: rescheduleFromId,
    })
    if (!capacity.ok) {
      return NextResponse.json({ error: INSUFFICIENT_CREDIT_ERROR }, { status: 409 })
    }
  }

  const { error, data } = await supabase
    .from('scheduled_lessons')
    .insert({
      school_id:    SCHOOL_ID,
      student_name: body.student_name,
      activity_id:  body.activity_id || null,
      instructor_id:body.instructor_id || null,
      scheduled_at: body.scheduled_at,
      duration_min: body.duration_min || 60,
      notes:        body.notes || null,
      level:        body.level || null,
      package_sale_id: body.package_sale_id ?? null,
      status:       'scheduled',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // A lesson scheduled for today — most commonly a same-day/experimental
  // booking with no package yet — should put the student in Sala de
  // Espera right away instead of only Aulas Agendadas. Untouched for
  // lessons scheduled on any other day.
  const today = new Date().toISOString().slice(0, 10)
  if (typeof body.scheduled_at === 'string' && body.scheduled_at.slice(0, 10) === today) {
    try {
      await ensureActiveCheckinForToday(SCHOOL_ID, body.student_name, { activityId: body.activity_id })
    } catch {}
  }

  return NextResponse.json({ ok: true, id: data.id })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  // Set by RescheduleModal: it deletes the old (missed, always in-the-past)
  // lesson right after creating its replacement with the same
  // package_sale_id carried over — the student isn't losing the lesson,
  // just moving it, so the penalty below would otherwise always fire
  // (a missed lesson's scheduled_at is by definition already past) and
  // forfeit a credit that's actually still being used.
  const skipPenalty = searchParams.get('skip_penalty') === '1'

  const supabase = createServiceClient()

  // Regra 4 — cancellation-window penalty: cancellation always proceeds
  // (frees the instructor's slot either way), but if it lands inside the
  // school's configured penalty window, the linked package's credit is
  // forfeited (minutes_used bumped by this lesson's duration) instead of
  // staying available, same as debiting it for a no-show.
  const { data: lesson } = await supabase
    .from('scheduled_lessons')
    .select('scheduled_at, duration_min, package_sale_id, notes')
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)
    .maybeSingle()

  let creditForfeited = false

  if (lesson && !skipPenalty) {
    // Falls back to 24h (this route's long-standing assumption — see
    // notify_late_cancellation's own description copy) if the column isn't
    // there yet or the fetch fails for any reason, rather than erroring out
    // of a cancellation over a missing setting.
    const { data: school } = await supabase
      .from('schools')
      .select('cancellation_window_hours')
      .eq('id', SCHOOL_ID)
      .maybeSingle()

    const windowHours = school?.cancellation_window_hours ?? 24
    const hoursUntilStart = (new Date(lesson.scheduled_at).getTime() - Date.now()) / 3600000
    const withinWindow = hoursUntilStart <= windowHours
    creditForfeited = withinWindow && !!lesson.package_sale_id

    if (creditForfeited) {
      const { data: sale } = await supabase
        .from('package_sales')
        .select('minutes_used')
        .eq('id', lesson.package_sale_id!)
        .maybeSingle()
      if (sale) {
        await supabase
          .from('package_sales')
          .update({ minutes_used: (sale.minutes_used ?? 0) + (lesson.duration_min ?? 0) })
          .eq('id', lesson.package_sale_id!)
      }
    }
  }

  const { error } = await supabase
    .from('scheduled_lessons')
    .update({
      status: 'cancelled',
      ...(creditForfeited ? {
        notes: `[Falta sem aviso — cancelado dentro da janela de penalidade]${lesson?.notes ? ' ' + lesson.notes : ''}`,
      } : {}),
    })
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    penalized: creditForfeited,
    message: creditForfeited
      ? 'Aviso: Este cancelamento está dentro da janela de penalidade. O crédito da aula será debitado.'
      : undefined,
  })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  const supabase = createServiceClient()

  // Only re-validate when the edit actually touches what a clash is defined
  // by — a PATCH that's just correcting notes/level shouldn't pay for a
  // lookup, and (more importantly) shouldn't ever get blocked by it.
  if (updates.scheduled_at && updates.duration_min) {
    const { data: current } = await supabase
      .from('scheduled_lessons')
      .select('group_id, package_sale_id')
      .eq('id', id)
      .eq('school_id', SCHOOL_ID)
      .single()

    const { instructorConflict, studentConflict } = await checkSchedulingConflicts(SCHOOL_ID, {
      instructorId:    updates.instructor_id ?? null,
      studentName:     updates.student_name ?? '',
      scheduledAt:     updates.scheduled_at,
      durationMin:     updates.duration_min,
      excludeLessonId: id,
      groupId:         current?.group_id ?? null,
    })
    if (studentConflict) {
      return NextResponse.json({ error: STUDENT_CLASH_ERROR }, { status: 409 })
    }
    if (instructorConflict) {
      return NextResponse.json({ error: INSTRUCTOR_CLASH_ERROR }, { status: 409 })
    }

    if (current?.package_sale_id) {
      const capacity = await checkPackageCapacity(SCHOOL_ID, {
        packageSaleId:   current.package_sale_id,
        durationMin:     updates.duration_min,
        excludeLessonId: id,
      })
      if (!capacity.ok) {
        return NextResponse.json({ error: INSUFFICIENT_CREDIT_ERROR }, { status: 409 })
      }
    }
  }

  const { error } = await supabase
    .from('scheduled_lessons')
    .update(updates)
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
