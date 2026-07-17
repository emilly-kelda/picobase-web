import { createServiceClient } from '@/lib/supabase-server'
import { decrypt } from '@/utils/crypto'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { period } = body

  if (!period) {
    return NextResponse.json({ error: 'Period required' }, { status: 400 })
  }

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
  const supabase = createServiceClient()
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

  const decryptedPayments = (payments ?? []).map(p => {
    const u = Array.isArray(p.users) ? p.users[0] : p.users
    const users = u ? { ...u, pix_key: u.pix_key ? decrypt(u.pix_key) : u.pix_key } : u
    return { ...p, users }
  })

  return NextResponse.json({ payments: decryptedPayments, period })
}
