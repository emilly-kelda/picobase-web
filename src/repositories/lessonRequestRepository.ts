import { createServiceClient } from '@/lib/supabase-server'

export async function createLessonRequest(payload: {
  school_id: string
  scheduled_lesson_id: string
  type: 'reschedule' | 'cancellation'
  requested_data: Record<string, unknown> | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('lesson_requests').insert(payload)
  if (error) throw error
  return { ok: true }
}

// Requests the owner's own PendingRequestsAlert should surface — excludes
// 'owner_proposed_reschedule', the opposite-direction flow where the owner
// is the one who proposed and the student is who needs to act. Applied
// consistently in both queries below so the count badge and the list it
// backs never disagree.
const OWNER_ACTIONABLE_TYPES = ['reschedule', 'cancellation'] as const

/** Feeds the operator's recurring alert modal — embeds enough of the
 *  underlying scheduled_lessons row (current slot, activity, instructor) to
 *  render the request without a second round-trip per row. */
export async function getPendingLessonRequests(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('lesson_requests')
    .select(`
      id,
      type,
      requested_data,
      created_at,
      scheduled_lesson_id,
      scheduled_lessons (
        student_name,
        scheduled_at,
        duration_min,
        activities ( name ),
        instructor:users!scheduled_lessons_instructor_id_fkey ( name )
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .in('type', OWNER_ACTIONABLE_TYPES)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getPendingLessonRequestsCount(schoolId: string) {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('lesson_requests')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .in('type', OWNER_ACTIONABLE_TYPES)
  return count ?? 0
}

/** RescheduleModal's "Reagendar" on a missed lesson — proposes a new time
 *  instead of moving it immediately. The original scheduled_lessons row is
 *  untouched (still its old, already-past scheduled_at) until the student
 *  accepts via their /aula/[token] link (see api/aula/[token]'s
 *  accept_reschedule/decline_reschedule actions). */
export async function createOwnerRescheduleProposal(
  schoolId: string,
  scheduledLessonId: string,
  proposedDate: string,
  proposedTime: string,
  proposedInstructorId?: string | null
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('lesson_requests').insert({
    school_id:           schoolId,
    scheduled_lesson_id: scheduledLessonId,
    type:                'owner_proposed_reschedule',
    requested_data:      {
      proposed_date:         proposedDate,
      proposed_time:         proposedTime,
      proposed_instructor_id: proposedInstructorId || null,
    },
    status: 'pending',
  })
  if (error) throw error
  return { ok: true }
}

/** The one pending owner-proposed reschedule for a lesson, if any — read by
 *  the public /aula/[token] page to decide whether to show the Aceitar/
 *  Manter buttons. Null (not an error) when there's no active proposal,
 *  same convention as getLessonRequestById. */
export async function getPendingOwnerProposalForLesson(scheduledLessonId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('lesson_requests')
    .select('id, requested_data')
    .eq('scheduled_lesson_id', scheduledLessonId)
    .eq('type', 'owner_proposed_reschedule')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function getLessonRequestById(id: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('lesson_requests')
    .select('id, school_id, type, status, scheduled_lesson_id, requested_data')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function resolveLessonRequest(id: string, status: 'approved' | 'rejected') {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('lesson_requests')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  return { ok: true }
}
