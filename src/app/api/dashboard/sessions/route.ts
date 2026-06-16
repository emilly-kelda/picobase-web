import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()
  const schoolId = '00000000-0000-0000-0000-000000000001'

  const { data } = await supabase
    .from('sessions')
    .select(`
      id, price, duration_min, session_date,
      checkins ( student_name ),
      activities ( name ),
      users ( name )
    `)
    .eq('school_id', schoolId)
    .order('session_date', { ascending: false })
    .limit(20)

  return NextResponse.json({ sessions: data || [] })
}
