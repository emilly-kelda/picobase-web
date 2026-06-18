import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const partnerId = searchParams.get('partner_id')
  const period    = searchParams.get('period')

  if (!partnerId) {
    return NextResponse.json({ error: 'partner_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('referrals')
    .select('id, commission_amount, session_price, status, created_at')
    .eq('school_id', SCHOOL_ID)
    .eq('partner_id', partnerId)
    .eq('period', period ?? '')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const referrals = (data ?? []).map(r => ({
    student_name:      '—',
    session_date:      r.created_at?.slice(0, 10) ?? period ?? '—',
    revenue:           r.session_price ?? 0,
    commission_amount: r.commission_amount ?? 0,
    status:            r.status ?? 'pending',
  }))

  return NextResponse.json({ referrals })
}
