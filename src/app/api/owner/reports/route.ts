import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createServiceClient()

  // 1. Revenue by month — all time
  const { data: sessionsByMonth } = await supabase
    .from('sessions')
    .select('session_date, price, commission_amount, payment_method')
    .eq('school_id', SCHOOL_ID)
    .order('session_date', { ascending: true })

  // 2. Instructor commission summary — all time
  const { data: instructorSessions } = await supabase
    .from('sessions')
    .select('instructor_id, commission_amount, price, instructor:users!sessions_instructor_id_fkey(name)')
    .eq('school_id', SCHOOL_ID)

  // 3. Partner commission summary — all time
  const { data: partnerReferrals } = await supabase
    .from('referrals')
    .select('partner_id, commission_amount, session_price, partners(name, type)')
    .eq('school_id', SCHOOL_ID)

  // 4. Payment method breakdown — all time
  const paymentSummary = (sessionsByMonth ?? []).reduce((acc, s) => {
    const method = s.payment_method ?? 'unknown'
    if (!acc[method]) acc[method] = { count: 0, total: 0 }
    acc[method].count += 1
    acc[method].total += s.price ?? 0
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Build monthly revenue data
  const monthlyData = (sessionsByMonth ?? []).reduce((acc, s) => {
    const month = s.session_date.slice(0, 7) // YYYY-MM
    if (!acc[month]) acc[month] = {
      month,
      revenue: 0,
      commissions: 0,
      net: 0,
      lessons: 0,
    }
    acc[month].revenue     += s.price ?? 0
    acc[month].commissions += s.commission_amount ?? 0
    acc[month].net         += (s.price ?? 0) - (s.commission_amount ?? 0)
    acc[month].lessons     += 1
    return acc
  }, {} as Record<string, any>)

  // Build instructor summary
  const instructorData = (instructorSessions ?? []).reduce((acc, s) => {
    const id   = s.instructor_id ?? 'unknown'
    const name = (s.instructor as any)?.name ?? 'Desconhecido'
    if (!acc[id]) acc[id] = { id, name, lessons: 0, revenue: 0, commission: 0 }
    acc[id].lessons    += 1
    acc[id].revenue    += s.price ?? 0
    acc[id].commission += s.commission_amount ?? 0
    return acc
  }, {} as Record<string, any>)

  // Build partner summary
  const partnerData = (partnerReferrals ?? []).reduce((acc, r) => {
    const id   = r.partner_id ?? 'unknown'
    const name = (r.partners as any)?.name ?? 'Desconhecido'
    const type = (r.partners as any)?.type ?? 'other'
    if (!acc[id]) acc[id] = { id, name, type, referrals: 0, revenue: 0, commission: 0 }
    acc[id].referrals  += 1
    acc[id].revenue    += r.session_price ?? 0
    acc[id].commission += r.commission_amount ?? 0
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({
    monthly:     Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
    instructors: Object.values(instructorData).sort((a, b) => b.commission - a.commission),
    partners:    Object.values(partnerData).sort((a, b) => b.revenue - a.revenue),
    payments:    paymentSummary,
  })
}
