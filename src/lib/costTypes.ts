// Types + pure helpers shared between costRepository.ts (server-only —
// imports supabase-server, which pulls in next/headers) and the Costs
// page's client components. Kept in a separate module with zero server
// imports so CostsClient/AddCostModal can import just this without
// dragging next/headers into the client bundle — costRepository.ts
// re-exports everything here for existing server-side callers.

export const COST_CATEGORIES = [
  'Manutenção de Equipamento (Kites/Pranchas)',
  'Resgate / Combustível',
  'Equipa / Comissões',
  'Infraestrutura / Aluguel',
  'Marketing & Outros',
] as const

export type OperationalCost = {
  id: string
  school_id: string
  description: string
  amount: number
  cost_type: string
  recurrence: string
  due_date: string
  category: string | null
  created_at: string
  // null = not yet paid. A timestamp (not a plain boolean) so "when" is
  // available for free, same reasoning as sessions.received_at.
  paid_at: string | null
}

export type CostStatus = 'paid' | 'pending' | 'overdue'

/** Derived, not stored — "atrasado" only means anything relative to the
 *  moment you ask, and "pago" always wins over a past due_date (a cost
 *  paid late is paid, not overdue). */
export function getCostStatus(cost: Pick<OperationalCost, 'paid_at' | 'due_date'>, today = new Date().toISOString().slice(0, 10)): CostStatus {
  if (cost.paid_at) return 'paid'
  return cost.due_date < today ? 'overdue' : 'pending'
}
