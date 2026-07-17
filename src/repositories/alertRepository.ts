import { createServiceClient } from '@/lib/supabase-server'
import { decrypt } from '@/utils/crypto'

export type Alert = {
  type: 'warning' | 'info' | 'error'
  message: string
  link?: string
}

export async function getAlerts(schoolId: string): Promise<Alert[]> {
  const supabase = createServiceClient()
  const alerts: Alert[] = []

  // 1. Pending instructor payments
  // Select instructor_id to count distinct instructors, not payment rows.
  // One instructor can have multiple pending rows across different periods.
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('id, total_to_pay, instructor_id')
    .eq('school_id', schoolId)
    .eq('status', 'pending')

  if (pendingPayments && pendingPayments.length > 0) {
    const total = pendingPayments.reduce((s, p) => s + p.total_to_pay, 0)
    const fmt = new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(total)
    const instructorCount = new Set(pendingPayments.map(p => p.instructor_id)).size
    alerts.push({
      type: 'warning',
      message: `${instructorCount} instructor${instructorCount > 1 ? 's' : ''} with pending payments — ${fmt} total`,
      link: '/owner/payments',
    })
  }

  // 2. Active packages with less than 1h remaining
  const { data: lowPackages } = await supabase
    .from('package_sales')
    .select('id, student_name, minutes_purchased, minutes_used, packages(name)')
    .eq('school_id', schoolId)
    .eq('status', 'active')

  if (lowPackages) {
    const expiring = lowPackages.filter(p =>
      (p.minutes_purchased - p.minutes_used) <= 60 &&
      (p.minutes_purchased - p.minutes_used) > 0
    )
    for (const p of expiring) {
      const remaining = p.minutes_purchased - p.minutes_used
      const hrs = remaining >= 60
        ? `${Math.floor(remaining / 60)}h`
        : `${remaining}min`
      alerts.push({
        type: 'warning',
        message: `${p.student_name} has only ${hrs} remaining on ${(p.packages as any)?.name ?? 'package'}`,
        link: '/owner/packages',
      })
    }
  }

  // 3. Students with health conditions checked in today
  const today = new Date().toISOString().slice(0, 10)
  const { data: healthAlerts } = await supabase
    .from('checkins')
    .select('student_name, health_condition')
    .eq('school_id', schoolId)
    .gte('checkin_at', `${today}T00:00:00`)
    .not('health_condition', 'is', null)
    .neq('health_condition', '')

  if (healthAlerts) {
    for (const c of healthAlerts) {
      const condition = c.health_condition ? decrypt(c.health_condition) : c.health_condition
      alerts.push({
        type: 'error',
        message: `Medical alert — ${c.student_name}: ${condition}`,
        link: '/owner/students',
      })
    }
  }

  // 4. Sessions confirmed today (info)
  const { count: todaySessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .gte('session_date', today)
    .lte('session_date', today)

  if (todaySessions && todaySessions > 0) {
    alerts.push({
      type: 'info',
      message: `${todaySessions} session${todaySessions > 1 ? 's' : ''} confirmed today`,
      link: '/owner/sessions',
    })
  }

  // 5. Dormant packages: 0 minutes used, sold more than 7 days ago
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: dormant } = await supabase
    .from('package_sales')
    .select('student_name, sold_at, packages(name)')
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .eq('minutes_used', 0)
    .lte('sold_at', sevenDaysAgo.toISOString())

  if (dormant && dormant.length > 0) {
    for (const d of dormant) {
      alerts.push({
        type: 'info',
        message: `${d.student_name} bought ${(d.packages as any)?.name ?? 'a package'} and hasn't started yet`,
        link: '/owner/packages',
      })
    }
  }

  // 6. Outstanding receivables (sessions confirmed as "a_receber", not yet collected)
  const { data: pendingReceivables } = await supabase
    .from('sessions')
    .select('id, price')
    .eq('school_id', schoolId)
    .eq('payment_method', 'a_receber')
    .is('received_at', null)

  if (pendingReceivables && pendingReceivables.length > 0) {
    const totalReceivable = pendingReceivables.reduce((s, r) => s + (r.price ?? 0), 0)
    const fmtReceivable = new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(totalReceivable)
    alerts.push({
      type: 'warning',
      message: `${fmtReceivable} outstanding from ${pendingReceivables.length} lesson${pendingReceivables.length !== 1 ? 's' : ''} — see Payments`,
      link: '/owner/payments',
    })
  }

  // 7. Pending booking requests from the public /book/[school] intake form
  const { count: pendingBookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'pending')

  if (pendingBookingsCount && pendingBookingsCount > 0) {
    alerts.push({
      type: 'info',
      message: `${pendingBookingsCount} pedido${pendingBookingsCount !== 1 ? 's' : ''} de aula aguardando confirmação`,
      link: '/owner/bookings',
    })
  }

  return alerts
}
