import { createServiceClient } from '@/lib/supabase-server'

export async function getStudents(schoolId: string, search?: string) {
  const supabase = createServiceClient()
  let query = supabase
    .from('students')
    .select(`
      id,
      name,
      email,
      whatsapp,
      nationality,
      skill_level,
      health_conditions,
      created_at
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudentCount(schoolId: string) {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
  if (error) throw error
  return count ?? 0
}

export async function getStudentById(schoolId: string, id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, email, whatsapp, nationality, skill_level, health_conditions, created_at')
    .eq('school_id', schoolId)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getSessionsByStudent(schoolId: string, studentName: string, studentId?: string) {
  const supabase = createServiceClient()

  const [nameResult, idResult] = await Promise.all([
    supabase.from('checkins').select('session_id').eq('school_id', schoolId).eq('student_name', studentName),
    studentId
      ? supabase.from('checkins').select('session_id').eq('school_id', schoolId).eq('student_id', studentId)
      : Promise.resolve({ data: [] as { session_id: string | null }[] }),
  ])

  const sessionIds = [
    ...new Set([
      ...(nameResult.data ?? []).map((c: any) => c.session_id).filter(Boolean),
      ...(idResult.data ?? []).map((c: any) => c.session_id).filter(Boolean),
    ]),
  ]

  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, session_date, duration_min, price, commission_amount,
      users!sessions_instructor_id_fkey ( name ),
      activities ( name )
    `)
    .in('id', sessionIds)
    .order('session_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getActivePackagesByStudent(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select(`
      id,
      student_name,
      minutes_purchased,
      minutes_used,
      status,
      packages ( name )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'active')
  if (error) throw error

  const map = new Map<string, {
    id: string
    minutes_purchased: number
    minutes_used: number
    package_name: string
  }>()

  for (const sale of data ?? []) {
    map.set(sale.student_name, {
      id: sale.id,
      minutes_purchased: sale.minutes_purchased,
      minutes_used: sale.minutes_used,
      package_name: (sale.packages as any)?.name ?? 'Package',
    })
  }

  return map
}

/** Fetch sessions for a student by name (case-insensitive). Used for name-keyed profiles. */
export async function getSessionsByStudentName(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data: checkinRows } = await supabase
    .from('checkins')
    .select('session_id')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName.trim())

  const sessionIds = [...new Set(
    (checkinRows ?? []).map((c: any) => c.session_id).filter(Boolean),
  )]
  if (sessionIds.length === 0) return []

  const { data } = await supabase
    .from('sessions')
    .select(`
      id, session_date, duration_min, price, commission_amount,
      users!sessions_instructor_id_fkey ( name ),
      activities ( name )
    `)
    .in('id', sessionIds)
    .order('session_date', { ascending: false })
  return data ?? []
}

/** Most recent check-in for a student by name — source of contact/health info. */
export async function getLatestCheckinByName(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('checkins')
    .select('student_name, student_email, student_whatsapp, student_nationality, health_condition, checkin_at, is_minor')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName.trim())
    .order('checkin_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

/** All package_sales rows for a student by name. */
export async function getPackageSalesByStudentName(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('package_sales')
    .select('id, minutes_purchased, minutes_used, price_paid, status, sold_at, packages ( name )')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName.trim())
    .order('sold_at', { ascending: false })
  return data ?? []
}

/** Find student row by name — may return null for check-in-only students. */
export async function findStudentByName(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('students')
    .select('id, name, email, whatsapp, nationality, skill_level, health_conditions, created_at')
    .eq('school_id', schoolId)
    .ilike('name', studentName.trim())
    .limit(1)
    .maybeSingle()
  return data ?? null
}

/** Names from checkins that have no matching row in the students table.
 *  Used to show check-in-only students in the students list. */
export async function getCheckinOnlyStudents(schoolId: string, search?: string) {
  const supabase = createServiceClient()

  const { data: studentRows } = await supabase
    .from('students')
    .select('name')
    .eq('school_id', schoolId)
  const existingNames = new Set(
    (studentRows ?? []).map((s: any) => s.name.trim().toLowerCase())
  )

  let query = supabase
    .from('checkins')
    .select('student_name, student_email, student_whatsapp, student_nationality, health_condition, checkin_at')
    .eq('school_id', schoolId)
    .order('checkin_at', { ascending: false })

  if (search) query = query.ilike('student_name', `%${search}%`)

  const { data: checkins } = await query

  const seen = new Set<string>()
  const result: Array<{
    source: 'checkin'
    name: string
    email: string | null
    whatsapp: string | null
    nationality: string | null
    health_condition: string | null
    first_seen: string
  }> = []

  for (const c of checkins ?? []) {
    const key = c.student_name.trim().toLowerCase()
    if (existingNames.has(key) || seen.has(key)) continue
    seen.add(key)
    result.push({
      source: 'checkin' as const,
      name:             c.student_name,
      email:            (c as any).student_email    ?? null,
      whatsapp:         (c as any).student_whatsapp ?? null,
      nationality:      (c as any).student_nationality ?? null,
      health_condition: c.health_condition ?? null,
      first_seen:       c.checkin_at,
    })
  }
  return result
}

export async function getProgressionHistory(schoolId: string, studentId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('student_progression')
    .select(`
      id, level, notes, skills, created_at,
      updated_by_user:users!student_progression_updated_by_fkey ( name )
    `)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateStudentLevel(
  schoolId: string,
  studentId: string,
  level: string,
  notes: string,
  skills: string[],
  updatedBy?: string,
  sessionId?: string
) {
  const supabase = createServiceClient()

  await supabase
    .from('students')
    .update({ skill_level: level as any })
    .eq('id', studentId)
    .eq('school_id', schoolId)

  const { error } = await supabase
    .from('student_progression')
    .insert({
      school_id:  schoolId,
      student_id: studentId,
      level:      level as any,
      notes:      notes || null,
      skills,
      updated_by: updatedBy || null,
      session_id: sessionId || null,
    })

  if (error) throw error
  return { ok: true }
}

export async function getInstructors(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, commission_pct')
    .eq('school_id', schoolId)
    .in('role', ['instructor', 'owner'])
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}


