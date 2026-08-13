import { createServiceClient } from '@/lib/supabase-server'
import { decrypt } from '@/utils/crypto'
import { normalizeSportKey } from '@/lib/modality'

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
      document_number,
      document_type,
      created_at
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  // Matches name OR document_number (CPF/passport, from the public
  // check-in form) — lets AddBookingModal's reception search find a
  // customer by either, same field the ficha itself was filled with.
  if (search) {
    query = query.or(`name.ilike.%${search}%,document_number.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(s => ({
    ...s,
    health_conditions: s.health_conditions ? decrypt(s.health_conditions) : s.health_conditions,
  }))
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
  return {
    ...data,
    health_conditions: data.health_conditions ? decrypt(data.health_conditions) : data.health_conditions,
  }
}

/** studentId is accepted for API compatibility with existing callers but
 *  unused — checkins has no student_id column (verified live), only
 *  student_name, same name-as-key limitation as everywhere else in this
 *  codebase. Previously this (and getSessionsByStudentName below) queried
 *  a checkins.session_id column that doesn't exist either — that error was
 *  silently swallowed (only .data was read, never .error), so both
 *  functions always returned [] rather than throwing. The real link is the
 *  other direction: sessions.checkin_id -> checkins.id. */
export async function getSessionsByStudent(schoolId: string, studentName: string, studentId?: string) {
  const supabase = createServiceClient()
  void studentId

  // checkin_id alone misses group-confirmed lessons (and any individual one
  // confirmed without going through the check-in kiosk) — those sessions
  // have no checkin at all (see confirm-lesson/route.ts), only a
  // scheduled_lesson_id, so a query scoped to checkin_id doesn't just show
  // the wrong name for them, it drops the row entirely. That made this
  // student's "Aulas Recentes"/hours-completed totals disagree with
  // package_sales.minutes_used, which IS bumped for those sessions.
  const [{ data: checkinRows }, { data: lessonRows }] = await Promise.all([
    supabase.from('checkins').select('id').eq('school_id', schoolId).ilike('student_name', studentName),
    supabase.from('scheduled_lessons').select('id').eq('school_id', schoolId).ilike('student_name', studentName),
  ])

  const checkinIds = [...new Set((checkinRows ?? []).map(c => c.id))]
  const lessonIds  = [...new Set((lessonRows ?? []).map(l => l.id))]
  if (checkinIds.length === 0 && lessonIds.length === 0) return []

  const orParts: string[] = []
  if (checkinIds.length > 0) orParts.push(`checkin_id.in.(${checkinIds.join(',')})`)
  if (lessonIds.length > 0) orParts.push(`scheduled_lesson_id.in.(${lessonIds.join(',')})`)

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, session_date, duration_min, price, commission_amount,
      users!sessions_instructor_id_fkey ( name ),
      activities ( name )
    `)
    .or(orParts.join(','))
    .order('session_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** A student can hold more than one active package_sales row at once —
 *  most commonly one per sport (Kitesurf and Surf are genuinely separate
 *  packages, not one blended balance), but package_sales.student_id is
 *  rarely populated so nothing merges or distinguishes them automatically.
 *  Returns every active sale per student (oldest first) instead of a
 *  single combined aggregate (this function's own previous shape — see
 *  git history), so the student-profile page can render one card per
 *  package/sport instead of collapsing them into one blended number that
 *  belongs to neither. */
export async function getActivePackageListByStudent(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select(`
      id,
      student_name,
      minutes_purchased,
      minutes_used,
      price_paid,
      amount_paid,
      payment_method,
      sold_at,
      status,
      packages ( name, sport )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('sold_at', { ascending: true })
  if (error) throw error

  const map = new Map<string, Array<{
    id: string
    minutes_purchased: number
    minutes_used: number
    price_paid: number
    amount_paid: number
    payment_method: string | null
    package_name: string
    sport: string | null
  }>>()

  for (const sale of data ?? []) {
    const pkg = sale.packages as any
    const list = map.get(sale.student_name) ?? []
    list.push({
      id: sale.id,
      minutes_purchased: sale.minutes_purchased,
      minutes_used: sale.minutes_used,
      price_paid: sale.price_paid ?? 0,
      amount_paid: sale.amount_paid ?? 0,
      payment_method: sale.payment_method ?? null,
      package_name: pkg?.name ?? 'Package',
      sport: pkg?.sport ?? null,
    })
    map.set(sale.student_name, list)
  }

  return map
}

/** Total completed (realized) water-time minutes per student, for the
 *  IKO/VDWS 10h autonomy-certificate eligibility badge. `sessions` are
 *  already-confirmed/realized lessons by construction (no separate status
 *  column — a scheduled-but-not-yet-happened lesson lives in
 *  scheduled_lessons instead), so every row here counts. The link is
 *  sessions.checkin_id -> checkins.id (checkins has no reverse
 *  session_id column, despite what this function originally assumed —
 *  that mistake briefly took production down: an uncaught 42703 on a
 *  nonexistent column crashed every render of /owner, since this
 *  function, unlike getSessionsByStudent/getSessionsByStudentName below,
 *  actually checks its query errors instead of silently swallowing them).
 *
 *  Keyed by raw (not normalized) student_name, same convention as
 *  getActivePackageListByStudent above — this map is meant to be read
 *  the same way, via students.name exact lookup, on the same page.
 *
 *  Known gap: group-confirmed sessions (see confirm-lesson/route.ts —
 *  "Group-confirmed lessons have no checkin") have no checkins row at all,
 *  so there's no student_name to attribute their minutes to here. Same
 *  limitation getSessionsByStudent/getSessionsByStudentName below already
 *  have for that student's session history and totals — not a new gap
 *  introduced by this function specifically. */
export async function getCompletedHoursByStudent(schoolId: string): Promise<Map<string, number>> {
  const supabase = createServiceClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('checkin_id, duration_min')
    .eq('school_id', schoolId)
    .not('checkin_id', 'is', null)
  if (error) throw error

  const checkinIds = [...new Set((sessions ?? []).map(s => s.checkin_id).filter(Boolean))]
  if (checkinIds.length === 0) return new Map()

  const { data: checkins, error: checkinsError } = await supabase
    .from('checkins')
    .select('id, student_name')
    .in('id', checkinIds as string[])
  if (checkinsError) throw checkinsError

  const nameByCheckinId = new Map((checkins ?? []).map(c => [c.id, c.student_name]))

  const totals = new Map<string, number>()
  for (const s of sessions ?? []) {
    if (!s.checkin_id) continue
    const name = nameByCheckinId.get(s.checkin_id)
    if (!name) continue
    totals.set(name, (totals.get(name) ?? 0) + (s.duration_min ?? 0))
  }
  return totals
}

/** Fetch sessions for a student by name (case-insensitive). Used for
 *  name-keyed profiles. Same checkin_id-only gap as getSessionsByStudent
 *  above — fixed the same way (also match via scheduled_lesson_id), since
 *  this feeds getSessionHistoryForPackageSale's fallback path too. */
export async function getSessionsByStudentName(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const [{ data: checkinRows }, { data: lessonRows }] = await Promise.all([
    supabase.from('checkins').select('id').eq('school_id', schoolId).ilike('student_name', studentName.trim()),
    supabase.from('scheduled_lessons').select('id').eq('school_id', schoolId).ilike('student_name', studentName.trim()),
  ])

  const checkinIds = [...new Set((checkinRows ?? []).map(c => c.id))]
  const lessonIds  = [...new Set((lessonRows ?? []).map(l => l.id))]
  if (checkinIds.length === 0 && lessonIds.length === 0) return []

  const orParts: string[] = []
  if (checkinIds.length > 0) orParts.push(`checkin_id.in.(${checkinIds.join(',')})`)
  if (lessonIds.length > 0) orParts.push(`scheduled_lesson_id.in.(${lessonIds.join(',')})`)

  const { data } = await supabase
    .from('sessions')
    .select(`
      id, session_date, duration_min, price, commission_amount, level,
      users!sessions_instructor_id_fkey ( name ),
      activities ( name )
    `)
    .or(orParts.join(','))
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
  if (!data) return null
  return {
    ...data,
    health_condition: data.health_condition ? decrypt(data.health_condition) : data.health_condition,
  }
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
  if (!data) return null
  return {
    ...data,
    health_conditions: data.health_conditions ? decrypt(data.health_conditions) : data.health_conditions,
  }
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
      health_condition: c.health_condition ? decrypt(c.health_condition) : null,
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

/** Most recent proficiency level per sport, for the per-modality
 *  certificate gate on the student detail page. Rows saved before the
 *  `sport` column existed (or where the instructor picker somehow left it
 *  blank) are excluded — there's no reliable way to guess which modality
 *  an unscoped legacy row belonged to. */
export async function getLatestProgressionBySport(
  schoolId: string,
  studentId: string
): Promise<Map<string, { level: string; skills: string[]; updatedAt: string }>> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('student_progression')
    .select('level, skills, sport, created_at')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .not('sport', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  const bySport = new Map<string, { level: string; skills: string[]; updatedAt: string }>()
  for (const row of data ?? []) {
    const key = normalizeSportKey(row.sport) ?? row.sport
    if (!key || bySport.has(key)) continue
    bySport.set(key, { level: row.level, skills: row.skills ?? [], updatedAt: row.created_at })
  }
  return bySport
}

/** Most recent level+skills for one student+sport — what ConfirmLessonModal's
 *  embedded ProgressionEditor needs to seed itself correctly. Without this,
 *  it always opened on a blank level_1_discovery/no-skills slate regardless
 *  of the student's real progress, so confirming a lesson without the
 *  instructor manually re-picking the correct level could silently regress
 *  an already-advanced student's skill_level back to Discovery on save. */
export async function getLatestProgressionForSport(
  schoolId: string,
  studentId: string,
  sport: string
): Promise<{ level: string; skills: string[] } | null> {
  const supabase = createServiceClient()
  const targetKey = normalizeSportKey(sport)
  const { data, error } = await supabase
    .from('student_progression')
    .select('level, skills, sport, created_at')
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .not('sport', 'is', null)
    .order('created_at', { ascending: false })
  if (error) throw error

  const match = (data ?? []).find(row => normalizeSportKey(row.sport) === targetKey)
  if (!match) return null
  return { level: match.level, skills: match.skills ?? [] }
}

// Moved to lib/levelProgression.ts (dependency-free, so ProgressionEditor.tsx
// — a client component — can also import it for a live preview as skill
// checkboxes are toggled, not just at save time). Re-exported here so
// api/owner/progression/route.ts's existing import keeps working unchanged.
export { LEVEL_ORDER, LEVEL_SKILLS, resolveLevelAfterSkillsUpdate } from '@/lib/levelProgression'

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
    .select('id, name, commission_pct, commission_mode, fixed_per_hour, weekly_capacity_hours, sports')
    .eq('school_id', schoolId)
    .in('role', ['instructor', 'owner'])
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}


