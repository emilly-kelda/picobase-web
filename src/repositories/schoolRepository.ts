import { createServiceClient } from '@/lib/supabase-server'

export type MasterSchoolRow = {
  id: string
  name: string
  slug: string
  status_assinatura: string
  payment_method: string | null
  payment_terms: string | null
  subscription_value: number | null
  cost_center: string | null
  created_at: string
}

/** Every school, for the master dashboard's management table. Service-role —
 *  same pattern as every other repository in the app (see packageRepository.ts,
 *  crewRepository.ts) — not a session-bound RLS-filtered query. */
export async function getAllSchoolsForMaster(): Promise<MasterSchoolRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, status_assinatura, payment_method, payment_terms, subscription_value, cost_center, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
