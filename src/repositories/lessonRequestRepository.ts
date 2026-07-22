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
  return count ?? 0
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
