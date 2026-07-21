import { createServiceClient } from '@/lib/supabase-server'
import { checkSchedulingConflicts, checkPackageCapacity } from '@/repositories/scheduledLessonRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

/** Backs Aguardando Vento's "Agendar Aula" — a checkin with no scheduled
 *  lesson yet (a walk-in with nothing pre-arranged) gets slotted into a
 *  specific instructor/time instead of being confirmed (charged) on the
 *  spot. Creates the real scheduled_lessons row Aulas Agendadas reads from,
 *  then links it back onto the checkin and marks it deferred so it stops
 *  showing in Aguardando Vento (see migration 20260802000000 for why a
 *  simple scheduled_lesson_id check isn't enough to distinguish this from
 *  a checkin that arrived for an already-existing booking). */
export async function POST(request: Request) {
  const body = await request.json()
  const { checkin_id, activity_id, instructor_id, scheduled_at, duration_min, level, notes } = body

  if (!checkin_id || !scheduled_at) {
    return NextResponse.json({ error: 'checkin_id e scheduled_at são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: checkin, error: checkinError } = await supabase
    .from('checkins')
    .select('student_name, package_sale_id, scheduled_lesson_id')
    .eq('id', checkin_id)
    .eq('school_id', SCHOOL_ID)
    .single()

  if (checkinError || !checkin) {
    return NextResponse.json({ error: 'Check-in não encontrado' }, { status: 404 })
  }
  if (checkin.scheduled_lesson_id) {
    return NextResponse.json({ error: 'Este check-in já está vinculado a uma aula agendada' }, { status: 400 })
  }

  const { instructorConflict, studentConflict } = await checkSchedulingConflicts(SCHOOL_ID, {
    instructorId: instructor_id || null,
    studentName:  checkin.student_name,
    scheduledAt:  scheduled_at,
    durationMin:  duration_min || 60,
  })
  if (studentConflict) {
    return NextResponse.json(
      { error: 'Não é possível agendar: este aluno já possui uma aula marcada para este mesmo horário.' },
      { status: 409 }
    )
  }
  if (instructorConflict) {
    return NextResponse.json(
      { error: 'O instrutor selecionado já possui uma aula agendada para este horário.' },
      { status: 409 }
    )
  }

  if (checkin.package_sale_id) {
    const capacity = await checkPackageCapacity(SCHOOL_ID, {
      studentName:   checkin.student_name,
      packageSaleId: checkin.package_sale_id,
      durationMin:   duration_min || 60,
    })
    if (!capacity.ok) {
      return NextResponse.json(
        { error: 'Saldo de créditos insuficiente. O aluno precisa de adquirir um novo pacote para agendar.' },
        { status: 409 }
      )
    }
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('scheduled_lessons')
    .insert({
      school_id:       SCHOOL_ID,
      student_name:    checkin.student_name,
      activity_id:     activity_id || null,
      instructor_id:   instructor_id || null,
      scheduled_at,
      duration_min:    duration_min || 60,
      level:           level || null,
      notes:           notes || null,
      package_sale_id: checkin.package_sale_id ?? null,
      status:          'scheduled',
    })
    .select('id')
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: lessonError?.message ?? 'Falha ao agendar' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('checkins')
    .update({ scheduled_lesson_id: lesson.id, deferred_to_schedule: true })
    .eq('id', checkin_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: lesson.id })
}
