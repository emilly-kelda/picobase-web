import type { createServiceClient } from '@/lib/supabase-server'
import { normalizeStudentName } from '@/lib/text'

export type CommissionMode = 'percentage' | 'fixed_per_hour'

/** Server-side commission calc, shared by every "confirm session" route.
 *  Always re-derives from the instructor's current saved rate rather than
 *  trusting a client-supplied commission_pct, so a stale/tampered client
 *  value can't override what the owner actually configured.
 *
 *  Pass netRevenue (price minus any variable cost deduction) as `price` to
 *  get commission on the post-cost base — irrelevant for fixed_per_hour mode
 *  since that's duration-based, not revenue-based. */
export function computeCommissionAmount(
  instructor: {
    commission_mode?: string | null
    commission_pct: number | null
    fixed_per_hour?: number | null
  },
  price: number,
  durationMin: number
): number {
  if (instructor.commission_mode === 'fixed_per_hour') {
    return (instructor.fixed_per_hour ?? 0) * (durationMin / 60)
  }
  return price * (instructor.commission_pct ?? 0)
}

export type VariableCostInfo = {
  hasVariableCost: boolean
  packageSaleId: string | null
  packageName: string | null
  variableCostName: string | null
  variableCostAmount: number
  variableCostMode: 'per_student' | 'per_trip'
}

const NO_VARIABLE_COST: VariableCostInfo = {
  hasVariableCost:    false,
  packageSaleId:      null,
  packageName:        null,
  variableCostName:   null,
  variableCostAmount: 0,
  variableCostMode:   'per_student',
}

function unwrap<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

/** Packages link to students only by name (checkins/package_sales have no
 *  shared id — same reasoning as normalizeStudentName's other callers), so
 *  this matches the student's most recent active package_sale by normalized
 *  name rather than relying on checkins.package_sale_id, which nothing in
 *  this codebase ever writes (it's selected in a couple of places but always
 *  null in practice). */
export async function getVariableCostForStudent(
  supabase: ReturnType<typeof createServiceClient>,
  schoolId: string,
  studentName: string | null | undefined
): Promise<VariableCostInfo> {
  if (!studentName?.trim()) return NO_VARIABLE_COST

  const { data } = await supabase
    .from('package_sales')
    .select(`
      id, student_name,
      packages (
        name, has_variable_cost, variable_cost_name,
        variable_cost_amount, variable_cost_mode
      )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('sold_at', { ascending: false })

  const target = normalizeStudentName(studentName)
  const match = (data ?? []).find(s => normalizeStudentName(s.student_name) === target)
  const pkg   = unwrap(match?.packages)

  if (!match || !pkg?.has_variable_cost || !pkg.variable_cost_amount) {
    return NO_VARIABLE_COST
  }

  return {
    hasVariableCost:    true,
    packageSaleId:      match.id,
    packageName:        pkg.name ?? null,
    variableCostName:   pkg.variable_cost_name ?? null,
    variableCostAmount: pkg.variable_cost_amount,
    variableCostMode:   pkg.variable_cost_mode === 'per_trip' ? 'per_trip' : 'per_student',
  }
}
