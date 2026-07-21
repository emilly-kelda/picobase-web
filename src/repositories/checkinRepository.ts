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

/** Duplicate-document guard for the check-in form's CPF/passport field.
 *  Flags a document already on file under a DIFFERENT student name — a
 *  typo, or someone else's CPF entered by mistake — not the normal case
 *  of a returning student re-checking-in under their own name/document,
 *  which must stay allowed (this school's repeat customers check in every
 *  visit). Checks both students (the canonical registry) and checkins
 *  (a document can land there before students catches up — see the
 *  find-or-create in api/checkin/route.ts) so a same-day double-submit
 *  under two different names still gets caught. document_number is
 *  compared exactly as stored (CPF formatted with dots/dash, passport
 *  uppercased) — same format the client sends on submit. */
export async function findDuplicateDocument(
  schoolId: string,
  documentNumber: string,
  studentName: string
): Promise<string | null> {
  const supabase = createServiceClient()
  const target = normalizeStudentName(studentName)

  const [{ data: students }, { data: checkins }] = await Promise.all([
    supabase.from('students').select('name')
      .eq('school_id', schoolId).eq('document_number', documentNumber).limit(5),
    supabase.from('checkins').select('student_name')
      .eq('school_id', schoolId).eq('document_number', documentNumber).limit(5),
  ])

  const candidates = [
    ...(students ?? []).map(s => s.name),
    ...(checkins ?? []).map(c => c.student_name),
  ]

  return candidates.find(name => normalizeStudentName(name) !== target) ?? null
}

/** Same duplicate guard as findDuplicateDocument, for the email field —
 *  flags an email already on file under a DIFFERENT student name, not a
 *  returning student re-checking-in under their own name/email. ilike
 *  (no wildcards) does a case-insensitive exact match, since emails are
 *  stored as typed and shouldn't be treated as case-sensitive. */
export async function findDuplicateEmail(
  schoolId: string,
  email: string,
  studentName: string
): Promise<string | null> {
  const supabase = createServiceClient()
  const target = normalizeStudentName(studentName)
  const normalizedEmail = email.trim()

  const [{ data: students }, { data: checkins }] = await Promise.all([
    supabase.from('students').select('name')
      .eq('school_id', schoolId).ilike('email', normalizedEmail).limit(5),
    supabase.from('checkins').select('student_name')
      .eq('school_id', schoolId).ilike('student_email', normalizedEmail).limit(5),
  ])

  const candidates = [
    ...(students ?? []).map(s => s.name),
    ...(checkins ?? []).map(c => c.student_name),
  ]

  return candidates.find(name => normalizeStudentName(name) !== target) ?? null
}

/** Backs the on-demand "signed waiver record" PDF (api/owner/checkin-
 *  waiver/[checkinId]) — same on-demand-regenerate pattern as
 *  getCertificateData in packageRepository.ts: nothing is pre-rendered to
 *  Storage, this just assembles the current row's data fresh on every
 *  download. Returns null for a checkin that was never actually signed
 *  (waiver_signed_at null) — nothing to compile yet. activity_id/
 *  instructor_id are resolved with separate lookups rather than an
 *  embedded join to avoid PostgREST relationship-ambiguity errors if
 *  checkins ever gains a second FK into users (e.g. a future
 *  created_by). */
export async function getSignedWaiverData(schoolId: string, checkinId: string) {
  const supabase = createServiceClient()

  const { data: checkin, error } = await supabase
    .from('checkins')
    .select(`
      id, student_name, student_nationality, document_number, document_type,
      birthdate, is_minor, guardian_name, waiver_signed_at, waiver_source_type,
      waiver_content_snapshot, waiver_version_hash, ip_address, user_agent,
      signature_data, lgpd_consent, activity_id, instructor_id
    `)
    .eq('id', checkinId)
    .eq('school_id', schoolId)
    .single()

  if (error || !checkin || !checkin.waiver_signed_at) return null

  const [{ data: school }, { data: activity }, { data: instructor }] = await Promise.all([
    supabase.from('schools').select('name').eq('id', schoolId).single(),
    checkin.activity_id
      ? supabase.from('activities').select('name').eq('id', checkin.activity_id).maybeSingle()
      : Promise.resolve({ data: null }),
    checkin.instructor_id
      ? supabase.from('users').select('name').eq('id', checkin.instructor_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    checkinId:         checkin.id,
    schoolName:        school?.name ?? 'Escola',
    studentName:       checkin.student_name,
    documentType:      checkin.document_type,
    documentNumber:    checkin.document_number,
    nationality:       checkin.student_nationality,
    birthdate:         checkin.birthdate,
    activityName:      activity?.name ?? null,
    instructorName:    instructor?.name ?? null,
    isMinor:           checkin.is_minor ?? false,
    guardianName:      checkin.guardian_name,
    waiverSourceType:  checkin.waiver_source_type,
    waiverContent:     checkin.waiver_content_snapshot,
    waiverVersionHash: checkin.waiver_version_hash,
    signedAt:          checkin.waiver_signed_at,
    ipAddress:         checkin.ip_address,
    userAgent:         checkin.user_agent,
    signatureDataUrl:  checkin.signature_data,
    lgpdConsent:       checkin.lgpd_consent ?? false,
  }
}

/** Recent signed waivers for a student's profile page — matched by name,
 *  same convention as getSessionsByStudent (checkins has no direct
 *  student_id column). Only rows with an actual signature on file. */
export async function getSignedWaiversByStudent(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('checkins')
    .select('id, waiver_signed_at, document_number')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName)
    .not('waiver_signed_at', 'is', null)
    .order('waiver_signed_at', { ascending: false })
    .limit(10)
  return data ?? []
}

