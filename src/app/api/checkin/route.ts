import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  const { data: school } = await supabase
    .from('schools')
    .select('id, name, language, currency')
    .eq('slug', slug)
    .single()

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, default_price')
    .eq('school_id', school.id)
    .eq('active', true)
    .order('sort_order')

  const { data: instructors } = await supabase
    .from('users')
    .select('id, name')
    .eq('school_id', school.id)
    .eq('role', 'instructor')
    .eq('active', true)

  return NextResponse.json({ school, activities, instructors })
}

export async function POST(request: Request) {
  const body = await request.json()

  // Capture audit trail from request headers
  const ip = request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  const { data: school } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', body.slug)
    .single()

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('checkins')
    .insert({
      school_id:           school.id,
      student_name:        body.student_name,
      student_email:       body.student_email,
      student_whatsapp:    body.student_whatsapp,
      student_nationality: body.student_nationality,
      activity_id:         body.activity_id || null,
      instructor_id:       body.instructor_id || null,
      health_condition:    body.health_condition || null,
      emergency_name:      body.emergency_name,
      emergency_phone:     body.emergency_phone,
      lgpd_consent:        body.lgpd_consent,
      gdpr_consent:        body.gdpr_consent || null,
      signature_data:      body.signature || null,
      ip_address:          ip,
      user_agent:          userAgent,
      waiver_signed_at:    body.signature ? new Date().toISOString() : null,
      status:              'checked_in',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
