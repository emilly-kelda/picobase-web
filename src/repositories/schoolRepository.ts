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
  ownerEmail: string | null
  ownerId: string | null
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
      .select('id, school_id, name, email')
      .eq('role', 'owner'),
  ])

  if (schoolsError) throw schoolsError
  if (ownersError) throw ownersError

  const ownerBySchool = new Map<string, { id: string; name: string; email: string | null }>()
  for (const o of owners ?? []) {
    if (o.school_id && !ownerBySchool.has(o.school_id)) {
      ownerBySchool.set(o.school_id, { id: o.id, name: o.name, email: o.email ?? null })
    }
  }

  return (schools ?? []).map(s => {
    const owner = ownerBySchool.get(s.id)
    return {
      ...s,
      ownerName:  owner?.name ?? null,
      ownerEmail: owner?.email ?? null,
      ownerId:    owner?.id ?? null,
    }
  })
}

/** last_sign_in_at per owner, straight from Supabase Auth — no custom login
 *  log table needed, Auth already tracks this. There's no bulk "get these N
 *  users" admin call, so this is N parallel getUserById() calls; fine at the
 *  scale of a schools table (one row per client, not per end-user). */
export async function getLastLoginTimes(ownerIds: string[]): Promise<Map<string, string | null>> {
  const supabase = createServiceClient()
  const result = new Map<string, string | null>()

  await Promise.all(ownerIds.map(async id => {
    const { data } = await supabase.auth.admin.getUserById(id)
    result.set(id, data.user?.last_sign_in_at ?? null)
  }))

  return result
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
