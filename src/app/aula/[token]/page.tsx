import { notFound } from 'next/navigation'
import { getScheduledLessonByToken } from '@/repositories/scheduledLessonRepository'
import { getPendingOwnerProposalForLesson } from '@/repositories/lessonRequestRepository'
import LessonActionForm from './LessonActionForm'

export default async function AulaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const lesson = await getScheduledLessonByToken(token)
  if (!lesson) notFound()

  const proposal = await getPendingOwnerProposalForLesson(lesson.id)
  const rd = proposal?.requested_data as { proposed_date?: string; proposed_time?: string } | null

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
      pendingProposal={
        rd?.proposed_date && rd?.proposed_time
          ? { proposedDate: rd.proposed_date, proposedTime: rd.proposed_time }
          : null
      }
    />
  )
}
