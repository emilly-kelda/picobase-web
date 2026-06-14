import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
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
  const { payment_id, action, status, approved_at, paid_at } = body
  const supabase = await createServerSupabaseClient()

  if (action === 'update_status' || action === 'approve') {
    const update: Record<string, unknown> = {}
    if (status)      update.status      = status
    if (approved_at) update.approved_at = approved_at
    if (paid_at)     update.paid_at     = paid_at

    if (!status && action === 'approve') {
      update.status      = 'approved'
      update.approved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('payments')
      .update(update)
      .eq('id', payment_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


