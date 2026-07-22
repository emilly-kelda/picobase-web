import { notFound } from 'next/navigation'
import { getScheduledLessonByToken } from '@/repositories/scheduledLessonRepository'
import LessonActionForm from './LessonActionForm'

export default async function AulaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const lesson = await getScheduledLessonByToken(token)
  if (!lesson) notFound()

  // Only student-safe fields cross into the client component — no ids,
  // notes, or financial/package data (see getScheduledLessonByToken).
  return (
    <LessonActionForm
      token={token}
      studentName={lesson.student_name}
      scheduledAt={lesson.scheduled_at}
      durationMin={lesson.duration_min}
      status={lesson.status}
      studentConfirmedAt={lesson.student_confirmed_at}
      activityName={(lesson.activities as unknown as { name: string } | null)?.name ?? null}
      instructorName={(lesson.instructor as unknown as { name: string } | null)?.name ?? null}
      schoolName={(lesson.schools as unknown as { name: string } | null)?.name ?? 'Pico Base'}
    />
  )
}
