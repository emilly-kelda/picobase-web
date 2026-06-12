import { createServiceClient } from '@/lib/supabase-server'

export async function getStudents(schoolId: string, search?: string) {
  const supabase = createServiceClient()
  let query = supabase
    .from('students')
    .select(`
      id,
      name,
      email,
      whatsapp,
      nationality,
      skill_level,
      health_conditions,
      created_at
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getStudentCount(schoolId: string) {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
  if (error) throw error
  return count ?? 0
}

export async function getStudentById(schoolId: string, id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, name, email, whatsapp, nationality, skill_level, health_conditions, created_at')
    .eq('school_id', schoolId)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getSessionsByStudent(schoolId: string, studentName: string) {
  const supabase = createServiceClient()
  const { data: checkinData } = await supabase
    .from('checkins')
    .select('session_id')
    .eq('school_id', schoolId)
    .eq('student_name', studentName)
  const sessionIds = (checkinData ?? []).map((c: any) => c.session_id).filter(Boolean)
  if (sessionIds.length === 0) return []
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, session_date, duration_min, price, commission_amount,
      users!sessions_instructor_id_fkey ( name ),
      activities ( name )
    `)
    .in('id', sessionIds)
    .order('session_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getActivePackagesByStudent(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('package_sales')
    .select(`
      id,
      student_name,
      minutes_purchased,
      minutes_used,
      status,
      packages ( name )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'active')
  if (error) throw error

  const map = new Map<string, {
    id: string
    minutes_purchased: number
    minutes_used: number
    package_name: string
  }>()

  for (const sale of data ?? []) {
    map.set(sale.student_name, {
      id: sale.id,
      minutes_purchased: sale.minutes_purchased,
      minutes_used: sale.minutes_used,
      package_name: (sale.packages as any)?.name ?? 'Package',
    })
  }

  return map
}

export async function getInstructors(schoolId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('school_id', schoolId)
    .eq('role', 'instructor')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

