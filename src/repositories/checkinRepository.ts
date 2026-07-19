import { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'

export async function getSchoolBySlug(slug: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, language, sport_types, waiver_en, waiver_pt, waiver_fr, waiver_es, daily_notice, waiver_type, waiver_file_global_url, waiver_files_by_lang, privacy_policy_url')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getActivitiesForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('activities')
    .select('id, name, default_price, default_duration_min')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('sort_order')
  return data ?? []
}

export async function getInstructorsForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, sports')
    .eq('school_id', schoolId)
    .in('role', ['instructor', 'owner'])
    .eq('active', true)
    .order('name')
  return data ?? []
}

export async function getPartnersForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, type')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('name')
  return data ?? []
}

/** Match a free-typed check-in name against this school's active package_sales,
 *  the same fuzzy-match approach used elsewhere for name-only joins (no shared
 *  id between checkins and package_sales — see getVariableCostForStudent in
 *  lib/commission.ts and findNearestScheduledLesson in api/checkin/route.ts). */
export async function getPackageBalanceForCheckin(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('package_sales')
    .select('student_name, minutes_purchased, minutes_used, packages(name)')
    .eq('school_id', schoolId)
    .eq('status', 'active')

  const target = normalizeStudentName(studentName)
  const match = (data ?? []).find(s => normalizeStudentName(s.student_name) === target)
  if (!match) return null

  const pkg = Array.isArray(match.packages) ? match.packages[0] : match.packages
  const hoursRemaining = Math.round((((match.minutes_purchased ?? 0) - (match.minutes_used ?? 0)) / 60) * 10) / 10

  return {
    packageName:    pkg?.name ?? 'Pacote',
    hoursRemaining,
  }
}

/** Single-name, single-day match — deliberately not a "list today's
 *  scheduled students" query. The public check-in form used to fetch and
 *  render the whole day's roster (name/activity/instructor) client-side
 *  so it could offer name suggestions as the student typed, which meant
 *  any anonymous visitor could see every other student scheduled that
 *  day just by focusing the field, no typing required — a real LGPD
 *  exposure. This only ever answers "does *this exact* name have a
 *  lesson today", returning a single match or null, never an array, so
 *  there's nothing to browse. */
export async function getTodayScheduledMatchForCheckin(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('scheduled_lessons')
    .select('activity_id, instructor_id, student_name')
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)

  const target = normalizeStudentName(studentName)
  const match = (data ?? []).find(s => normalizeStudentName(s.student_name) === target)
  if (!match) return null

  return {
    activityId:   match.activity_id,
    instructorId: match.instructor_id,
  }
}


