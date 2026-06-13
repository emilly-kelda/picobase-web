import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const body = await request.json()
  const { period } = body

  if (!period) {
    return NextResponse.json({ error: 'Period required' }, { status: 400 })
  }

  // Call the close_month function we built in migration 004
  const { data, error } = await supabase
    .rpc('close_month', {
      p_school_id: SCHOOL_ID,
      p_period:    period,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, payments_created: data })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ||
    new Date().toISOString().slice(0, 7)

  console.log('Fetching payments for period:', period, 'school:', SCHOOL_ID)

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      period,
      sessions_count,
      revenue_generated,
      commission_pct,
      commission_amount,
      bonus,
      total_to_pay,
      status,
      receipt_url,
      users!payments_instructor_id_fkey ( id, name, email, pix_key, wise_email )
    `)
    .eq('school_id', SCHOOL_ID)
    .eq('period', period)
    .order('total_to_pay', { ascending: false })

  console.log('Payments found:', payments?.length, 'Error:', error)

  return NextResponse.json({ payments: payments || [], period })
}


