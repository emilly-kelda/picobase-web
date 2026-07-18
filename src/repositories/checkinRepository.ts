import { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'

export async function getSchoolBySlug(slug: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, language, sport_types, waiver_en, waiver_pt, waiver_fr, waiver_es, daily_notice, waiver_type, waiver_file_global_url, waiver_files_by_lang')
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
    .select('id, name')
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


