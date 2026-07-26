import { NextResponse } from 'next/server'
import {
  getScheduledLessonByToken,
  markStudentConfirmedByToken,
} from '@/repositories/scheduledLessonRepository'
import {
  createLessonRequest,
  getPendingOwnerProposalForLesson,
  resolveLessonRequest,
} from '@/repositories/lessonRequestRepository'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()

  const lesson = await getScheduledLessonByToken(token)
  if (!lesson) {
    return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
  }
  if (lesson.status === 'cancelled') {
    return NextResponse.json({ error: 'Esta aula já foi cancelada' }, { status: 409 })
  }

  switch (body.action) {
    case 'confirm': {
      await markStudentConfirmedByToken(token)
      return NextResponse.json({ ok: true })
    }

    case 'reschedule': {
      if (!body.proposed_date || !body.proposed_time) {
        return NextResponse.json({ error: 'Data e horário são obrigatórios' }, { status: 400 })
      }
      await createLessonRequest({
        school_id: lesson.school_id,
        scheduled_lesson_id: lesson.id,
        type: 'reschedule',
        requested_data: {
          proposed_date: body.proposed_date,
          proposed_time: body.proposed_time,
          reason: body.reason ?? null,
        },
      })
      return NextResponse.json({ ok: true })
    }

    case 'cancel': {
      await createLessonRequest({
        school_id: lesson.school_id,
        scheduled_lesson_id: lesson.id,
        type: 'cancellation',
        requested_data: { reason: body.reason ?? null },
      })
      return NextResponse.json({ ok: true })
    }

    // Owner-proposed reschedule (RescheduleModal, missed lessons) — the
    // student accepting or declining the new time the owner sent, not the
    // student's own request above. Re-reads the pending proposal
    // server-side rather than trusting whatever the client sends, since
    // this endpoint has no auth beyond the token itself.
    case 'accept_reschedule': {
      const proposal = await getPendingOwnerProposalForLesson(lesson.id)
      if (!proposal) {
        return NextResponse.json({ error: 'Nenhuma proposta de reagendamento pendente' }, { status: 404 })
      }
      const rd = proposal.requested_data as {
        proposed_date?: string; proposed_time?: string; proposed_instructor_id?: string | null
      } | null
      if (!rd?.proposed_date || !rd?.proposed_time) {
        return NextResponse.json({ error: 'Proposta sem data/horário' }, { status: 400 })
      }

      const supabase = createServiceClient()
      const update: Record<string, unknown> = {
        // Fortaleza (-03:00) offset — same convention as reschedule-suggestion
        // and lesson-requests/[id]'s own reschedule-approval path.
        scheduled_at: `${rd.proposed_date}T${rd.proposed_time}:00-03:00`,
      }
      if (rd.proposed_instructor_id) update.instructor_id = rd.proposed_instructor_id

      const { error: updateError } = await supabase
        .from('scheduled_lessons')
        .update(update)
        .eq('id', lesson.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await resolveLessonRequest(proposal.id, 'approved')
      return NextResponse.json({ ok: true })
    }

    case 'decline_reschedule': {
      const proposal = await getPendingOwnerProposalForLesson(lesson.id)
      if (!proposal) {
        return NextResponse.json({ error: 'Nenhuma proposta de reagendamento pendente' }, { status: 404 })
      }
      // Lesson itself is untouched — still its old time, still 'scheduled'
      // and already past, so it naturally resurfaces in Aulas Perdidas for
      // the instructor to try again (the "notified in the panel" this
      // decline needs, without a separate notification channel).
      await resolveLessonRequest(proposal.id, 'rejected')
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
}
