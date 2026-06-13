import { createServiceClient } from '@/lib/supabase-server'

export async function getSchool(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, burn_rate, currency, language, sport_types, country, waiver_en, waiver_pt, waiver_fr, waiver_es')
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

export async function getRunwayProjection(schoolId: string) {
  const supabase = createServiceClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('start_date, end_date, burn_rate, label')
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  const { data: runway } = await supabase
    .from('v_runway')
    .select('*')
    .eq('school_id', schoolId)
    .single()

  if (!season || !runway) return null

  const today          = new Date()
  const seasonEnd      = new Date(season.end_date)
  const seasonStart    = new Date(season.start_date)
  const daysLeft       = Math.max(0, Math.ceil((seasonEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const totalDays      = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed    = Math.max(0, Math.ceil((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)))
  const seasonProgress = totalDays > 0 ? Math.min(1, daysElapsed / totalDays) : 0

  const burnRate       = season.burn_rate || (runway as any).burn_rate || 5000
  const currentProfit  = (runway as any).season_profit ?? 0
  const currentRevenue = (runway as any).season_revenue ?? 0
  const currentRunway  = burnRate > 0 ? currentProfit / burnRate : 0

  const dailyRevenue    = daysElapsed > 0 ? currentRevenue / daysElapsed : 0
  const projectedExtra  = dailyRevenue * daysLeft
  const projectedProfit = currentProfit + projectedExtra * 0.62
  const projectedRunway = burnRate > 0 ? projectedProfit / burnRate : 0

  const targetMonths  = 6
  const targetProfit  = targetMonths * burnRate
  const gap           = Math.max(0, targetProfit - currentProfit)
  const projectedGap  = Math.max(0, targetProfit - projectedProfit)

  return {
    currentRunway:   Math.max(0, currentRunway),
    projectedRunway: Math.max(0, projectedRunway),
    daysLeft,
    seasonProgress,
    burnRate,
    currentProfit,
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