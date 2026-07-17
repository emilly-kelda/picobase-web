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
  const { payment_id, action, status, approved_at, paid_at, period } = body
  // Service role — this previously used the session-bound client, which
  // silently updated zero rows (same root cause as the earlier commission
  // PATCH bug: no grant/RLS path lets the anon-key session client write to
  // payments). Every other mutation in this file/app uses the service client;
  // this route's own POST handler two lines above already did.
  const supabase = createServiceClient()

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

  // Bulk "Aprovar todos" — approves every still-pending payment for the
  // school/period in one query, rather than the frontend firing one PATCH
  // per row (which also had a stale-closure bug losing all but the last
  // row's optimistic update — see PaymentsClient.tsx).
  if (action === 'approve_all') {
    if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 })

    const { error } = await supabase
      .from('payments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('school_id', SCHOOL_ID)
      .eq('period', period)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


