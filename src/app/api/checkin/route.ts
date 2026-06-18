import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { normalizeStudentName } from '@/lib/text'

/** Find the nearest scheduled_lessons row for this student so check-in can carry
 *  the agendamento straight into the owner's confirmation step. Window is bounded
 *  to -12h/+36h around now — wide enough for early/late check-ins on the booked
 *  day without matching stale, long-forgotten "scheduled" rows. */
async function findNearestScheduledLesson(
  supabase: ReturnType<typeof createServiceClient>,
  schoolId: string,
  studentName: string
) {
  const now = Date.now()
  const windowStart = new Date(now - 12 * 60 * 60 * 1000).toISOString()
  const windowEnd   = new Date(now + 36 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('scheduled_lessons')
    .select('id, student_name, scheduled_at')
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStart)
    .lte('scheduled_at', windowEnd)

  const target = normalizeStudentName(studentName)
  const matches = (data ?? []).filter(
    row => normalizeStudentName(row.student_name) === target
  )
  if (matches.length === 0) return null

  matches.sort((a, b) =>
    Math.abs(new Date(a.scheduled_at).getTime() - now) -
    Math.abs(new Date(b.scheduled_at).getTime() - now)
  )
  return matches[0]
}

export async function POST(request: Request) {
  const body = await request.json()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const ua = headersList.get('user-agent') ?? 'unknown'

  const supabase = createServiceClient()

  const scheduledLesson = await findNearestScheduledLesson(
    supabase, body.school_id, body.student_name as string
  )

  const { error, data } = await supabase
    .from('checkins')
    .insert({
      school_id:           body.school_id,
      student_name:        body.student_name,
      student_email:       body.student_email || null,
      student_whatsapp:    body.student_whatsapp || null,
      student_nationality: body.student_nationality || null,
      activity_id:         body.activity_id || null,
      instructor_id:       body.instructor_id || null,
      partner_id:          body.partner_id ?? null,
      health_condition:    body.health_condition || null,
      emergency_name:      body.emergency_name || null,
      emergency_phone:     body.emergency_phone || null,
      birthdate:           body.date_of_birth || null,
      is_minor:            body.is_minor ?? false,
      guardian_name:       body.guardian_name ?? null,
      guardian_consent:    body.guardian_consent ?? false,
      lgpd_consent:        true,
      gdpr_consent:        true,
      waiver_signed_at:    new Date().toISOString(),
      signature_data:      body.signature_data || null,
      ip_address:          ip,
      user_agent:          ua,
      status:              'checked_in',
      scheduled_lesson_id: scheduledLesson?.id ?? null,
      source:              body.source ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (scheduledLesson) {
    await supabase
      .from('scheduled_lessons')
      .update({ status: 'checked_in' })
      .eq('id', scheduledLesson.id)
  }

  // Find-or-create student row so every checked-in person is searchable
  const normalizedName = (body.student_name as string).trim()
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', body.school_id)
    .ilike('name', normalizedName)
    .limit(1)
    .maybeSingle()

  if (!existing) {
    await supabase.from('students').insert({
      school_id:         body.school_id,
      name:              normalizedName,
      email:             body.student_email    || null,
      whatsapp:          body.student_whatsapp || null,
      nationality:       body.student_nationality || null,
      health_conditions: body.health_condition || null,
    })
  }

  return NextResponse.json({ ok: true, id: data.id })
}


