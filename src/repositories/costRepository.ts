import { createServiceClient } from '@/lib/supabase-server'
import type { OperationalCost, CostStatus } from '@/lib/costTypes'

// Re-exported for existing server-side callers (page.tsx etc.) that import
// these from this module — see costTypes.ts for why the definitions live
// there instead (client components need them without pulling in
// supabase-server/next-headers via the rest of this file).
export { COST_CATEGORIES, getCostStatus } from '@/lib/costTypes'
export type { OperationalCost, CostStatus } from '@/lib/costTypes'

const PAGE_SIZE = 20

export type CostFilters = {
  /** YYYY-MM — matched against due_date's month, same convention as
   *  getPayments(schoolId, period) elsewhere in this app. */
  period?: string | null
  category?: string | null
  status?: CostStatus | null
}

export async function getCosts(
  schoolId: string,
  page = 0,
  filters: CostFilters = {}
): Promise<{ costs: OperationalCost[]; total: number; pageSize: number }> {
  const supabase = createServiceClient()
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('operational_costs')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)

  if (filters.period)   query = query.gte('due_date', `${filters.period}-01`).lte('due_date', `${filters.period}-31`)
  if (filters.category) query = query.eq('category', filters.category)
  // paid/pending/overdue can't be pushed down as a single column filter
  // (overdue needs "due_date < today AND paid_at is null", pending the
  // inverse) — applied straightforwardly against the two real columns.
  const today = new Date().toISOString().slice(0, 10)
  if (filters.status === 'paid')     query = query.not('paid_at', 'is', null)
  if (filters.status === 'pending')  query = query.is('paid_at', null).gte('due_date', today)
  if (filters.status === 'overdue')  query = query.is('paid_at', null).lt('due_date', today)

  const { data, error, count } = await query
    .order('due_date', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { costs: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE }
}

export async function markCostPaid(id: string, schoolId: string, paid: boolean) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('operational_costs')
    .update({ paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

/** Distinct categories already in use, for the AddCostModal <datalist> —
 *  category is free text, not a foreign key, so this is a hint, same pattern
 *  as packages.sport in PackageFormModal.tsx. */
export async function getKnownCategories(schoolId: string): Promise<string[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('operational_costs')
    .select('category')
    .eq('school_id', schoolId)
    .not('category', 'is', null)
  if (error) throw error
  return Array.from(new Set((data ?? []).map(c => c.category).filter((c): c is string => !!c))).sort()
}

export async function createCost(payload: {
  schoolId: string
  description: string
  amount: number
  costType: string
  recurrence: string
  dueDate: string
  category: string | null
  createdBy: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('operational_costs')
    .insert({
      school_id:   payload.schoolId,
      description: payload.description,
      amount:      payload.amount,
      cost_type:   payload.costType,
      recurrence:  payload.recurrence,
      due_date:    payload.dueDate,
      category:    payload.category,
      created_by:  payload.createdBy,
    })
  if (error) throw error
  return { ok: true }
}

export async function updateCost(id: string, schoolId: string, payload: {
  description: string
  amount: number
  costType: string
  recurrence: string
  dueDate: string
  category: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('operational_costs')
    .update({
      description: payload.description,
      amount:      payload.amount,
      cost_type:   payload.costType,
      recurrence:  payload.recurrence,
      due_date:    payload.dueDate,
      category:    payload.category,
    })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

export async function deleteCost(id: string, schoolId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('operational_costs')
    .delete()
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

/** Steady-state monthly burn from real itemized costs: mensal counts in
 *  full, anual is amortized /12. unico (one-time) is deliberately excluded —
 *  a one-off expense isn't part of an ongoing monthly burn rate, and
 *  including it would permanently inflate this figure by whatever the
 *  one-time cost was. Returns 0 if the school has no recurring cost records
 *  yet, so callers (Spot, Runway Calculator) can fall back to their
 *  existing burn_rate source rather than showing R$0. */
export async function getMonthlyCostTotal(schoolId: string): Promise<number> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('operational_costs')
    .select('amount, recurrence')
    .eq('school_id', schoolId)
    .in('recurrence', ['mensal', 'anual'])
  if (error) throw error

  return (data ?? []).reduce((sum, c) => {
    if (c.recurrence === 'mensal') return sum + c.amount
    if (c.recurrence === 'anual')  return sum + c.amount / 12
    return sum
  }, 0)
}
