import { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'

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

  const [{ data, error }, { data: students }] = await Promise.all([
    supabase
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
        package_sale_id,
        activities ( id, name, default_price, default_duration_min ),
        instructor:users!scheduled_lessons_instructor_id_fkey ( id, name, whatsapp )
      `)
      .eq('school_id', schoolId)
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true }),

    // scheduled_lessons.student_id is rarely populated (schedule route never
    // sets it) — same fuzzy name-match approach used everywhere else in this
    // app for "find this student's contact info" without a reliable FK.
    supabase.from('students').select('name, whatsapp').eq('school_id', schoolId),
  ])

  if (error) throw error

  const whatsappByName = new Map<string, string | null>()
  for (const s of students ?? []) {
    whatsappByName.set(normalizeStudentName(s.name), s.whatsapp)
  }

  return (data ?? []).map(lesson => ({
    ...lesson,
    student_whatsapp: whatsappByName.get(normalizeStudentName(lesson.student_name)) ?? null,
  }))
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

  const [{ data, error }, { data: students }] = await Promise.all([
    supabase
      .from('scheduled_lessons')
      .select(`
        id, student_name, scheduled_at, duration_min,
        activities ( id, name ),
        instructor:users!scheduled_lessons_instructor_id_fkey ( name )
      `)
      .eq('school_id', schoolId)
      .eq('status', 'scheduled')
      .lt('scheduled_at', cutoff)
      .order('scheduled_at', { ascending: false })
      .limit(10),
    // Same fuzzy name-match approach as getScheduledLessons — needed here
    // too now that the reschedule flow sends a WhatsApp confirmation.
    supabase.from('students').select('name, whatsapp').eq('school_id', schoolId),
  ])

  if (error) {
    console.error('getMissedLessons error:', error)
    return []
  }

  const whatsappByName = new Map<string, string | null>()
  for (const s of students ?? []) {
    whatsappByName.set(normalizeStudentName(s.name), s.whatsapp)
  }

  return (data ?? []).map(lesson => ({
    ...lesson,
    student_whatsapp: whatsappByName.get(normalizeStudentName(lesson.student_name)) ?? null,
  }))
}

const MODALITY_KEYWORDS = ['kitesurf', 'wingfoil', 'kitefoil', 'surf', 'windsurf'] as const

/** Same prefix-match convention as ScheduledLessons.tsx's sport filter —
 *  a plain substring check would let "Surf" false-match "Kitesurf"/
 *  "Windsurf" (both contain "surf"), but neither starts with it. */
function detectModality(activityName: string | null | undefined): string | null {
  const normalized = (activityName ?? '').toLowerCase().replace(/[^a-z]/g, '')
  return MODALITY_KEYWORDS.find(m => normalized.startsWith(m)) ?? null
}

const RESCHEDULE_CANDIDATE_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const RESCHEDULE_SEARCH_DAYS = 7

/** Suggests the next open slot for rescheduling a missed lesson: detect the
 *  modality from the activity name, prefer an instructor who has it tagged
 *  in users.sports, and scan hourly 8-17 slots over the next 7 days
 *  (starting tomorrow) for the first one where that instructor has no
 *  conflicting scheduled_lessons. Falls back to every active instructor
 *  when nobody has the modality tagged (or it can't be detected) — a
 *  school that hasn't filled in instructor specialties yet shouldn't lose
 *  the feature entirely. Returns null if nothing opens up in that window;
 *  the caller then falls back to manual date/time/instructor selection. */
export async function getRescheduleSuggestion(
  schoolId: string,
  activityName: string | null | undefined,
  durationMin: number,
  excludeLessonId: string
): Promise<{ date: string; time: string; instructor_id: string; instructor_name: string } | null> {
  const supabase = createServiceClient()
  const modality = detectModality(activityName)

  const { data: allInstructors } = await supabase
    .from('users')
    .select('id, name, sports')
    .eq('school_id', schoolId)
    .in('role', ['instructor', 'owner'])
    .eq('active', true)
    .order('name')

  const compatible = modality
    ? (allInstructors ?? []).filter(i => (i.sports ?? []).includes(modality))
    : []
  const pool = compatible.length > 0 ? compatible : (allInstructors ?? [])
  if (pool.length === 0) return null

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() + 1)
  windowStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(windowStart)
  windowEnd.setDate(windowEnd.getDate() + RESCHEDULE_SEARCH_DAYS)

  const { data: busy } = await supabase
    .from('scheduled_lessons')
    .select('instructor_id, scheduled_at, duration_min')
    .eq('school_id', schoolId)
    .neq('status', 'cancelled')
    .neq('id', excludeLessonId)
    .gte('scheduled_at', windowStart.toISOString())
    .lt('scheduled_at', windowEnd.toISOString())

  const busyByInstructor = new Map<string, Array<{ start: number; end: number }>>()
  for (const b of busy ?? []) {
    if (!b.instructor_id) continue
    const start = new Date(b.scheduled_at).getTime()
    const end = start + (b.duration_min ?? 60) * 60000
    if (!busyByInstructor.has(b.instructor_id)) busyByInstructor.set(b.instructor_id, [])
    busyByInstructor.get(b.instructor_id)!.push({ start, end })
  }

  for (let day = 0; day < RESCHEDULE_SEARCH_DAYS; day++) {
    const date = new Date(windowStart)
    date.setDate(date.getDate() + day)
    const dateStr = date.toISOString().slice(0, 10)

    for (const hour of RESCHEDULE_CANDIDATE_HOURS) {
      const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00-03:00`).getTime()
      const slotEnd = slotStart + durationMin * 60000

      for (const instructor of pool) {
        const busySlots = busyByInstructor.get(instructor.id) ?? []
        const conflict = busySlots.some(b => slotStart < b.end && slotEnd > b.start)
        if (!conflict) {
          return {
            date: dateStr,
            time: `${String(hour).padStart(2, '0')}:00`,
            instructor_id: instructor.id,
            instructor_name: instructor.name,
          }
        }
      }
    }
  }

  return null
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
