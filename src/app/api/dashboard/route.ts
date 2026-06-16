import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()
  const schoolId = '00000000-0000-0000-0000-000000000001'

  const { data } = await supabase
    .from('v_runway')
    .select('*')
    .eq('school_id', schoolId)
    .single()

  return NextResponse.json(data || {})
}
