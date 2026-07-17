import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

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
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceClient()
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
