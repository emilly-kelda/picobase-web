import { createServiceClient } from '@/lib/supabase-server'

export async function getPackageDashboard(schoolId: string) {
  const supabase = createServiceClient()

  const [{ data: allPackages }, { data: allSales }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, sport, type, base_price, final_price, total_minutes, price_eur, price_usd, sort_order')
      .eq('school_id', schoolId)
      .eq('active', true)
      .order('base_price', { ascending: false }),

    supabase
      .from('package_sales')
      .select('id, package_id, student_name, minutes_purchased, minutes_used, price_paid, sold_at')
      .eq('school_id', schoolId)
      .order('sold_at', { ascending: false }),
  ])

  const packages = allPackages ?? []
  const sales    = allSales ?? []
  const now      = Date.now()

  const enrichedSales = sales.map(s => {
    const minutesUsed      = s.minutes_used ?? 0
    const minutesPurchased = s.minutes_purchased ?? 0
    const pctUsed          = minutesPurchased > 0 ? minutesUsed / minutesPurchased : 0
    const daysSince        = Math.floor((now - new Date(s.sold_at).getTime()) / 86400000)
    const minutesRemaining = minutesPurchased - minutesUsed
    const pkg              = packages.find(p => p.id === s.package_id)

    const atRisk = pctUsed < 1 && minutesRemaining > 0 && daysSince > 21 && pctUsed < 0.3

    return {
      ...s,
      minutesUsed,
      minutesPurchased,
      minutesRemaining,
      pctUsed,
      daysSince,
      atRisk,
      packageName: pkg?.name ?? '—',
      studentName: s.student_name ?? 'Desconhecido',
      studentId:   null as string | null,
    }
  })

  const totalRevenue          = enrichedSales.reduce((s, r) => s + (r.price_paid ?? 0), 0)
  const totalMinutesSold      = enrichedSales.reduce((s, r) => s + r.minutesPurchased, 0)
  const totalMinutesDelivered = enrichedSales.reduce((s, r) => s + r.minutesUsed, 0)
  const totalMinutesRemaining = enrichedSales.reduce((s, r) => s + r.minutesRemaining, 0)
  const activeStudents        = enrichedSales.filter(s => s.minutesRemaining > 0).length

  const packageTypes = packages.map(pkg => {
    const pkgSales         = enrichedSales.filter(s => s.package_id === pkg.id)
    const minutesSold      = pkgSales.reduce((s, r) => s + r.minutesPurchased, 0)
    const minutesUsed      = pkgSales.reduce((s, r) => s + r.minutesUsed, 0)
    const minutesRemaining = pkgSales.reduce((s, r) => s + r.minutesRemaining, 0)
    const revenue          = pkgSales.reduce((s, r) => s + (r.price_paid ?? 0), 0)
    const utilPct          = minutesSold > 0 ? Math.round((minutesUsed / minutesSold) * 100) : 0

    return {
      id:           pkg.id,
      name:         pkg.name,
      sport:        pkg.sport ?? null,
      totalMinutes: pkg.total_minutes ?? 0,
      price:        pkg.final_price ?? pkg.base_price ?? 0,
      price_eur:    pkg.price_eur ?? null,
      price_usd:    pkg.price_usd ?? null,
      count: pkgSales.length,
      revenue,
      minutesSold,
      minutesUsed,
      minutesRemaining,
      utilPct,
      hasNoSales: pkgSales.length === 0,
    }
  })

  return {
    summary: {
      totalRevenue,
      totalMinutesSold,
      totalMinutesDelivered,
      totalMinutesRemaining,
      activeStudents,
    },
    packageTypes,
    studentsWithHours: enrichedSales
      .filter(s => s.minutesRemaining > 0)
      .sort((a, b) => b.minutesRemaining - a.minutesRemaining),
  }
}

/** One-shot balance map for all students with any package at this school.
 *  Keyed by lower-cased trimmed student_name.
 *  For students with multiple sales, prefers the most-recent unexhausted one. */
export async function getPackageBalancesForCheckins(
  schoolId: string
): Promise<Record<string, { minutesRemaining: number; hasPackage: boolean }>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('package_sales')
    .select('student_name, minutes_purchased, minutes_used, sold_at')
    .eq('school_id', schoolId)
    .order('sold_at', { ascending: false })

  const map: Record<string, { minutesRemaining: number; hasPackage: boolean }> = {}
  for (const sale of data ?? []) {
    const key = (sale.student_name ?? '').trim().toLowerCase()
    if (!key) continue
    const minutesRemaining = (sale.minutes_purchased ?? 0) - (sale.minutes_used ?? 0)
    const existing = map[key]
    if (!existing) {
      map[key] = { minutesRemaining, hasPackage: true }
    } else if (existing.minutesRemaining <= 0 && minutesRemaining > 0) {
      // Replace exhausted entry with a fresh unexhausted one
      map[key] = { minutesRemaining, hasPackage: true }
    }
  }
  return map
}

export async function getPackages(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getPackageSales(schoolId: string, limit = 20) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select(`
      id,
      student_name,
      student_nationality,
      price_paid,
      minutes_purchased,
      minutes_used,
      status,
      sold_at,
      packages ( name, sport, type ),
      users!package_sales_primary_instructor_id_fkey ( name )
    `)
    .eq('school_id', schoolId)
    .order('sold_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getPackageSaleTotals(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select('price_paid, minutes_purchased, minutes_used, status')
    .eq('school_id', schoolId)
  if (error) throw error

  const all     = data ?? []
  const active  = all.filter(s => s.status === 'active')
  const revenue = all.reduce((s, r) => s + r.price_paid, 0)
  const minLeft = active.reduce((s, r) => s + (r.minutes_purchased - r.minutes_used), 0)

  return {
    total:            all.length,
    active:           active.length,
    revenue,
    minutesRemaining: minLeft,
  }
}

export async function createPackageType(payload: {
  school_id: string
  name: string
  sport: string | null
  total_minutes: number
  base_price: number
}) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('packages')
    .insert({ ...payload, active: true })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function updatePackageType(
  id: string,
  schoolId: string,
  payload: { name: string; sport: string | null; total_minutes: number; base_price: number }
) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('packages')
    .update(payload)
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}

/** Soft delete — matches the pattern used for instructors (users.active) and
 *  everywhere else that filters `.eq('active', true)`: package_sales rows
 *  keep referencing this package_id, so a hard delete would either cascade
 *  into historical sales or fail on the FK. */
export async function deactivatePackageType(id: string, schoolId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('packages')
    .update({ active: false })
    .eq('id', id)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
}


