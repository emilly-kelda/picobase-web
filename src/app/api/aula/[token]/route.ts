import { NextResponse } from 'next/server'
import {
  getScheduledLessonByToken,
  markStudentConfirmedByToken,
} from '@/repositories/scheduledLessonRepository'
import { createLessonRequest } from '@/repositories/lessonRequestRepository'

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

    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
}
