import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const body = await request.json()
  const supabase = createServiceClient()
  const { type, ...fields } = body

  if (type === 'school') {
    const { error } = await supabase
      .from('schools')
      .update({
        name:       fields.name,
        burn_rate:  fields.burn_rate,
        language:   fields.language,
        country:    fields.country,
        waiver_en:  fields.waiver_en,
        waiver_pt:  fields.waiver_pt,
        waiver_fr:  fields.waiver_fr,
        waiver_es:  fields.waiver_es,
        updated_at: new Date().toISOString(),
      })
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


