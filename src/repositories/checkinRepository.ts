import { createServiceClient } from '@/lib/supabase-server'

export async function getSchoolBySlug(slug: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, slug, language, sport_types, waiver_en, waiver_pt, waiver_fr, waiver_es')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getActivitiesForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('activities')
    .select('id, name, default_price, default_duration_min')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('sort_order')
  return data ?? []
}

export async function getInstructorsForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, name')
    .eq('school_id', schoolId)
    .eq('role', 'instructor')
    .eq('active', true)
    .order('name')
  return data ?? []
}

export async function getPartnersForCheckin(schoolId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('partners')
    .select('id, name, type')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('name')
  return data ?? []
}


