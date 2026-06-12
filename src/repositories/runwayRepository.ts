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

export async function getRunwayData(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('v_runway')
    .select('*')
    .eq('school_id', schoolId)
    .single()
  if (error) throw error
  return data
}

