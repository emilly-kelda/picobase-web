import { createServiceClient } from '@/lib/supabase-server'
import { getMonthlyCostTotal } from '@/repositories/costRepository'

export async function getSchool(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, burn_rate, currency, language, sport_types, country, waiver_en, waiver_pt, waiver_fr, waiver_es, daily_notice, waiver_type, waiver_file_global_url, waiver_files_by_lang, notify_student_before_class, notify_payment_and_waiver, notify_instructor_on_checkin, notify_package_low, notify_late_cancellation, notify_post_class_feedback, payout_model, fixed_payout_value, privacy_policy_url')
    .eq('id', schoolId)
    .single()
  if (error) throw error
  return data
}

export async function getSeasons(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('seasons')
    .select('id, label, start_date, end_date, burn_rate')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

// seasonId must mirror getRunwayData's own resolution exactly (same RPC when
// present, same v_runway fallback when not) — this used to always read
// v_runway for revenue/profit while independently grabbing "the most recent
// season by start_date" for the referrals date-range filter, so switching
// the active-season cookie changed season_revenue/crew_commissions (read via
// getRunwayData elsewhere) without changing totalPartnerCommissions here,
// silently mixing two different "current season" windows in one card.
export async function getRunwayProjection(schoolId: string, seasonId?: string) {
  const supabase = createServiceClient()

  const seasonQuery = seasonId
    ? supabase
        .from('seasons')
        .select('start_date, end_date, burn_rate, label')
        .eq('id', seasonId)
        .eq('school_id', schoolId)
        .single()
    : supabase
        .from('seasons')
        .select('start_date, end_date, burn_rate, label')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

  const runwayQuery = seasonId
    ? supabase.rpc('get_runway_by_season', { p_school_id: schoolId, p_season_id: seasonId }).single()
    : supabase.from('v_runway').select('*').eq('school_id', schoolId).single()

  const [{ data: season }, { data: runway }] = await Promise.all([seasonQuery, runwayQuery])

  if (!season || !runway) return null

  const today          = new Date()
  const seasonEnd      = new Date(season.end_date)
  const seasonStart    = new Date(season.start_date)
  const daysLeft       = Math.max(0, Math.ceil((seasonEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays      = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed    = Math.max(0, Math.ceil((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)))
  const seasonProgress = totalDays > 0 ? Math.min(1, daysElapsed / totalDays) : 0

  // Real itemized costs (operational_costs) take priority over the
  // manually-set burn_rate once a school starts logging them — see
  // costRepository.getMonthlyCostTotal for the mensal + anual/12 formula.
  // Falls back to the existing chain when there's no cost data yet, so
  // schools that haven't adopted the Custos tab keep working unchanged.
  const realMonthlyCosts = await getMonthlyCostTotal(schoolId)
  const burnRate       = realMonthlyCosts > 0 ? realMonthlyCosts : (season.burn_rate || (runway as any).burn_rate || 5000)
  const currentProfit  = (runway as any).season_profit ?? 0
  const currentRevenue = (runway as any).season_revenue ?? 0

  const seasonStartPeriod = season.start_date.slice(0, 7)
  const seasonEndPeriod   = season.end_date.slice(0, 7)

  const { data: partnerReferrals } = await supabase
    .from('referrals')
    .select('commission_amount')
    .eq('school_id', schoolId)
    .gte('period', seasonStartPeriod)
    .lte('period', seasonEndPeriod)

  const totalPartnerCommissions = (partnerReferrals ?? [])
    .reduce((sum, r) => sum + (r.commission_amount ?? 0), 0)

  // rawNetProfit is the real figure (can go negative) — used for the "Lucro
  // líquido" display. adjustedNetProfit stays floored at 0 for the runway-
  // months/gap math below, where a negative value wouldn't mean anything
  // (there's no such thing as "-2 months of runway" in that formula) — but
  // that floor was also leaking into what got shown as net profit, hiding a
  // real loss behind "R$ 0,00".
  const rawNetProfit      = currentProfit - totalPartnerCommissions
  const adjustedNetProfit = Math.max(0, rawNetProfit)
  const currentRunway     = burnRate > 0 ? adjustedNetProfit / burnRate : 0

  const dailyRevenue    = daysElapsed > 0 ? currentRevenue / daysElapsed : 0
  const projectedExtra  = dailyRevenue * daysLeft
  const projectedProfit = adjustedNetProfit + projectedExtra * 0.62
  const projectedRunway = burnRate > 0 ? projectedProfit / burnRate : 0

  const targetMonths  = 6
  const targetProfit  = targetMonths * burnRate
  const gap           = Math.max(0, targetProfit - adjustedNetProfit)
  const projectedGap  = Math.max(0, targetProfit - projectedProfit)

  return {
    currentRunway:          Math.max(0, currentRunway),
    projectedRunway:        Math.max(0, projectedRunway),
    daysLeft,
    seasonProgress,
    burnRate,
    currentProfit,
    adjustedNetProfit,
    rawNetProfit,
    totalPartnerCommissions,
    projectedProfit,
    gap,
    projectedGap,
    dailyRevenue,
    seasonLabel:   season.label,
    seasonEnd:     season.end_date,
    targetMonths,
  }
}

export async function getRunwayData(schoolId: string, seasonId?: string) {
  const supabase = createServiceClient()

  if (seasonId) {
    const { data, error } = await supabase
      .rpc('get_runway_by_season', {
        p_school_id: schoolId,
        p_season_id: seasonId,
      })
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('v_runway')
    .select('*')
    .eq('school_id', schoolId)
    .single()
  if (error) throw error
  return data
}