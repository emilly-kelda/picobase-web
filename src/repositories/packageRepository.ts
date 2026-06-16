import { createServiceClient } from '@/lib/supabase-server'

export async function getPackageDashboard(schoolId: string) {
  const supabase = createServiceClient()

  const [{ data: allPackages }, { data: allSales }] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name, sport, type, base_price, final_price, total_minutes')
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
      id:    pkg.id,
      name:  pkg.name,
      price: pkg.final_price ?? pkg.base_price ?? 0,
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


