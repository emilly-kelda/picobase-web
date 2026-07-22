import { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'
import { windViability } from '@/lib/weather'

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
        public_token,
        student_confirmed_at,
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
    supabase.from('students').select('id, name, whatsapp').eq('school_id', schoolId),
  ])

  if (error) throw error

  const identityByName = new Map<string, { id: string; whatsapp: string | null }>()
  for (const s of students ?? []) {
    identityByName.set(normalizeStudentName(s.name), { id: s.id, whatsapp: s.whatsapp })
  }

  return (data ?? []).map(lesson => {
    const identity = identityByName.get(normalizeStudentName(lesson.student_name))
    return {
      ...lesson,
      student_whatsapp: identity?.whatsapp ?? null,
      // Shadows the raw (near-always-null, per the comment above) column
      // from the select with the name-resolved id — used to gate the
      // progression section in ConfirmLessonModal.tsx, same reliability
      // upgrade student_whatsapp already got over a raw column.
      student_id: identity?.id ?? null,
    }
  })
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
        id, student_name, scheduled_at, duration_min, package_sale_id,
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

const BOOKING_CANDIDATE_HOURS = RESCHEDULE_CANDIDATE_HOURS
const BOOKING_SEARCH_DAYS = RESCHEDULE_SEARCH_DAYS

/** Same instructor-availability scan as getRescheduleSuggestion, for the
 *  "Agendar aula" creation modal's suggestion card instead of the missed-
 *  lesson reschedule flow. Diverges in one way: rather than returning the
 *  very first open slot, it keeps scanning (still chronological, so it
 *  never suggests something later than necessary) until it finds one whose
 *  hour falls in windViability's "ideal" sailing band, and only settles for
 *  the first-available slot if no such window turns up in the search
 *  range. `windKnAt` is optional and pure (no fetch in here, keeping this
 *  file to DB access only) — the caller (the API route) is what actually
 *  hits Open-Meteo via lib/weather.ts's getHourlyWindForecast and passes a
 *  lookup in; pass nothing (or a lookup that always returns null, e.g. the
 *  school hasn't configured a spot yet) and this degrades to plain
 *  first-available, same as reschedule. */
export async function getBookingSuggestion(
  schoolId: string,
  activityName: string | null | undefined,
  durationMin: number,
  windKnAt?: (dateStr: string, hour: number) => number | null
): Promise<{ date: string; time: string; instructor_id: string; instructor_name: string; windKn: number | null } | null> {
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
  windowEnd.setDate(windowEnd.getDate() + BOOKING_SEARCH_DAYS)

  const { data: busy } = await supabase
    .from('scheduled_lessons')
    .select('instructor_id, scheduled_at, duration_min')
    .eq('school_id', schoolId)
    .neq('status', 'cancelled')
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

  type Candidate = { date: string; time: string; instructor_id: string; instructor_name: string; windKn: number | null }
  let firstAvailable: Candidate | null = null

  for (let day = 0; day < BOOKING_SEARCH_DAYS; day++) {
    const date = new Date(windowStart)
    date.setDate(date.getDate() + day)
    const dateStr = date.toISOString().slice(0, 10)

    for (const hour of BOOKING_CANDIDATE_HOURS) {
      const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00-03:00`).getTime()
      const slotEnd = slotStart + durationMin * 60000

      for (const instructor of pool) {
        const busySlots = busyByInstructor.get(instructor.id) ?? []
        const conflict = busySlots.some(b => slotStart < b.end && slotEnd > b.start)
        if (conflict) continue

        const windKn = windKnAt ? windKnAt(dateStr, hour) : null
        const candidate: Candidate = {
          date: dateStr,
          time: `${String(hour).padStart(2, '0')}:00`,
          instructor_id: instructor.id,
          instructor_name: instructor.name,
          windKn,
        }
        if (!firstAvailable) firstAvailable = candidate
        if (windKn != null && windViability(windKn).variant === 'success') {
          return candidate
        }
      }
    }
  }

  return firstAvailable
}

/** Instructor-clash + student-double-booking check, run before creating or
 *  editing a scheduled_lessons row. Same overlap math as
 *  getRescheduleSuggestion above (interval intersection, not exact-time
 *  match, so back-to-back-but-overlapping slots are still caught).
 *
 *  `groupId` is the lesson's own group_id, if it's part of a group booking
 *  (mode: 'group' in the schedule POST route below) — the one real
 *  mechanism this codebase has for "one instructor, one slot, multiple
 *  students on purpose". A clash against a *different* row sharing that
 *  exact group is not a real conflict (they're companions in the same
 *  class); a clash against an individual row, or a row in a *different*
 *  group, still blocks — an instructor can't run two separate classes at
 *  once either. The student check has no such exception: nobody can
 *  physically be in two lessons at once, group or not. */
export async function checkSchedulingConflicts(
  schoolId: string,
  params: {
    instructorId: string | null
    studentName: string
    scheduledAt: string
    durationMin: number
    excludeLessonId?: string
    groupId?: string | null
  }
): Promise<{ instructorConflict: boolean; studentConflict: boolean }> {
  const supabase = createServiceClient()
  const slotStart = new Date(params.scheduledAt).getTime()
  const slotEnd   = slotStart + params.durationMin * 60000

  let query = supabase
    .from('scheduled_lessons')
    .select('id, instructor_id, student_name, scheduled_at, duration_min, group_id')
    .eq('school_id', schoolId)
    .neq('status', 'cancelled')

  if (params.excludeLessonId) query = query.neq('id', params.excludeLessonId)

  const { data } = await query
  const targetName = normalizeStudentName(params.studentName)

  let instructorConflict = false
  let studentConflict = false

  for (const row of data ?? []) {
    const rowStart = new Date(row.scheduled_at).getTime()
    const rowEnd   = rowStart + (row.duration_min ?? 60) * 60000
    if (!(slotStart < rowEnd && slotEnd > rowStart)) continue

    const sameGroup = !!params.groupId && !!row.group_id && params.groupId === row.group_id

    if (!sameGroup && params.instructorId && row.instructor_id === params.instructorId) {
      instructorConflict = true
    }
    if (targetName && normalizeStudentName(row.student_name) === targetName) {
      studentConflict = true
    }
  }

  return { instructorConflict, studentConflict }
}

/** What a specific package_sales row actually has free right now: raw
 *  balance (minutes_purchased - minutes_used) minus minutes already
 *  committed to this student's OTHER still-pending lessons drawing on the
 *  same sale. Packages in this app are minute-based, not session-count
 *  based, so capacity is measured in minutes here rather than a raw
 *  lesson count — a plain count comparison would let two 3h lessons
 *  through where a 3h + a 1h wouldn't, despite drawing the identical
 *  total.
 *
 *  Only counts scheduled_lessons rows still in an unconfirmed state
 *  (excludes 'cancelled' and 'confirmed') — a confirmed lesson's minutes
 *  are already folded into minutes_used by confirm-lesson's own package
 *  deduction, so counting it here too would double-charge the same
 *  minutes against the balance.
 *
 *  Single source of truth for "how much of this package is actually
 *  free" — both checkPackageCapacity (the confirm-time gate) and
 *  getPackageBalanceForStudent (what ConfirmLessonModal displays before
 *  the operator ever hits confirm) call this, so the two can never drift
 *  apart again the way they used to: the modal used to independently
 *  re-guess "the student's oldest active package" by name and show its
 *  raw, un-netted balance, which could look perfectly healthy right up
 *  until the actual confirm got rejected for insufficient capacity once
 *  every other pending lesson against that same sale was accounted for. */
export async function getAvailablePackageMinutes(
  schoolId: string,
  packageSaleId: string,
  excludeLessonId?: string | null
): Promise<{ minutesPurchased: number; pricePaid: number; available: number } | null> {
  const supabase = createServiceClient()

  const { data: sale } = await supabase
    .from('package_sales')
    .select('minutes_purchased, minutes_used, price_paid')
    .eq('id', packageSaleId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!sale) return null

  const remaining = Math.max(0, (sale.minutes_purchased ?? 0) - (sale.minutes_used ?? 0))

  let query = supabase
    .from('scheduled_lessons')
    .select('id, duration_min')
    .eq('school_id', schoolId)
    .eq('package_sale_id', packageSaleId)
    .neq('status', 'cancelled')
    .neq('status', 'confirmed')

  if (excludeLessonId) query = query.neq('id', excludeLessonId)

  const { data: pendingLessons } = await query
  const alreadyCommitted = (pendingLessons ?? []).reduce((s, l) => s + (l.duration_min ?? 0), 0)

  return {
    minutesPurchased: sale.minutes_purchased ?? 0,
    pricePaid:        sale.price_paid ?? 0,
    available:        Math.max(0, remaining - alreadyCommitted),
  }
}

/** Package credit check, run before creating/editing a scheduled_lessons
 *  row tied to a specific package_sale_id — see getAvailablePackageMinutes
 *  for the per-sale accounting. No packageSaleId means no credit concept
 *  to violate (pay-per-lesson/avulsa booking, or group scheduling —
 *  neither tracks a package here) — callers simply don't invoke this in
 *  that case.
 *
 *  Prefers params.packageSaleId (whichever sale was linked at scheduling
 *  time) but falls back to the student's other active sales, oldest
 *  first, when that specific one no longer has enough room — the same
 *  FIFO fallback confirm-lesson's own auto-debit step already applied,
 *  which this check used to lack entirely. Without it, a lesson linked to
 *  a sale that later got exhausted by other confirmed lessons would get
 *  rejected here as "insufficient balance" even when the student's
 *  current active package (a newer purchase, say) had plenty of room —
 *  exactly the gap that let ConfirmLessonModal show a healthy balance
 *  (an independent, always-FIFO lookup) moments before this rigid,
 *  linked-sale-only check turned around and rejected the same confirm.
 *
 *  Returns which sale actually cleared the check (resolvedSaleId) so the
 *  caller's subsequent debit reuses that exact resolution instead of
 *  re-deriving it — the sale that got validated and the sale that gets
 *  debited must always be the same row. */
export async function checkPackageCapacity(
  schoolId: string,
  params: {
    studentName: string
    packageSaleId: string
    durationMin: number
    excludeLessonId?: string
  }
): Promise<{ ok: true; resolvedSaleId: string | null } | { ok: false }> {
  const supabase = createServiceClient()

  const { data: sales } = await supabase
    .from('package_sales')
    .select('id')
    .eq('school_id', schoolId)
    .ilike('student_name', params.studentName)
    .order('sold_at', { ascending: true })

  // The linked sale was deleted since scheduling — nothing left to
  // enforce a balance against (matches the old behavior for an unknown
  // sale id).
  if (!(sales ?? []).some(s => s.id === params.packageSaleId)) {
    return { ok: true, resolvedSaleId: null }
  }

  const candidateIds = [
    params.packageSaleId,
    ...(sales ?? []).map(s => s.id).filter(id => id !== params.packageSaleId),
  ]

  for (const saleId of candidateIds) {
    const info = await getAvailablePackageMinutes(schoolId, saleId, params.excludeLessonId)
    if (info && info.available >= params.durationMin) {
      return { ok: true, resolvedSaleId: saleId }
    }
  }

  return { ok: false }
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

/** Public read for the /aula/[token] self-service page and its API route.
 *  Returns id/school_id too (needed server-side to build a lesson_requests
 *  row and to run the confirm mutation) — callers that render this to the
 *  browser (the page component) must pick only the student-safe fields
 *  (student_name, scheduled_at, duration_min, status, student_confirmed_at,
 *  activity/instructor/school names) and must NOT forward notes, ids, or
 *  any financial/package field to the client. */
export async function getScheduledLessonByToken(token: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scheduled_lessons')
    .select(`
      id,
      school_id,
      student_name,
      scheduled_at,
      duration_min,
      status,
      student_confirmed_at,
      activities ( name ),
      instructor:users!scheduled_lessons_instructor_id_fkey ( name ),
      schools ( name )
    `)
    .eq('public_token', token)
    .maybeSingle()
  if (error || !data) return null
  return data
}

/** Marks the student's self-service "I'll be there" click. Deliberately
 *  never touches `status` — that field means "class happened, revenue
 *  recorded" elsewhere (see /api/owner/confirm-lesson), and flipping it
 *  here would both hide the lesson from staff's own confirm queue and skip
 *  the revenue/commission/package-debit steps entirely. Returns null when
 *  the token doesn't match anything or the lesson was already cancelled. */
export async function markStudentConfirmedByToken(token: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scheduled_lessons')
    .update({ student_confirmed_at: new Date().toISOString() })
    .eq('public_token', token)
    .neq('status', 'cancelled')
    .select('id, school_id')
    .maybeSingle()
  if (error) throw error
  return data
}

/** Makes sure `studentName` shows up in today's Aguardando Vento
 *  (getPendingLessons: status='checked_in', deferred_to_schedule=false,
 *  checkin_at >= today). Originally lived only in sell-package/route.ts
 *  (Venda Rápida) — pulled out here so bookings/route.ts (Reservas) and
 *  schedule/route.ts (same-day/experimental lessons) can call the exact
 *  same logic instead of a third copy.
 *
 *  checkins has a DB check constraint ("lgpd_required", verified live) that
 *  rejects any row with lgpd_consent != true — so a brand new row needs an
 *  explicit consent value, one way or another. Three cases:
 *   - A checkins row for today already exists → just reactivate it if
 *     something had moved it out of the pending view. Untouched if it's
 *     already showing, or if the student's lesson today was already
 *     confirmed (status 'session_confirmed' stays as-is).
 *   - No row for today, but a prior already-consented checkin exists →
 *     copy the identity/consent fields from that most recent one into a
 *     fresh row for today, same as a returning customer not having to
 *     re-sign a waiver they already have on file.
 *   - No row for today and no prior consented checkin at all → these are
 *     all presencial, at-the-counter interactions (a sale, a same-day
 *     reservation, a walk-in trial lesson), so create the check-in anyway
 *     with lgpd_consent/gdpr_consent forced true and waiver_signed_at set
 *     to now, representing consent given in person at the time.
 */
/** Resolves a package's short sport key ('kitesurf', 'windsurf', ...) to a
 *  real activities.id for this school, using the same normalize +
 *  startsWith prefix-match convention as lib/modality.ts's
 *  MODALITY_LABELS / detectModality — activities.name is free text the
 *  school typed in (no fixed catalog), so "Kitesurf" and "Kitesurf -
 *  Avançado" both match a package.sport of "kitesurf". Returns null (never
 *  throws) when there's no sport or no matching activity — callers treat
 *  that as "couldn't infer one, leave activity_id alone". */
async function findActivityIdBySport(
  supabase: ReturnType<typeof createServiceClient>,
  schoolId: string,
  sport: string | null | undefined
): Promise<string | null> {
  if (!sport?.trim()) return null
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name')
    .eq('school_id', schoolId)

  const normalizedSport = sport.toLowerCase().replace(/[^a-z]/g, '')
  const match = (activities ?? []).find(a =>
    a.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(normalizedSport)
  )
  return match?.id ?? null
}

/** `activityId` (a real FK — from a booking's or scheduled_lesson's own
 *  activity_id) takes priority when the caller already has one; `sport` (a
 *  package's short sport key, e.g. "kitesurf") is the fallback, resolved
 *  via findActivityIdBySport. Used to backfill activity_id when this
 *  checkin would otherwise have none — which is exactly what happened
 *  before: a package bought via Spot's "Venda Rápida" (no activity picker
 *  in that flow) produced a checkin with activity_id left null, showing
 *  "Sem atividade" in Aguardando Vento despite the student's package
 *  clearly being for a specific sport; same gap existed for bookings/
 *  schedule confirmations that had a real activity_id but never passed it
 *  through. Only fills a gap — never overrides an activity_id a real
 *  check-in (QR/walk-in form) already set. */
export async function ensureActiveCheckinForToday(
  schoolId: string,
  studentName: string,
  opts?: { activityId?: string | null; sport?: string | null }
) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  async function resolveActivityId() {
    return opts?.activityId || (await findActivityIdBySport(supabase, schoolId, opts?.sport))
  }

  const { data: todayCheckin } = await supabase
    .from('checkins')
    .select('id, status, deferred_to_schedule, activity_id')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName)
    .gte('checkin_at', `${today}T00:00:00`)
    .order('checkin_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (todayCheckin) {
    if (todayCheckin.status === 'session_confirmed' || todayCheckin.status === 'cancelled') return
    const backfillActivityId = !todayCheckin.activity_id ? await resolveActivityId() : null
    if (todayCheckin.status === 'checked_in' && !todayCheckin.deferred_to_schedule) {
      if (backfillActivityId) {
        await supabase.from('checkins').update({ activity_id: backfillActivityId }).eq('id', todayCheckin.id)
      }
      return
    }
    await supabase
      .from('checkins')
      .update({
        status: 'checked_in', deferred_to_schedule: false,
        ...(backfillActivityId ? { activity_id: backfillActivityId } : {}),
      })
      .eq('id', todayCheckin.id)
    return
  }

  const resolvedActivityId = await resolveActivityId()

  const { data: priorCheckin } = await supabase
    .from('checkins')
    .select(`
      student_email, student_whatsapp, student_nationality,
      document_number, document_type, health_condition,
      emergency_name, emergency_phone, birthdate, is_minor,
      guardian_name, guardian_consent, lgpd_consent, gdpr_consent,
      waiver_signed_at, waiver_pdf_url, zapsign_doc_id, signature_data, source
    `)
    .eq('school_id', schoolId)
    .ilike('student_name', studentName)
    .eq('lgpd_consent', true)
    .order('checkin_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!priorCheckin) {
    // lgpd_consent/gdpr_consent MUST be true — checkins has a hard CHECK
    // constraint ("lgpd_required") that rejects any row where
    // lgpd_consent isn't true, full stop. Setting it false here (an
    // earlier attempt at not faking waiver_signed_at) made every Venda
    // Rápida/booking/same-day-schedule checkin insert fail outright,
    // silently swallowed by the try/catch around this call — the package
    // sale still succeeded, but the student's checkin row was never
    // created and they vanished from Aguardando Vento with no trace.
    //
    // waiver_signed_at stays null though — that's the actual signal this
    // needs: lgpd_consent is baseline data-processing consent for holding
    // a customer record at all (reasonable to assume true for the
    // school's own customer), separate from the specific liability
    // waiver being physically/digitally signed, which genuinely hasn't
    // happened yet for a checkin created this way. The "Termo Assinado"
    // badge in PendingLessons.tsx reads waiver_signed_at specifically,
    // not lgpd_consent, so this still shows "Termo Pendente" correctly.
    await supabase.from('checkins').insert({
      school_id:    schoolId,
      student_name: studentName,
      status:       'checked_in',
      checkin_at:   new Date().toISOString(),
      deferred_to_schedule: false,
      lgpd_consent: true,
      gdpr_consent: true,
      waiver_signed_at: null,
      source: 'walk_in',
      activity_id:  resolvedActivityId,
    })
    return
  }

  await supabase.from('checkins').insert({
    school_id:    schoolId,
    activity_id:  resolvedActivityId,
    student_name: studentName,
    ...priorCheckin,
    status:       'checked_in',
    checkin_at:   new Date().toISOString(),
    deferred_to_schedule: false,
  })
}
