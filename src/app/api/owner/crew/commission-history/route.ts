import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instructorId = searchParams.get('instructor_id')

  if (!instructorId) {
    return NextResponse.json({ history: [] })
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('commission_history')
    .select('*')
    .eq('school_id', SCHOOL_ID)
    .eq('instructor_id', instructorId)
    .order('changed_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ history: data ?? [] })
}
