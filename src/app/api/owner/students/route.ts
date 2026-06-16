import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: Request) {
  const { name, nationality, whatsapp } = await request.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('students')
    .insert({
      school_id:   SCHOOL_ID,
      name:        name.trim(),
      nationality: nationality ?? null,
      whatsapp:    whatsapp ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
