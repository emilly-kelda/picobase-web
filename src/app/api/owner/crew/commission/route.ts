import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const body = await request.json()
  const { instructor_id, commission_mode, commission_pct, fixed_per_hour } = body
  const supabase = await createServerSupabaseClient()

  const mode = commission_mode === 'fixed_per_hour' ? 'fixed_per_hour' : 'percentage'

  const update: Record<string, unknown> = {
    commission_mode: mode,
    commission_pct:  mode === 'percentage'    ? commission_pct  ?? null : null,
    fixed_per_hour:  mode === 'fixed_per_hour' ? fixed_per_hour ?? null : null,
  }

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', instructor_id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
