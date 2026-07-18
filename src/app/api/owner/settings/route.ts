import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()
  const { type, ...fields } = body

  if (type === 'school') {
    // Partial update — only fields actually present in the request body are
    // written. Settings is now split across separate modals (General,
    // Financial, Waiver) that each only know about their own slice of
    // `schools`; sending the full row from every modal risked one modal's
    // save clobbering another's more recent edit with stale data.
    const schoolFields = ['name', 'burn_rate', 'language', 'country', 'waiver_en', 'waiver_pt', 'waiver_fr', 'waiver_es']
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of schoolFields) {
      if (key in fields) update[key] = fields[key]
    }

    const { error } = await supabase
      .from('schools')
      .update(update)
      .eq('id', SCHOOL_ID)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'season') {
    const { error } = await supabase
      .from('seasons')
      .update({
        label:      fields.label,
        start_date: fields.start_date,
        end_date:   fields.end_date,
        burn_rate:  fields.burn_rate,
      })
      .eq('id', fields.id)
      .eq('school_id', SCHOOL_ID)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


