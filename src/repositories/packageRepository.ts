import { createServiceClient } from '@/lib/supabase-server'
import { getSessionsByStudentName, findStudentByName } from './studentRepository'
import { getAvailablePackageMinutes } from './scheduledLessonRepository'
import { normalizeStudentName } from '@/lib/text'
import { groupSessionsBySport, type SessionForGrouping } from '@/lib/modality'

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
 *  Keyed by normalizeStudentName(student_name) (accent/case/whitespace
 *  insensitive — same key convention used everywhere else names get
 *  cross-matched without a real FK).
 *
 *  A student can hold several active package_sales at once (bought another
 *  before finishing the last one — package_sales.student_id is rarely
 *  populated, so nothing stops a second sale from being recorded against
 *  the same name). This used to keep only ONE sale (the most recent, or the
 *  most recent still-unexhausted one) and report just its balance — real
 *  case found in production: a student with three separate packages
 *  (600+60+60 min, all unused) was shown with 60min remaining, ~660min
 *  under their actual balance. Sums remaining minutes across every
 *  unexhausted sale instead. packageSaleId stays pinned to the OLDEST sale
 *  that still has balance — FIFO, the one confirm-lesson's auto-debit
 *  draws down first — so "Ver histórico" points at the sale actually being
 *  consumed next, not just whichever happens to be newest. */
export async function getPackageBalancesForCheckins(
  schoolId: string
): Promise<Record<string, { minutesRemaining: number; minutesPurchased: number; hasPackage: boolean; packageSaleId: string; packageSport: string | null }>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('package_sales')
    .select('id, student_name, minutes_purchased, minutes_used, sold_at, packages ( sport )')
    .eq('school_id', schoolId)
    .order('sold_at', { ascending: true })

  const map: Record<string, {
    minutesRemaining: number; minutesPurchased: number; packageSaleId: string; activeSaleId: string | null
    // packageSport tracks the SAME sale as packageSaleId (the pinned
    // oldest-with-balance one) — used as a display/pre-select fallback
    // when a checkin's own activity_id is null (see PendingLessons.tsx),
    // so "Sem atividade" doesn't show for a student who clearly has an
    // active package for a specific sport.
    packageSport: string | null; activeSaleSport: string | null
  }> = {}
  for (const sale of data ?? []) {
    const key = normalizeStudentName(sale.student_name)
    if (!key) continue
    const remaining = Math.max(0, (sale.minutes_purchased ?? 0) - (sale.minutes_used ?? 0))
    const pkg = Array.isArray(sale.packages) ? sale.packages[0] : sale.packages
    const saleSport = pkg?.sport ?? null
    const existing = map[key]
    if (!existing) {
      map[key] = {
        minutesRemaining: remaining,
        minutesPurchased: sale.minutes_purchased ?? 0,
        packageSaleId: sale.id,
        activeSaleId: remaining > 0 ? sale.id : null,
        packageSport: saleSport,
        activeSaleSport: remaining > 0 ? saleSport : null,
      }
    } else {
      map[key] = {
        minutesRemaining: existing.minutesRemaining + remaining,
        minutesPurchased: existing.minutesPurchased + (sale.minutes_purchased ?? 0),
        packageSaleId: existing.activeSaleId ?? sale.id,
        activeSaleId: existing.activeSaleId ?? (remaining > 0 ? sale.id : null),
        packageSport: existing.activeSaleSport ?? saleSport,
        activeSaleSport: existing.activeSaleSport ?? (remaining > 0 ? saleSport : null),
      }
    }
  }

  const result: Record<string, { minutesRemaining: number; minutesPurchased: number; hasPackage: boolean; packageSaleId: string; packageSport: string | null }> = {}
  for (const [key, v] of Object.entries(map)) {
    result[key] = { minutesRemaining: v.minutesRemaining, minutesPurchased: v.minutesPurchased, hasPackage: true, packageSaleId: v.packageSaleId, packageSport: v.packageSport }
  }
  return result
}

/** Single-student version of getPackageBalancesForCheckins, used by
 *  ConfirmLessonModal to decide whether to show the plain operational
 *  confirm flow or the full financial form.
 *
 *  Resolution order matches checkPackageCapacity exactly (same shared
 *  getAvailablePackageMinutes accounting, same FIFO fallback): prefer
 *  opts.packageSaleId — the sale actually linked on the scheduled_lessons
 *  row being confirmed, if the caller knows it — while it still has room,
 *  then fall back to the oldest active sale with any balance left. Before
 *  this shared resolution existed, this function did its own independent
 *  FIFO-by-name lookup while checkPackageCapacity checked only the linked
 *  sale with no fallback — the two could land on genuinely different
 *  sales, so the balance shown here ("10h left") could read perfectly
 *  healthy right up until confirm-lesson rejected the same confirm for
 *  insufficient capacity on the *other* (linked, since-exhausted) sale.
 *
 *  opts.excludeLessonId nets out capacity this same lesson has already
 *  reserved against its own linked sale, so re-fetching the balance for a
 *  lesson that's already contributing to "already committed" doesn't
 *  double-count itself as unavailable.
 *
 *  Returns the ONE resolved sale's own figures (not summed across every
 *  package the student holds) — pricePaid/minutesPurchased are needed to
 *  pro-rate this lesson's value for instructor commission without asking
 *  the owner to type a price for a lesson that's already paid for. */
export async function getPackageBalanceForStudent(
  schoolId: string,
  studentName: string,
  opts: { packageSaleId?: string | null; excludeLessonId?: string | null } = {}
): Promise<{
  hasPackage: boolean
  packageSaleId: string | null
  minutesRemaining: number
  minutesPurchased: number
  pricePaid: number
}> {
  const NONE = { hasPackage: false, packageSaleId: null, minutesRemaining: 0, minutesPurchased: 0, pricePaid: 0 }
  if (!studentName?.trim()) return NONE

  const supabase = createServiceClient()
  const { data: sales } = await supabase
    .from('package_sales')
    .select('id, minutes_purchased, minutes_used, price_paid')
    .eq('school_id', schoolId)
    .ilike('student_name', studentName.trim())
    .order('sold_at', { ascending: true })

  if (!sales || sales.length === 0) return NONE

  const candidateIds = opts.packageSaleId
    ? [opts.packageSaleId, ...sales.map(s => s.id).filter(id => id !== opts.packageSaleId)]
    : sales.map(s => s.id)

  for (const saleId of candidateIds) {
    if (!sales.some(s => s.id === saleId)) continue
    const info = await getAvailablePackageMinutes(schoolId, saleId, opts.excludeLessonId)
    if (info && info.available > 0) {
      return {
        hasPackage:       true,
        packageSaleId:    saleId,
        minutesRemaining: info.available,
        minutesPurchased: info.minutesPurchased,
        pricePaid:        info.pricePaid,
      }
    }
  }

  return NONE
}

/** Everything the "Extrato do Pacote" closing receipt needs: the sale's own
 *  purchase figures plus its session history (dates/instructor/duration,
 *  already carrying commission_amount per session via
 *  getSessionHistoryForPackageSale -> getSessionsByStudentName, so the
 *  receipt can roll up per-instructor payouts without a second query). */
export async function getPackageReceiptData(schoolId: string, packageSaleId: string) {
  const supabase = createServiceClient()

  const { data: sale, error } = await supabase
    .from('package_sales')
    .select('id, student_name, minutes_purchased, minutes_used, price_paid, sold_at, packages ( name, sport )')
    .eq('id', packageSaleId)
    .eq('school_id', schoolId)
    .single()

  if (error || !sale) return null

  const [history, student] = await Promise.all([
    getSessionHistoryForPackageSale(schoolId, packageSaleId),
    findStudentByName(schoolId, sale.student_name),
  ])
  const pkg = Array.isArray(sale.packages) ? sale.packages[0] : sale.packages

  // Derived from this package's own realized sessions (via the same
  // groupSessionsBySport the certificate route itself uses to look up
  // hours), not packages.sport — a package's declared sport and the actual
  // activity logged against its sessions can drift apart (wrong activity
  // picked at confirm time, etc.), and a mismatch here would make the
  // certificate link 404 even though the student has real completed hours.
  // Picks the modality with the most minutes in this package's window, in
  // case sessions span more than one (rare, but safer than "first").
  const sportGroups = groupSessionsBySport((history?.sessions ?? []) as unknown as SessionForGrouping[])
  const sport = [...sportGroups.entries()].sort((a, b) => b[1].minutes - a[1].minutes)[0]?.[0] ?? null

  return {
    studentName:      sale.student_name,
    packageName:      pkg?.name ?? null,
    minutesPurchased: sale.minutes_purchased ?? 0,
    minutesUsed:      sale.minutes_used ?? 0,
    pricePaid:        sale.price_paid ?? 0,
    soldAt:           sale.sold_at,
    sessions:         history?.sessions ?? [],
    // For the new per-student+sport certificate link (see
    // /api/owner/certificate/[studentId]/[sport]) — both null when this
    // package belongs to a check-in-only "student" (no real students row)
    // or has no realized sessions yet, in which case the receipt modal
    // simply doesn't offer a certificate link.
    studentId: student?.id ?? null,
    sport,
  }
}

/** Marks a package_sale as completed once its closing receipt is
 *  finalized — additive, no other query in the app filters this row out by
 *  reading status (getPackageSaleTotals and getVariableCostForStudent both
 *  check status = 'active', which is correct: a completed package should
 *  no longer contribute to "active" balance totals or accept new variable-
 *  cost deductions). Does not touch minutes_used/price_paid — those were
 *  already correct going in; this is purely a lifecycle flag. */
export async function closePackageSale(schoolId: string, packageSaleId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('package_sales')
    .update({ status: 'completed' })
    .eq('id', packageSaleId)
    .eq('school_id', schoolId)
  if (error) throw error
  return { ok: true }
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

/** Session history for one package_sale. There's no reliable FK from
 *  package_sales to sessions — this bounds
 *  the student's name-matched session list to the window between this
 *  sale's sold_at and their NEXT sale's sold_at (or now, if this is their
 *  latest), so a student who bought a second package doesn't have the
 *  first package's history bleed into the second's. Approximate, not exact
 *  — the best available given the schema. */
export async function getSessionHistoryForPackageSale(schoolId: string, packageSaleId: string) {
  const supabase = createServiceClient()

  const { data: sale, error } = await supabase
    .from('package_sales')
    .select('id, student_name, sold_at')
    .eq('id', packageSaleId)
    .eq('school_id', schoolId)
    .single()

  if (error || !sale) return null

  const { data: laterSales } = await supabase
    .from('package_sales')
    .select('sold_at')
    .eq('school_id', schoolId)
    .ilike('student_name', sale.student_name)
    .gt('sold_at', sale.sold_at)
    .order('sold_at', { ascending: true })
    .limit(1)

  const windowEnd = laterSales?.[0]?.sold_at ?? null
  const allSessions = await getSessionsByStudentName(schoolId, sale.student_name)

  const sessions = allSessions.filter(s => {
    if (s.session_date < sale.sold_at.slice(0, 10)) return false
    if (windowEnd && s.session_date >= windowEnd.slice(0, 10)) return false
    return true
  })

  return { studentName: sale.student_name, sessions }
}

