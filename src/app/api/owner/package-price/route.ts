import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

export async function PATCH(request: Request) {
  const { package_id, price } = await request.json()

  if (!package_id || price == null) {
    return NextResponse.json({ error: 'package_id e price são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('packages')
    .update({ base_price: price })
    .eq('id', package_id)
    .eq('school_id', SCHOOL_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
