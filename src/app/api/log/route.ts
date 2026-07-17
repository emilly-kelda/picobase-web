import { createServiceClient } from '@/lib/supabase-server'
import { computeCommissionAmount } from '@/lib/commission'
import { decrypt } from '@/utils/crypto'
import { NextResponse } from 'next/server'

// GET — fetch today's pending checkins for this instructor
export async function GET(request: Request) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

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

  const decryptedCheckins = (checkins ?? []).map(c => ({
    ...c,
    health_condition: c.health_condition ? decrypt(c.health_condition) : c.health_condition,
  }))

  return NextResponse.json({
    instructor: { id: instructor.id, name: instructor.name },
    checkins: decryptedCheckins
  })
}

// POST — confirm session
export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { token, checkin_id, duration_min, price } = body

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  const { data: instructor, error: instrError } = await supabase
    .from('users')
    .select('id, school_id, commission_pct, commission_mode, fixed_per_hour')
    .eq('log_token', token)
    .eq('role', 'instructor')
    .eq('active', true)
    .single()

  if (instrError || !instructor) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { data: checkin } = await supabase
    .from('checkins')
    .select('*')
    .eq('id', checkin_id)
    .eq('school_id', instructor.school_id)
    .single()

  if (!checkin) {
    return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
  }

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
      commission_pct:   instructor.commission_pct ?? null,
      commission_amount: computeCommissionAmount(instructor, price, duration_min),
    })

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  await supabase
    .from('checkins')
    .update({ status: 'session_confirmed' })
    .eq('id', checkin_id)

  return NextResponse.json({ ok: true })
}
