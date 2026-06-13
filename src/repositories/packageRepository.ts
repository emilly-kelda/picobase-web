import { createServiceClient } from '@/lib/supabase-server'

export async function getPackages(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getPackageSales(schoolId: string, limit = 20) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select(`
      id,
      student_name,
      student_nationality,
      price_paid,
      minutes_purchased,
      minutes_used,
      status,
      sold_at,
      packages ( name, sport, type ),
      users!package_sales_primary_instructor_id_fkey ( name )
    `)
    .eq('school_id', schoolId)
    .order('sold_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getPackageSaleTotals(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select('price_paid, minutes_purchased, minutes_used, status')
    .eq('school_id', schoolId)
  if (error) throw error

  const all     = data ?? []
  const active  = all.filter(s => s.status === 'active')
  const revenue = all.reduce((s, r) => s + r.price_paid, 0)
  const minLeft = active.reduce((s, r) => s + (r.minutes_purchased - r.minutes_used), 0)

  return {
    total:            all.length,
    active:           active.length,
    revenue,
    minutesRemaining: minLeft,
  }
}


