import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const { referral_ids, mark_as_paid } = await request.json()
  const supabase = createServiceClient()

  const update: Record<string, string> = {
    status:      mark_as_paid ? 'paid' : 'approved',
    approved_at: new Date().toISOString(),
  }
  if (mark_as_paid) update.paid_at = new Date().toISOString()

  const { error } = await supabase
    .from('referrals')
    .update(update)
    .in('id', referral_ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
