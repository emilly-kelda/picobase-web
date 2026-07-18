import { createServiceClient } from '@/lib/supabase-server'

export async function getScheduledLessons(
  schoolId: string,
  date: 'today' | 'tomorrow' | string
) {
  const supabase = createServiceClient()

  let targetDate: string
  if (date === 'today') {
    targetDate = new Date().toISOString().slice(0, 10)
  } else if (date === 'tomorrow') {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    targetDate = d.toISOString().slice(0, 10)
  } else {
    targetDate = date
  }

  const start = `${targetDate}T00:00:00`
  const end   = `${targetDate}T23:59:59`

  const { data, error } = await supabase
    .from('scheduled_lessons')
    .select(`
      id,
      student_name,
      student_id,
      scheduled_at,
      duration_min,
      status,
      notes,
      level,
      group_id,
      activities ( id, name, default_price, default_duration_min ),
      instructor:users!scheduled_lessons_instructor_id_fkey ( id, name )
    `)
    .eq('school_id', schoolId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .neq('status', 'cancelled')
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Upcoming/pending lessons for the "Agendadas" tab on /owner/sessions —
 *  status stays 'scheduled' until confirm-lesson flips it to 'confirmed' or
 *  it's cancelled, so filtering on status alone already covers "future or
 *  still pending" (a past lesson nobody confirmed yet is still actionable,
 *  same as getMissedLessons surfaces separately). */
export async function getScheduledLessonsList(
  schoolId: string,
  filters?: { month?: string; instructorId?: string }
) {
  const supabase = createServiceClient()
  let query = supabase
    .from('scheduled_lessons')
    .select(`
      id,
      student_name,
      scheduled_at,
      duration_min,
      level,
      status,
      instructor:users!scheduled_lessons_instructor_id_fkey ( id, name, role ),
      activities ( name, default_price )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })

  if (filters?.month) {
    const [y, m] = filters.month.split('-').map(Number)
    const start = `${filters.month}-01T00:00:00`
    const nextFirst = new Date(y, m, 1).toISOString().slice(0, 10) + 'T00:00:00'
    query = query.gte('scheduled_at', start).lt('scheduled_at', nextFirst)
  }

  if (filters?.instructorId) {
    query = query.eq('instructor_id', filters.instructorId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getMissedLessons(schoolId: string) {
  const supabase = createServiceClient()
  const cutoff   = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('scheduled_lessons')
    .select(`
      id, student_name, scheduled_at, duration_min,
      activities ( name ),
      instructor:users!scheduled_lessons_instructor_id_fkey ( name )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .lt('scheduled_at', cutoff)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('getMissedLessons error:', error)
    return []
  }
  return data ?? []
}

export async function createScheduledLesson(payload: {
  school_id: string
  student_name: string
  activity_id: string | null
  instructor_id: string | null
  scheduled_at: string
  notes?: string
}) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scheduled_lessons')
    .insert({ ...payload, status: 'scheduled' })
    .select('id')
    .single()
  if (error) throw error
  return data
}
