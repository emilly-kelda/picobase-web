import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const body = await request.json()
  const { instructor_id, commission_mode, commission_pct, fixed_per_hour } = body
  // Service role, not the session-bound client — public.users has RLS enabled
  // (one of only two tables that do) and this route was the only users-table
  // writer still going through the anon-key client. RLS doesn't error on a
  // filtered-out row, it just excludes it, so the UPDATE silently matched 0
  // rows: 200 OK, nothing changed. crew/route.ts's PATCH/DELETE (same table,
  // same kind of instructor edit) already uses the service client for this
  // exact reason.
  const supabase = createServiceClient()

  const mode      = commission_mode === 'fixed_per_hour' ? 'fixed_per_hour' : 'percentage'
  const newPct    = mode === 'percentage'    ? commission_pct  ?? null : null
  const newHourly = mode === 'fixed_per_hour' ? fixed_per_hour ?? null : null

  // Read current values before changing — used both to decide whether to log
  // a history row and as the "old" snapshot in it.
  const { data: current } = await supabase
    .from('users')
    .select('commission_mode, commission_pct, fixed_per_hour')
    .eq('id', instructor_id)
    .single()

  const oldMode   = current?.commission_mode ?? 'percentage'
  const oldPct    = current?.commission_pct ?? null
  const oldHourly = current?.fixed_per_hour ?? null
  const changed   = oldMode !== mode || oldPct !== newPct || oldHourly !== newHourly

  if (changed) {
    // Best-effort: a logging failure (e.g. migration not run yet) shouldn't
    // block the owner from actually changing the rate.
    await supabase
      .from('commission_history')
      .insert({
        school_id:     SCHOOL_ID,
        instructor_id,
        old_mode:      oldMode,
        old_pct:       oldPct,
        old_hourly:    oldHourly,
        new_mode:      mode,
        new_pct:       newPct,
        new_hourly:    newHourly,
      })
  }

  const update: Record<string, unknown> = {
    commission_mode: mode,
    commission_pct:  newPct,
    fixed_per_hour:  newHourly,
  }

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', instructor_id)
    .eq('school_id', SCHOOL_ID)
    .eq('role', 'instructor')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
