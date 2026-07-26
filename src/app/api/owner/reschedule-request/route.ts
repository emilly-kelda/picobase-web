import { createServiceClient } from '@/lib/supabase-server'
import { createOwnerRescheduleProposal } from '@/repositories/lessonRequestRepository'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

// Owner-under-/api/owner convention, not api/reschedule/request as a
// standalone tree — every other owner-dashboard-triggered mutation in this
// app (schedule, sell-package, progression, confirm-lesson...) lives under
// /api/owner/*, and this is one more of those, not a public-facing route.
export async function POST(request: Request) {
  const { scheduled_lesson_id, proposed_date, proposed_time, proposed_instructor_id } = await request.json()

  if (!scheduled_lesson_id || !proposed_date || !proposed_time) {
    return NextResponse.json(
      { error: 'scheduled_lesson_id, proposed_date e proposed_time são obrigatórios' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const { data: lesson, error: lessonError } = await supabase
    .from('scheduled_lessons')
    .select('id, public_token, status')
    .eq('id', scheduled_lesson_id)
    .eq('school_id', SCHOOL_ID)
    .maybeSingle()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
  }
  if (lesson.status === 'cancelled') {
    return NextResponse.json({ error: 'Esta aula já foi cancelada' }, { status: 409 })
  }

  try {
    await createOwnerRescheduleProposal(SCHOOL_ID, scheduled_lesson_id, proposed_date, proposed_time, proposed_instructor_id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar proposta de reagendamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, public_token: lesson.public_token })
}
