import { createServiceClient } from '@/lib/supabase-server'

export async function getCrewMembers(schoolId: string) {
  const supabase = createServiceClient()

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(`
      id, name, email, whatsapp, commission_pct,
      commission_mode, fixed_per_hour,
      pix_key, wise_email, active, created_at,
      nationality, languages, sports, certifications,
      bio, experience_years, max_students_per_session,
      first_aid_certified, contract_type
    `)
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
      total_to_pay, status, approved_at, paid_at, instructor_id,
      users!payments_instructor_id_fkey (
        id, name, email, whatsapp,
        pix_key, wise_email, commission_pct
      )
    `)
    .eq('school_id', schoolId)
    .eq('period', currentPeriod)
    .order('total_to_pay', { ascending: false })

  if (error) throw error

  const { data: advancesData, error: advancesError } = await supabase
    .from('instructor_advances')
    .select('id, instructor_id, amount, note, created_at')
    .eq('school_id', schoolId)
    .eq('period', currentPeriod)
    .order('created_at', { ascending: false })

  if (advancesError) throw advancesError

  const advancesByInstructor = new Map<string, { id: string; amount: number; note: string | null; created_at: string }[]>()
  for (const a of advancesData ?? []) {
    const list = advancesByInstructor.get(a.instructor_id) ?? []
    list.push({ id: a.id, amount: a.amount, note: a.note, created_at: a.created_at })
    advancesByInstructor.set(a.instructor_id, list)
  }

  const payments = (data ?? []).map(p => {
    const advances = advancesByInstructor.get(p.instructor_id) ?? []
    const totalAdvances = advances.reduce((s, a) => s + (a.amount ?? 0), 0)
    const netPayout = Math.max(0, p.total_to_pay - totalAdvances)
    return { ...p, advances, totalAdvances, netPayout }
  })

  const totalPending  = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.netPayout, 0)
  const totalApproved = payments.filter(p => p.status === 'approved').reduce((s, p) => s + p.netPayout, 0)
  const totalPaid     = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.netPayout, 0)

  return {
    payments,
    period: currentPeriod,
    summary: { totalPending, totalApproved, totalPaid, total: totalPending + totalApproved + totalPaid },
  }
}

export async function getPartnerCommissions(schoolId: string, period: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      id, commission_pct, commission_amount, session_price, status, approved_at, paid_at,
      partners ( id, name, pix_key, wise_email, finance_email, type, commission_pct )
    `)
    .eq('school_id', schoolId)
    .eq('period', period)

  if (error) throw error

  const referrals = data ?? []

  const partnerMap = new Map<string, {
    partner: any
    sessions: number
    revenue: number
    commission: number
    status: string
    referral_ids: string[]
  }>()

  for (const r of referrals) {
    const partner = Array.isArray(r.partners) ? (r.partners[0] ?? null) : r.partners as any
    if (!partner) continue
    const existing = partnerMap.get(partner.id) ?? {
      partner,
      sessions: 0,
      revenue: 0,
      commission: 0,
      status: r.status,
      referral_ids: [],
    }
    partnerMap.set(partner.id, {
      ...existing,
      sessions:     existing.sessions + 1,
      revenue:      existing.revenue + (r.session_price ?? 0),
      commission:   existing.commission + (r.commission_amount ?? 0),
      referral_ids: [...existing.referral_ids, r.id],
    })
  }

  return Array.from(partnerMap.values())
    .sort((a, b) => b.commission - a.commission)
}

export async function approvePartnerCommissions(referralIds: string[], markAsPaid = false) {
  const supabase = createServiceClient()
  const update: Record<string, string> = {
    status:      markAsPaid ? 'paid' : 'approved',
    approved_at: new Date().toISOString(),
  }
  if (markAsPaid) update.paid_at = new Date().toISOString()

  const { error } = await supabase
    .from('referrals')
    .update(update)
    .in('id', referralIds)

  if (error) throw error
  return { ok: true }
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


