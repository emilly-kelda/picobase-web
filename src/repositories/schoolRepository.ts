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
  ownerName: string | null
}

export type MasterMetrics = {
  saasRevenue: number
  activeSchools: number
  ecosystemVolume: number
}

/** Every school, for the master dashboard's management table, with each
 *  school's owner name attached. Service-role — same pattern as every other
 *  repository in the app (see packageRepository.ts, crewRepository.ts), not
 *  a session-bound RLS-filtered query.
 *
 *  schools has no owner_id column — the relationship is
 *  users.school_id + role = 'owner', so this is a manual join (two queries,
 *  mapped in memory) rather than a nested select. */
export async function getAllSchoolsForMaster(): Promise<MasterSchoolRow[]> {
  const supabase = createServiceClient()

  const [{ data: schools, error: schoolsError }, { data: owners, error: ownersError }] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, slug, status_assinatura, payment_method, payment_terms, subscription_value, cost_center, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('school_id, name')
      .eq('role', 'owner'),
  ])

  if (schoolsError) throw schoolsError
  if (ownersError) throw ownersError

  const ownerNameBySchool = new Map<string, string>()
  for (const o of owners ?? []) {
    if (o.school_id && !ownerNameBySchool.has(o.school_id)) {
      ownerNameBySchool.set(o.school_id, o.name)
    }
  }

  return (schools ?? []).map(s => ({
    ...s,
    ownerName: ownerNameBySchool.get(s.id) ?? null,
  }))
}

/** Ecosystem-wide numbers for the master dashboard's top metric cards.
 *
 *  - saasRevenue: sum of subscription_value across every school with a
 *    value on file — Pico Base's own contracted SaaS revenue.
 *  - activeSchools: count of schools with status_assinatura = 'active'.
 *  - ecosystemVolume: sum of sessions.price (BRL, post-currency-conversion
 *    — see src/lib/fx.ts) across every school, no school_id filter — total
 *    revenue flowing through every tenant school's own business, for scale
 *    tracking. Matches the per-school "revenue" definition already used in
 *    api/owner/reports/route.ts (sum of sessions.price). */
export async function getMasterMetrics(): Promise<MasterMetrics> {
  const supabase = createServiceClient()

  const [{ data: schools, error: schoolsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase.from('schools').select('status_assinatura, subscription_value'),
    supabase.from('sessions').select('price'),
  ])

  if (schoolsError) throw schoolsError
  if (sessionsError) throw sessionsError

  return {
    saasRevenue:     (schools ?? []).reduce((sum, s) => sum + (s.subscription_value ?? 0), 0),
    activeSchools:   (schools ?? []).filter(s => s.status_assinatura === 'active').length,
    ecosystemVolume: (sessions ?? []).reduce((sum, s) => sum + (s.price ?? 0), 0),
  }
}
