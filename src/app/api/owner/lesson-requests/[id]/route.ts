import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { DELETE as scheduleDelete, PATCH as schedulePatch } from '@/app/api/owner/schedule/route'
import { getLessonRequestById, resolveLessonRequest } from '@/repositories/lessonRequestRepository'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const action = body.action

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const lessonRequest = await getLessonRequestById(id)
  if (!lessonRequest) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (lessonRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Este pedido já foi resolvido' }, { status: 409 })
  }

  if (action === 'reject') {
    await resolveLessonRequest(id, 'rejected')
    return NextResponse.json({ ok: true })
  }

  // action === 'approve', reuse the existing schedule DELETE/PATCH handlers
  // verbatim (via a synthetic Request) instead of duplicating their clash/
  // capacity/penalty logic.
  if (lessonRequest.type === 'cancellation') {
    const res = await scheduleDelete(
      new Request(`http://internal/api/owner/schedule?id=${lessonRequest.scheduled_lesson_id}`, {
        method: 'DELETE',
      })
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    await resolveLessonRequest(id, 'approved')
    return NextResponse.json({ ok: true, penalized: data.penalized, message: data.message })
  }

  // type === 'reschedule' — the schedule PATCH handler only runs
  // instructor/student clash checks when instructor_id/student_name are in
  // the request body, so those must come from the lesson's current row,
  // not be omitted.
  const supabase = createServiceClient()
  const { data: lesson } = await supabase
    .from('scheduled_lessons')
    .select('instructor_id, student_name, duration_min')
    .eq('id', lessonRequest.scheduled_lesson_id)
    .eq('school_id', SCHOOL_ID)
    .maybeSingle()

  if (!lesson) {
    return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
  }

  const rd = lessonRequest.requested_data as { proposed_date?: string; proposed_time?: string } | null
  if (!rd?.proposed_date || !rd?.proposed_time) {
    return NextResponse.json({ error: 'Pedido de reagendamento sem data/horário' }, { status: 400 })
  }

  // Fortaleza (-03:00) offset — same convention as the reschedule-suggestion
  // scan in scheduledLessonRepository.ts.
  const scheduledAt = `${rd.proposed_date}T${rd.proposed_time}:00-03:00`

  const res = await schedulePatch(
    new Request('http://internal/api/owner/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lessonRequest.scheduled_lesson_id,
        scheduled_at: scheduledAt,
        duration_min: lesson.duration_min,
        instructor_id: lesson.instructor_id,
        student_name: lesson.student_name,
      }),
    })
  )
  const data = await res.json()
  if (!res.ok) {
    // Conflict (409) or other failure — leave the request pending so staff
    // can resolve it manually instead of failing silently.
    return NextResponse.json(data, { status: res.status })
  }
  await resolveLessonRequest(id, 'approved')
  return NextResponse.json({ ok: true })
}
