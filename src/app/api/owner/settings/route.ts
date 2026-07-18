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
    const schoolFields = [
      'name', 'burn_rate', 'language', 'country', 'daily_notice',
      'waiver_en', 'waiver_pt', 'waiver_fr', 'waiver_es',
      'waiver_type', 'waiver_file_global_url', 'waiver_files_by_lang',
    ]
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
    // Overlap check — two seasons sharing any day would double-count that
    // day's sessions/costs in both periods' runway math. Standard interval
    // overlap test: they collide unless one entirely precedes the other.
    const { data: otherSeasons, error: fetchError } = await supabase
      .from('seasons')
      .select('id, label, start_date, end_date')
      .eq('school_id', SCHOOL_ID)
      .neq('id', fields.id)
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const overlapping = (otherSeasons ?? []).find(s =>
      fields.start_date <= s.end_date && fields.end_date >= s.start_date
    )
    if (overlapping) {
      return NextResponse.json(
        { error: `As datas coincidem com a temporada "${overlapping.label}" (${overlapping.start_date} a ${overlapping.end_date})` },
        { status: 409 }
      )
    }

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


