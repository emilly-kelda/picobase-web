import { requireMaster } from '@/lib/masterAuth'
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/** Reassigns a school's plan and/or billing-lifecycle status. Every field
 *  besides school_id is optional — the master UI's reassign modal may only
 *  be changing the plan, or only the status, not necessarily all three at
 *  once. Deliberately separate from schools.status_assinatura (the real
 *  access gate — see 20260817000001_plans_and_subscriptions.sql's own
 *  comment); this route never touches that column. */
export async function POST(request: Request) {
  const auth = await requireMaster()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const { school_id, plan_id, subscription_status, current_period_end, cancel_at_period_end } = body

  if (!school_id) {
    return NextResponse.json({ error: 'school_id é obrigatório' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if ('plan_id' in body)               update.plan_id = plan_id ?? null
  if ('subscription_status' in body)   update.subscription_status = subscription_status ?? null
  if ('current_period_end' in body)    update.current_period_end = current_period_end ?? null
  if ('cancel_at_period_end' in body)  update.cancel_at_period_end = !!cancel_at_period_end

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .update(update)
    .eq('id', school_id)
    .select('id, name, plan_id, subscription_status, current_period_end, cancel_at_period_end')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, school: data })
}
