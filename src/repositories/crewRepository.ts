import { createServiceClient } from '@/lib/supabase-server'

export async function getCrewMembers(schoolId: string) {
  const supabase = createServiceClient()

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, whatsapp, commission_pct, pix_key, wise_email, active, created_at')
    .eq('school_id', schoolId)
    .eq('role', 'instructor')
    .order('name')

  if (usersError) throw usersError

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('instructor_id, price, commission_amount')
    .eq('school_id', schoolId)

  if (sessionsError) throw sessionsError

  const statsMap = new Map<string, {
    sessions: number
    revenue: number
    commissions: number
  }>()

  for (const s of sessions ?? []) {
    const existing = statsMap.get(s.instructor_id) ?? {
      sessions: 0, revenue: 0, commissions: 0
    }
    statsMap.set(s.instructor_id, {
      sessions:    existing.sessions + 1,
      revenue:     existing.revenue + (s.price ?? 0),
      commissions: existing.commissions + (s.commission_amount ?? 0),
    })
  }

  return (users ?? []).map(u => ({
    ...u,
    stats: statsMap.get(u.id) ?? { sessions: 0, revenue: 0, commissions: 0 },
  }))
}

export async function getPayments(schoolId: string, period?: string) {
  const supabase = createServiceClient()
  const currentPeriod = period ?? new Date().toISOString().slice(0, 7)
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id, period, sessions_count, revenue_generated,
      commission_pct, commission_amount, bonus,
      total_to_pay, status, approved_at, paid_at,
      users!payments_instructor_id_fkey ( id, name, pix_key, wise_email )
    `)
    .eq('school_id', schoolId)
    .eq('period', currentPeriod)
    .order('total_to_pay', { ascending: false })
  if (error) throw error
  return { payments: data ?? [], period: currentPeriod }
}

export async function getCommissionOverrides(schoolId: string, instructorId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('commission_overrides')
    .select(`
      id, model, commission_pct, fixed_amount, priority, note, active,
      activities ( name )
    `)
    .eq('school_id', schoolId)
    .eq('instructor_id', instructorId)
    .eq('active', true)
    .order('priority', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getInstructorByToken(token: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, school_id, commission_pct, role')
    .eq('log_token', token)
    .eq('role', 'instructor')
    .eq('active', true)
    .single()
  if (error) return null
  return data
}

