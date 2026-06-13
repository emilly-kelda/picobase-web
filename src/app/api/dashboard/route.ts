import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const schoolId = '00000000-0000-0000-0000-000000000001'

  const { data } = await supabase
    .from('v_runway')
    .select('*')
    .eq('school_id', schoolId)
    .single()

  return NextResponse.json(data || {})
}


