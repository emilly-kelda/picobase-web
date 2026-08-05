import { NextResponse } from 'next/server'
import { getSchoolContext } from '@/lib/auth/get-school-context'
import { createServiceClient } from '@/lib/supabase-server'

export type PlanLimitResult = { allowed: boolean; current: number; max: number | null }

/** Checks the calling school's current student count against its assigned
 *  plan's max_students (see 20260817000001_plans_and_subscriptions.sql).
 *  A school with no plan assigned, or a plan with max_students = NULL, is
 *  treated as unlimited (allowed: true, max: null) — a plan is opt-in
 *  metadata, not a default restriction.
 *
 *  Standalone utility, not wired into any /api/owner/* route yet — actually
 *  enforcing this (rejecting writes once a school is over its limit) is a
 *  real behavior change each call site should opt into deliberately, not
 *  something this helper imposes on its own. */
export async function checkPlanLimit(): Promise<
  | { ok: true; result: PlanLimitResult }
  | { ok: false; response: NextResponse }
> {
  const school = await getSchoolContext()
  if (!school.ok) return school

  const supabase = createServiceClient()

  const [{ data: schoolRow }, { count: current }] = await Promise.all([
    supabase
      .from('schools')
      .select('plan_id, plans ( max_students )')
      .eq('id', school.ctx.schoolId)
      .single(),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', school.ctx.schoolId),
  ])

  const plan = Array.isArray(schoolRow?.plans) ? schoolRow.plans[0] : schoolRow?.plans
  const max = plan?.max_students ?? null

  return {
    ok: true,
    result: {
      allowed: max === null || (current ?? 0) < max,
      current: current ?? 0,
      max,
    },
  }
}
