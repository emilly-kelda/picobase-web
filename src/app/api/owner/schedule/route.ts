import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

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
  return NextResponse.json({ ok: true, id: data.id })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  const supabase = createServiceClient()

  // TODO(notify_late_cancellation): once a message-dispatch service
  // (Z-API, Evolution API, or similar) is wired up, check
  // schools.notify_late_cancellation here before sending — this is the
  // correct trigger point (a cancellation always goes through this DELETE),
  // but it needs the row's scheduled_at first (not currently selected
  // here) to know whether "now" is within 24h of it. If so, notify the
  // student that the hour is debited / the refund is forfeited. No
  // dispatch exists yet.

  const { error } = await supabase
    .from('scheduled_lessons')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('scheduled_lessons')
    .update(updates)
    .eq('id', id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
