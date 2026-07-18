import { createServiceClient } from '@/lib/supabase-server'

/** All-time analytics for /owner/reports — one sessions scan feeds monthly
 *  revenue, the instructor and sport breakdowns, ticket médio per currency,
 *  and hours taught, since they all reduce over the same rows. */
export async function getReportData(schoolId: string) {
  const supabase = createServiceClient()

  const [
    { data: sessionsData },
    { data: partnerReferrals },
    { data: packageSalesData },
    { data: instructorsData },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        session_date, price, commission_amount, payment_method,
        currency, price_original, duration_min, instructor_id,
        checkins ( student_name ),
        instructor:users!sessions_instructor_id_fkey ( name ),
        activities ( name, sport )
      `)
      .eq('school_id', schoolId)
      .order('session_date', { ascending: true }),

    supabase
      .from('referrals')
      .select('partner_id, commission_amount, session_price, partners(name, type)')
      .eq('school_id', schoolId),

    supabase
      .from('package_sales')
      .select('student_name, sold_at, minutes_purchased, minutes_used')
      .eq('school_id', schoolId)
      .order('sold_at', { ascending: true }),

    supabase
      .from('users')
      .select('id, weekly_capacity_hours')
      .eq('school_id', schoolId)
      .in('role', ['instructor', 'owner'])
      .eq('active', true),
  ])

  const sessions = sessionsData ?? []

  // Payment method breakdown — unchanged from before
  const paymentSummary = sessions.reduce((acc, s) => {
    const method = s.payment_method ?? 'unknown'
    if (!acc[method]) acc[method] = { count: 0, total: 0 }
    acc[method].count += 1
    acc[method].total += s.price ?? 0
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Monthly revenue — unchanged shape
  const monthlyMap = sessions.reduce((acc, s) => {
    const month = s.session_date.slice(0, 7)
    if (!acc[month]) acc[month] = { month, revenue: 0, commissions: 0, net: 0, lessons: 0 }
    acc[month].revenue     += s.price ?? 0
    acc[month].commissions += s.commission_amount ?? 0
    acc[month].net         += (s.price ?? 0) - (s.commission_amount ?? 0)
    acc[month].lessons     += 1
    return acc
  }, {} as Record<string, { month: string; revenue: number; commissions: number; net: number; lessons: number }>)

  // Instructor summary — same as before, now also carries hours + net so the
  // same array backs both the Instrutores tab and the grouped table.
  const instructorMap = sessions.reduce((acc, s) => {
    const id   = s.instructor_id ?? 'unknown'
    const name = (s.instructor as any)?.name ?? 'Desconhecido'
    if (!acc[id]) acc[id] = { id, name, lessons: 0, revenue: 0, commission: 0, hours: 0 }
    acc[id].lessons    += 1
    acc[id].revenue    += s.price ?? 0
    acc[id].commission += s.commission_amount ?? 0
    acc[id].hours      += (s.duration_min ?? 0) / 60
    return acc
  }, {} as Record<string, { id: string; name: string; lessons: number; revenue: number; commission: number; hours: number }>)

  const instructorData = Object.values(instructorMap).map(i => ({ ...i, net: i.revenue - i.commission }))

  // Sport breakdown — groups by activities.sport, falling back to the
  // activity name for activities with no sport set.
  const sportMap = sessions.reduce((acc, s) => {
    const activity = s.activities as any
    const label = activity?.sport || activity?.name || 'Outros'
    if (!acc[label]) acc[label] = { sport: label, lessons: 0, revenue: 0, commissions: 0 }
    acc[label].lessons     += 1
    acc[label].revenue     += s.price ?? 0
    acc[label].commissions += s.commission_amount ?? 0
    return acc
  }, {} as Record<string, { sport: string; lessons: number; revenue: number; commissions: number }>)

  const sportData = Object.values(sportMap).map(sp => ({ ...sp, net: sp.revenue - sp.commissions }))

  // Partner summary — unchanged
  const partnerMap = (partnerReferrals ?? []).reduce((acc, r) => {
    const id   = r.partner_id ?? 'unknown'
    const name = (r.partners as any)?.name ?? 'Desconhecido'
    const type = (r.partners as any)?.type ?? 'other'
    if (!acc[id]) acc[id] = { id, name, type, referrals: 0, revenue: 0, commission: 0 }
    acc[id].referrals  += 1
    acc[id].revenue    += r.session_price ?? 0
    acc[id].commission += r.commission_amount ?? 0
    return acc
  }, {} as Record<string, { id: string; name: string; type: string; referrals: number; revenue: number; commission: number }>)

  // Ticket médio per currency — sessions.price is always the BRL-equivalent;
  // price_original holds the real amount collected for non-BRL currencies.
  const currencyGroups: Record<string, { revenue: number; students: Set<string> }> = {}
  for (const s of sessions) {
    const currency = s.currency ?? 'BRL'
    const amount = currency === 'BRL' ? (s.price ?? 0) : (s.price_original ?? 0)
    const studentName = (s.checkins as any)?.student_name
    if (!currencyGroups[currency]) currencyGroups[currency] = { revenue: 0, students: new Set() }
    currencyGroups[currency].revenue += amount ?? 0
    if (studentName) currencyGroups[currency].students.add(studentName)
  }
  const ticketMedioBRL = currencyGroups.BRL?.students.size
    ? currencyGroups.BRL.revenue / currencyGroups.BRL.students.size
    : null
  const ticketMedioEUR = currencyGroups.EUR?.students.size
    ? currencyGroups.EUR.revenue / currencyGroups.EUR.students.size
    : null

  // Occupancy — hours taught over (capacity/week × weeks spanned by the data).
  // "—" (null) when nobody has capacity configured yet, instead of 0%/Infinity.
  const totalHoursTaught = sessions.reduce((s, r) => s + (r.duration_min ?? 0) / 60, 0)
  const totalCapacityPerWeek = (instructorsData ?? [])
    .filter(u => u.weekly_capacity_hours != null)
    .reduce((s, u) => s + (u.weekly_capacity_hours ?? 0), 0)

  let weeksSpan = 1
  if (sessions.length > 0) {
    const dates = sessions.map(s => new Date(`${s.session_date}T00:00:00`).getTime())
    const first = Math.min(...dates)
    const last  = Math.max(...dates)
    weeksSpan = Math.max(1, (last - first) / (7 * 86400000))
  }

  const occupancyCapacityHours = totalCapacityPerWeek * weeksSpan
  const occupancyPct = occupancyCapacityHours > 0
    ? (totalHoursTaught / occupancyCapacityHours) * 100
    : null

  // Renewal rate — a package_sales row "completes" when fully consumed (same
  // inference getPackageDashboard uses for activeStudents); it's "renewed"
  // if that student bought another package afterward.
  const salesByStudent = new Map<string, { sold_at: string; minutes_purchased: number; minutes_used: number }[]>()
  for (const sale of packageSalesData ?? []) {
    const key = (sale.student_name ?? '').trim().toLowerCase()
    if (!key) continue
    const list = salesByStudent.get(key) ?? []
    list.push(sale)
    salesByStudent.set(key, list)
  }

  let renewalCompletions = 0
  let renewalRenewed = 0
  for (const list of salesByStudent.values()) {
    const sorted = [...list].sort((a, b) => new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime())
    sorted.forEach((sale, i) => {
      const purchased = sale.minutes_purchased ?? 0
      const used = sale.minutes_used ?? 0
      if (purchased > 0 && used >= purchased) {
        renewalCompletions += 1
        if (i < sorted.length - 1) renewalRenewed += 1
      }
    })
  }
  const renewalRatePct = renewalCompletions > 0 ? (renewalRenewed / renewalCompletions) * 100 : null

  return {
    monthly:     Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)),
    instructors: instructorData.sort((a, b) => b.commission - a.commission),
    sports:      sportData.sort((a, b) => b.revenue - a.revenue),
    partners:    Object.values(partnerMap).sort((a, b) => b.revenue - a.revenue),
    payments:    paymentSummary,
    metrics: {
      ticketMedioBRL,
      ticketMedioEUR,
      occupancyPct,
      occupancyHoursTaught: totalHoursTaught,
      occupancyCapacityHours,
      renewalRatePct,
      renewalCompletions,
      renewalRenewed,
    },
  }
}
