import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()
  const schoolId = '00000000-0000-0000-0000-000000000001'

  const { data } = await supabase
    .from('payments')
    .select(`
      id, period, sessions_count,
      total_to_pay, status,
      users ( name )
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .order('period', { ascending: false })

  return NextResponse.json({ payments: data || [] })
}
