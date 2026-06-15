import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()

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
