import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const body = await request.json()
  const { instructor_id, commission_pct, fixed_per_hour } = body
  const supabase = await createServerSupabaseClient()

  const update: Record<string, unknown> = {}
  if (commission_pct !== undefined && commission_pct !== null) {
    update.commission_pct = commission_pct
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase
      .from('users')
      .update(update)
      .eq('id', instructor_id)
      .eq('school_id', SCHOOL_ID)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, fixed_per_hour: fixed_per_hour ?? null })
}
