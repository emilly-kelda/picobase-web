import { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'
import { resolveDefaultLevel, type Level } from '@/lib/levels'
import { decrypt } from '@/utils/crypto'

export async function getPendingLessons(schoolId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('checkins')
    .select(`
      id,
      student_name,
      student_nationality,
      student_email,
      student_whatsapp,
      document_number,
      document_type,
      health_condition,
      emergency_name,
      emergency_phone,
      birthdate,
      checkin_at,
      activity_id,
      instructor_id,
      is_minor,
      guardian_name,
      scheduled_lesson_id,
      source,
      partner_id,
      stage,
      checked_in,
      activities ( id, name, default_price, default_duration_min ),
      instructor:users!checkins_instructor_id_fkey ( id, name ),
      partner:partners!checkins_partner_id_fkey ( id, name, type ),
      scheduled_lesson:scheduled_lessons!checkins_scheduled_lesson_id_fkey (
        id, scheduled_at, duration_min, level,
        activities ( id, name, default_price, default_duration_min ),
        instructor:users!scheduled_lessons_instructor_id_fkey ( id, name )
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'checked_in')
    // A checkin whose lesson got deferred to a later scheduled slot (the
    // "Agendar Aula" action) isn't waiting on anything right now — it'll
    // reappear as a scheduled_lessons row in Aulas Agendadas instead. A
    // checkin that arrived already matched to a pre-existing booking keeps
    // deferred_to_schedule = false and still shows here, ready to confirm.
    .eq('deferred_to_schedule', false)
    .gte('checkin_at', `${today}T00:00:00`)
    .order('checkin_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(c => ({
    ...c,
    health_condition: c.health_condition ? decrypt(c.health_condition) : c.health_condition,
  }))
}

/** Default level for (studentName, activityId): most recent CONFIRMED session's
 *  level in that activity, per the rules in lib/levels.ts. Bounded to the 300
 *  most recent confirmed sessions in the activity — plenty for a single school's
 *  season, and avoids scanning unbounded history. */
export async function getDefaultLevelForStudent(
  schoolId: string,
  studentName: string,
  activityId: string | null | undefined
): Promise<{ level: Level; experimentalDisabled: boolean }> {
  if (!activityId) return resolveDefaultLevel(null, false)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('level, session_date, confirmed_at, checkins ( student_name )')
    .eq('school_id', schoolId)
    .eq('activity_id', activityId)
    .order('session_date', { ascending: false })
    .order('confirmed_at', { ascending: false })
    .limit(300)

  if (error) throw error

  const target = normalizeStudentName(studentName)
  const match = (data ?? []).find(
    s => normalizeStudentName((s.checkins as { student_name?: string } | null)?.student_name) === target
  )

  return resolveDefaultLevel(match?.level ?? null, !!match)
}

export async function getRecentSessions(schoolId: string, limit = 8) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_min,
      price,
      commission_amount,
      instructor:users!sessions_instructor_id_fkey ( id, name, role ),
      checkins ( student_name ),
      activities ( name )
    `)
    .eq('school_id', schoolId)
    .order('session_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getSessions(
  schoolId: string,
  filters?: {
    month?: string
    instructorId?: string
    origin?: string
  }
) {
  const supabase = createServiceClient()
  let query = supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_min,
      price,
      currency,
      price_original,
      commission_amount,
      commission_pct,
      origin,
      session_type,
      payment_method,
      instructor:users!sessions_instructor_id_fkey ( id, name, role ),
      checkins ( student_name ),
      activities ( name ),
      partners ( name )
    `)
    .eq('school_id', schoolId)
    .order('session_date', { ascending: false })
    .order('confirmed_at', { ascending: false })

  if (filters?.month) {
    const [y, m] = filters.month.split('-').map(Number)
    const start = `${filters.month}-01`
    const nextFirst = new Date(y, m, 1).toISOString().slice(0, 10)
    query = query.gte('session_date', start).lt('session_date', nextFirst)
  }

  if (filters?.instructorId) {
    query = query.eq('instructor_id', filters.instructorId)
  }

  if (filters?.origin) {
    query = query.eq('origin', filters.origin)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getTodayStats(schoolId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ count: sessionsToday }, { data: checkinsToday }, { data: instructorsToday }, { data: revenueToday }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('session_date', today)
        .lte('session_date', today),

      supabase
        .from('checkins')
        .select('id')
        .eq('school_id', schoolId)
        .gte('checkin_at', `${today}T00:00:00`)
        .neq('status', 'cancelled'),

      supabase
        .from('sessions')
        .select('instructor_id')
        .eq('school_id', schoolId)
        .gte('session_date', today)
        .lte('session_date', today),

      supabase
        .from('sessions')
        .select('price, commission_amount')
        .eq('school_id', schoolId)
        .gte('session_date', today)
        .lte('session_date', today),
    ])

  const uniqueInstructors = new Set(
    (instructorsToday ?? []).map(s => s.instructor_id)
  ).size

  const todayRevenue     = (revenueToday ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const todayCommissions = (revenueToday ?? []).reduce((s, r) => s + (r.commission_amount ?? 0), 0)

  return {
    sessions:    sessionsToday ?? 0,
    students:    checkinsToday?.length ?? 0,
    instructors: uniqueInstructors,
    revenue:     todayRevenue,
    commissions: todayCommissions,
    hasActivity: (sessionsToday ?? 0) > 0 || (checkinsToday?.length ?? 0) > 0,
  }
}

/** Month-to-date revenue/lesson count vs. the same day-range last month, for
 *  the Base Camp "vs. last month" indicator. Clamps the last-month cutoff
 *  day to that month's actual length (e.g. May 31 → Apr 30, not an
 *  overflowed May 1) instead of using Date#setMonth, which mis-rolls on
 *  short months. */
export async function getMonthComparison(schoolId: string) {
  const supabase = createServiceClient()
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()
  const day = now.getDate()

  const thisMonthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const todayStr       = now.toISOString().slice(0, 10)

  const prevMonthDate   = new Date(y, m - 1, 1)
  const py              = prevMonthDate.getFullYear()
  const pm              = prevMonthDate.getMonth()
  const daysInPrevMonth = new Date(py, pm + 1, 0).getDate()
  const prevDay         = Math.min(day, daysInPrevMonth)

  const lastMonthStart   = `${py}-${String(pm + 1).padStart(2, '0')}-01`
  const lastMonthSameDay = `${py}-${String(pm + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`

  const [{ data: thisMonth }, { data: lastMonth }] = await Promise.all([
    supabase
      .from('sessions')
      .select('price')
      .eq('school_id', schoolId)
      .gte('session_date', thisMonthStart)
      .lte('session_date', todayStr),

    supabase
      .from('sessions')
      .select('price')
      .eq('school_id', schoolId)
      .gte('session_date', lastMonthStart)
      .lte('session_date', lastMonthSameDay),
  ])

  const thisMonthRevenue = (thisMonth ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const lastMonthRevenue = (lastMonth ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const thisMonthLessons = thisMonth?.length ?? 0
  const lastMonthLessons = lastMonth?.length ?? 0

  const revenueDelta = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : null
  const lessonDelta = lastMonthLessons > 0
    ? ((thisMonthLessons - lastMonthLessons) / lastMonthLessons) * 100
    : null

  return {
    thisMonthRevenue, lastMonthRevenue, revenueDelta,
    thisMonthLessons, lastMonthLessons, lessonDelta,
  }
}

export async function getSessionTotals(
  schoolId: string,
  filters?: { month?: string; instructorId?: string; origin?: string }
) {
  const sessions = await getSessions(schoolId, filters)
  const revenue     = sessions.reduce((s, r) => s + (r.price ?? 0), 0)
  const commissions = sessions.reduce((s, r) => s + (r.commission_amount ?? 0), 0)
  // Exact division requested: filtered season revenue / filtered session
  // count — so it moves with whatever month/instructor/origin filter is
  // active, same as the other totals cards.
  const avgTicket = sessions.length > 0 ? revenue / sessions.length : 0
  const totalDuration = sessions.reduce((s, r) => s + (r.duration_min ?? 0), 0)
  const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0
  return { count: sessions.length, revenue, commissions, avgTicket, avgDuration }
}

export async function getPendingCheckins(schoolId: string, instructorId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('checkins')
    .select(`
      id,
      student_name,
      student_nationality,
      health_condition,
      checkin_at,
      activity_id,
      activities ( id, name, default_price, default_duration_min )
    `)
    .eq('school_id', schoolId)
    .eq('instructor_id', instructorId)
    .eq('status', 'checked_in')
    .gte('checkin_at', `${today}T00:00:00`)
    .order('checkin_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(c => ({
    ...c,
    health_condition: c.health_condition ? decrypt(c.health_condition) : c.health_condition,
  }))
}

export async function getSessionsByInstructorAndPeriod(
  schoolId: string,
  instructorId: string,
  period: string
) {
  const supabase = createServiceClient()

  const [y, m] = period.split('-').map(Number)
  const start    = `${period}-01`
  const nextFirst = new Date(y, m, 1).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      session_date,
      duration_min,
      price,
      commission_pct,
      commission_amount,
      checkins ( student_name ),
      activities ( name )
    `)
    .eq('school_id', schoolId)
    .eq('instructor_id', instructorId)
    .gte('session_date', start)
    .lt('session_date', nextFirst)
    .order('session_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getTodayInstructorStats(schoolId: string, instructorId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: todaySessions }, { data: seasonSessions }] = await Promise.all([
    supabase
      .from('sessions')
      .select('commission_amount, price')
      .eq('school_id', schoolId)
      .eq('instructor_id', instructorId)
      .gte('session_date', today)
      .lte('session_date', today),

    supabase
      .from('sessions')
      .select('commission_amount')
      .eq('school_id', schoolId)
      .eq('instructor_id', instructorId),
  ])

  const todayCommission = (todaySessions ?? []).reduce((s, r) => s + (r.commission_amount ?? 0), 0)
  const todayRevenue    = (todaySessions ?? []).reduce((s, r) => s + (r.price ?? 0), 0)
  const seasonTotal     = (seasonSessions ?? []).reduce((s, r) => s + (r.commission_amount ?? 0), 0)
  const todayCount      = todaySessions?.length ?? 0

  return { todayCommission, todayRevenue, seasonTotal, todayCount }
}

export async function getMissedLessons(schoolId: string) {
  const supabase = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: checkins, error } = await supabase
    .from('checkins')
    .select(`
      id,
      student_name,
      checkin_at,
      instructor_id,
      instructor:users!checkins_instructor_id_fkey (
        id,
        name
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'checked_in')
    .lt('checkin_at', today.toISOString())

  if (error) throw error

  const { data: sessions } = await supabase
    .from('sessions')
    .select('checkin_id')

  const sessionIds = new Set(
    (sessions ?? []).map(s => s.checkin_id)
  )

  return (checkins ?? []).filter(
    c => !sessionIds.has(c.id)
  )
}


