import { createServiceClient } from '@/lib/supabase-server'

export type PicobaseCost = {
  id: string
  category: string
  description: string
  amount: number
  cost_date: string
  created_at: string
}

export async function getCosts(): Promise<PicobaseCost[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('picobase_costs')
    .select('id, category, description, amount, cost_date, created_at')
    .order('cost_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createCost(payload: {
  category: string
  description: string
  amount: number
  costDate: string
}) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('picobase_costs')
    .insert({
      category:    payload.category,
      description: payload.description,
      amount:      payload.amount,
      cost_date:   payload.costDate,
    })
  if (error) throw error
  return { ok: true }
}
