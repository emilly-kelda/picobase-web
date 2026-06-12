import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — fetch today's pending checkins for this instructor
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  // Find instructor by token
  const { data: instructor, error: instrError } = await supabase
    .from('users')
    .select('id, name, school_id')
    .eq('log_token', token)
    .eq('role', 'instructor')
    .eq('active', true)
    .single()

  if (instrError || !instructor) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: checkins } = await supabase
    .from('checkins')
    .select(`
      id,
      student_name,
      student_email,
      health_condition,
      checkin_at,
      status,
      package_sale_id,
      activities (
        id,
        name,
        default_price
      ),
      package_sales (
        id,
        minutes_purchased,
        minutes_used,
        price_paid,
        status,
        packages (
          name,
          type
        )
      )
    `)
    .eq('school_id', instructor.school_id)
    .eq('instructor_id', instructor.id)
    .eq('status', 'checked_in')
    .gte('checkin_at', `${today}T00:00:00`)
    .order('checkin_at', { ascending: true })

  return NextResponse.json({
    instructor: { id: instructor.id, name: instructor.name },
    checkins: checkins || []
  })
}

// POST — confirm session
export async function POST(request: Request) {
  const body = await request.json()
  const { token, checkin_id, duration_min, price } = body

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  // Verify instructor by token
  const { data: instructor, error: instrError } = await supabase
    .from('users')
    .select('id, school_id, commission_pct')
    .eq('log_token', token)
    .eq('role', 'instructor')
    .eq('active', true)
    .single()

  if (instrError || !instructor) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Get checkin
  const { data: checkin } = await supabase
    .from('checkins')
    .select('*')
    .eq('id', checkin_id)
    .eq('school_id', instructor.school_id)
    .single()

  if (!checkin) {
    return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
  }

  // Insert session
  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      school_id:         instructor.school_id,
      checkin_id:        checkin_id,
      instructor_id:     instructor.id,
      activity_id:       checkin.activity_id || null,
      package_sale_id:   checkin.package_sale_id || null,
      session_date:      new Date().toISOString().split('T')[0],
      duration_min,
      price,
      origin:           'direct',
      commission_pct:   instructor.commission_pct || 0,
      commission_amount: price * (instructor.commission_pct || 0),
    })

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  // Update checkin status
  await supabase
    .from('checkins')
    .update({ status: 'session_confirmed' })
    .eq('id', checkin_id)

  return NextResponse.json({ ok: true })
}

