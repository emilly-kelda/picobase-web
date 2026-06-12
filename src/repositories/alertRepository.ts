import { createServiceClient } from '@/lib/supabase-server'

export type Alert = {
  type: 'warning' | 'info' | 'error'
  message: string
  link?: string
}

export async function getAlerts(schoolId: string): Promise<Alert[]> {
  const supabase = createServiceClient()
  const alerts: Alert[] = []

  // 1. Pending instructor payments
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('id, total_to_pay, users!payments_instructor_id_fkey(name)')
    .eq('school_id', schoolId)
    .eq('status', 'pending')

  if (pendingPayments && pendingPayments.length > 0) {
    const total = pendingPayments.reduce((s, p) => s + p.total_to_pay, 0)
    const fmt = new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(total)
    alerts.push({
      type: 'warning',
      message: `${pendingPayments.length} instructor payment${pendingPayments.length > 1 ? 's' : ''} pending approval — ${fmt} total`,
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
      alerts.push({
        type: 'error',
        message: `Medical alert — ${c.student_name}: ${c.health_condition}`,
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

  return alerts
}

