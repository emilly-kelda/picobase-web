import { createServiceClient } from '@/lib/supabase-server'

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
      users!sessions_instructor_id_fkey ( id, name ),
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
      commission_amount,
      commission_pct,
      origin,
      session_type,
      users!sessions_instructor_id_fkey ( id, name ),
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

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getTodayStats(schoolId: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ count: sessionsToday }, { data: checkinsToday }, { data: instructorsToday }] =
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
    ])

  const uniqueInstructors = new Set(
    (instructorsToday ?? []).map(s => s.instructor_id)
  ).size

  return {
    sessions:    sessionsToday ?? 0,
    students:    checkinsToday?.length ?? 0,
    instructors: uniqueInstructors,
  }
}

export async function getSessionTotals(
  schoolId: string,
  filters?: { month?: string; instructorId?: string }
) {
  const sessions = await getSessions(schoolId, filters)
  const revenue     = sessions.reduce((s, r) => s + (r.price ?? 0), 0)
  const commissions = sessions.reduce((s, r) => s + (r.commission_amount ?? 0), 0)
  return { count: sessions.length, revenue, commissions }
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

