import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const ua = headersList.get('user-agent') ?? 'unknown'

  const supabase = createServiceClient()

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
      health_condition:    body.health_condition || null,
      emergency_name:      body.emergency_name || null,
      emergency_phone:     body.emergency_phone || null,
      lgpd_consent:        true,
      gdpr_consent:        true,
      waiver_signed_at:    new Date().toISOString(),
      signature_data:      body.signature_data || null,
      ip_address:          ip,
      user_agent:          ua,
      status:              'checked_in',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

