import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const { period } = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .rpc('close_month', {
      p_school_id: SCHOOL_ID,
      p_period: period,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, created: data })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { payment_id, action, ids } = body
  const supabase = createServiceClient()

  if (action === 'approve') {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', payment_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (action === 'approve_all') {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .in('id', ids ?? [])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

